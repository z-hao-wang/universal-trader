import { GzReader } from './gzReader';
import { dataUtils, SimContractEx, tfUtils, TradeDbSchemaV2 } from 'basic-backtest';
import CandleSchema = SimContractEx.CandleSchema;
export const baseDataDir = `market-data`;
const getUTCDateFromTime = dataUtils.getUTCDateFromTime;
const fs = require('fs');

export interface ObStreamShared {
  c: number;
  pair?: string;
  b: number[][];
  a: number[][];
  ts: number;
  e: 's' | 'u';
}

export async function loadLocalDataFile(fileName: string, onDataRow: (row: any) => any) {
  const reader = new GzReader(`${baseDataDir}/${fileName}`);
  await reader.readStream(data => {
    // console.log(`data`, data)
    return onDataRow(data);
  });
}

async function loadDatafile(
  channel: 'tf' | 'obstream' | 'tfa' | 'candles',
  exchange: string,
  pairDb: string,
  startDate: Date,
  onData: (data: any) => any,
) {
  const fileName = `${channel}/${exchange}/${channel}-${exchange}-${pairDb}-${getUTCDateFromTime(startDate)}.gz`;
  console.log(`load raw ${channel} file `, `${baseDataDir}/${fileName}`);
  if (!fs.existsSync(`${baseDataDir}/${fileName}`)) {
    throw new Error(`read ${channel} ${pairDb}, ${startDate.toISOString()} failed`);
  } else {
    return await loadLocalDataFile(fileName, onData);
  }
}

export async function fetchDailyRawObStreams(
  exchange: string,
  pairDb: string,
  startDate: Date,
  onObstream: (obstream: ObStreamShared) => any,
): Promise<void> {
  const isRoundStart = startDate.getUTCHours() === 0 && startDate.getUTCMinutes() === 0 ? true : false;
  if (!isRoundStart) {
    throw new Error(`fetchDailyRawObStreams requires time start at 00:00:00 ${startDate.toISOString()}`);
  }
  try {
    await loadDatafile('obstream', exchange, pairDb, startDate, ob => {
      onObstream(ob);
    });
  } catch (e) {
    // most likely failed
    throw new Error(e);
  }
}

export async function fetchDailyRawTrades(
  exchange: string,
  pairDb: string,
  startDate: Date,
): Promise<TradeDbSchemaV2[]> {
  const isRoundStart = startDate.getUTCHours() === 0 && startDate.getUTCMinutes() === 0 ? true : false;
  if (!isRoundStart) {
    throw new Error(`fetchDailyRawData requires time start at 00:00:00`);
  }
  try {
    return await loadRawTradesFromFile(exchange, pairDb, startDate);
  } catch (e) {
    // most likely failed
    throw new Error(e);
  }
}

export async function loadRawTradesFromFile(
  exchange: string,
  pairDb: string,
  startDate: Date,
): Promise<TradeDbSchemaV2[]> {
  const trades: TradeDbSchemaV2[] = [];
  const pairNum = tfUtils.pairDbToNumber(pairDb, exchange);
  await loadDatafile('tf', exchange, pairDb, startDate, (trade: any) => {
    // because pairNum can be dynamically generated, we have to replace the pairNum with the actual pairNum generated from the code.
    trade[4] = pairNum;
    trades.push(trade);
  });
  return trades;
}

export async function loadAggregateTradesFromFile(
  exchange: string,
  pairDb: string,
  startDate: Date,
): Promise<TradeDbSchemaV2[]> {
  const trades: TradeDbSchemaV2[] = [];
  const pairNum = tfUtils.pairDbToNumber(pairDb, exchange);
  await loadDatafile('tfa', exchange, pairDb, startDate, (trade: any) => {
    // because pairNum can be dynamically generated, we have to replace the pairNum with the actual pairNum generated from the code.
    trade[4] = pairNum;
    trades.push(trade);
  });
  return trades;
}

export async function loadCandlesFromFile(exchange: string, pairDb: string, startDate: Date): Promise<CandleSchema[]> {
  const candles: CandleSchema[] = [];
  await loadDatafile('candles', exchange, pairDb, startDate, (trade: any) => {
    // because pairNum can be dynamically generated, we have to replace the pairNum with the actual pairNum generated from the code.
    candles.push(trade);
  });
  return candles;
}

import { GzReader } from './gzReader';
import { dataUtils, SimContractEx, tfUtils, TradeDbSchemaV2 } from 'basic-backtest';
import CandleSchema = SimContractEx.CandleSchema;
export const baseDataDir = `market-data`;
const getUTCDateFromTime = dataUtils.getUTCDateFromTime;
import * as _ from 'lodash';

const fs = require('fs');
const http = require('https');
const mkdirp = require('mkdirp');
const BASE_DOWNLOAD_URL = process.env.BASE_DOWNLOAD_URL;
console.log(`BASE_DOWNLOAD_URL`, BASE_DOWNLOAD_URL);

export async function downloadDataFile(fileName: string) {
  console.log(`downloading data file ${fileName}`);
  const paths = fileName.split('/');
  const path = paths.slice(0, paths.length - 1).join('/');
  mkdirp.sync(`${baseDataDir}/${path}`);
  return new Promise((resolve, reject) => {
    // const url = `https://sfo2.digitaloceanspaces.com/qsltd/market-data/${fileName}`;
    const url = `${BASE_DOWNLOAD_URL}/${fileName}`;
    const targetFilePath = `${baseDataDir}/${fileName}`;
    console.log(`downloading url ${url} to ${targetFilePath}`);
    http
      .get(url, function(response: any) {
        if (response.statusCode !== 200) {
          console.error(`unable to download file ${fileName} statusCode=${response.statusCode}`);
          return reject(`unable to download file ${fileName} statusCode=${response.statusCode}`);
        }
        const file = fs.createWriteStream(targetFilePath);
        response.pipe(file);
        file.on('finish', function() {
          console.log(`finished downloading data file ${fileName}`);
          file.close(resolve); // close() is async, call cb after close completes.
        });
      })
      .on('error', function(err: any) {
        // Handle errors
        console.error(`failed to download file ${fileName}`);
        fs.unlink(targetFilePath, _.noop); // Delete the file async. (But we don't check the result)
        reject(err.message);
      });
  });
}

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
    try {
      await downloadDataFile(fileName);
      return await loadLocalDataFile(fileName, onData);
    } catch (err) {
      console.error(err);
      throw new Error(`read ${channel} ${pairDb}, ${startDate.toISOString()} failed`);
    }
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

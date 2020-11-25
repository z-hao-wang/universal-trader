import { dataUtils, OrderBookSchema, TradeDbSchemaV2, tfUtils } from 'basic-backtest';
import * as _ from 'lodash';
import {
  fetchDailyRawTrades,
  loadAggregateTradesFromFile,
  ObStreamShared,
  fetchDailyRawObStreams,
  loadCandlesFromFile,
} from './dataFileLoadingUtils';
import { NormalizedObKeeper } from 'bitmex-ws-orderbook';

const MS_ONE_DAY = 86400 * 1000;

export async function loadTfsV2(
  startDate: Date,
  endDate: Date,
  tradesExchanges: string[],
  tradesPairDbs: string[],
  enableRawTrades?: boolean,
): Promise<TradeDbSchemaV2[]> {
  let tfs: TradeDbSchemaV2[] = [];

  for (let currentTs = startDate.getTime(); currentTs < endDate.getTime(); currentTs += MS_ONE_DAY) {
    if (enableRawTrades) {
      const tfArr = await loadDailyRawTfs(new Date(currentTs), tradesExchanges, tradesPairDbs);
      tfs = tfs.concat(tfArr);
    } else {
      const tfArr = await loadDailyAggregateTfs(new Date(currentTs), tradesExchanges, tradesPairDbs);
      tfs = tfs.concat(tfArr);
    }
  }
  return tfs;
}

export async function loadCandlesV2(
  startDate: Date,
  endDate: Date,
  tradesExchanges: string[],
  tradesPairDbs: string[],
): Promise<TradeDbSchemaV2[]> {
  let tfs: TradeDbSchemaV2[] = [];
  for (let currentTs = startDate.getTime(); currentTs < endDate.getTime(); currentTs += MS_ONE_DAY) {
    const tfArr = await loadCandles(new Date(currentTs), tradesExchanges, tradesPairDbs);
    tfs = tfs.concat(tfArr);
  }
  return tfs;
}

export async function loadCandles(
  startDate: Date,
  tradesExchanges: string[],
  tradesPairDbs: string[],
): Promise<TradeDbSchemaV2[]> {
  let tfArr: TradeDbSchemaV2[] = [];
  for (let i = 0; i < tradesExchanges!.length; i++) {
    const tfArrSub = await loadCandlesFromFile(tradesExchanges[i], tradesPairDbs[i], startDate);
    tfArr = dataUtils.mergeTimeSeries(tfArr, tfArrSub);
  }
  return tfArr;
}

export async function loadDailyAggregateTfs(
  startDate: Date,
  tradesExchanges: string[],
  tradesPairDbs: string[],
): Promise<TradeDbSchemaV2[]> {
  let tfArr: TradeDbSchemaV2[] = [];
  for (let i = 0; i < tradesExchanges!.length; i++) {
    const tfArrSub = await loadAggregateTradesFromFile(tradesExchanges[i], tradesPairDbs[i], startDate);
    tfArr = dataUtils.mergeTfV2(tfArr, tfArrSub);
  }
  return tfArr;
}

// only supports daily
export async function loadDailyRawTfs(startDate: Date, tradesExchanges: string[], tradesPairDbs: string[]) {
  return loadDailyRawTfsDirect(startDate, tradesExchanges, tradesPairDbs);
}

export async function loadDailyRawTfsDirect(startDate: Date, tradesExchanges: string[], tradesPairDbs: string[]) {
  let tfArr: TradeDbSchemaV2[] = [];
  for (let i = 0; i < tradesExchanges!.length; i++) {
    // let startPerfTs = Date.now();
    const tfArrSub = await fetchDailyRawTrades(tradesExchanges[i], tradesPairDbs[i], startDate);
    tfArr = dataUtils.mergeTfV2(tfArr, tfArrSub);
  }
  return tfArr;
}

export async function loadObs(params: {
  constantObj: any;
  obExchanges: string[];
  obPairDbs: string[];
  startDate: string | Date;
  endDate: string | Date;
  silent?: boolean;
}) {
  const { constantObj, obExchanges, obPairDbs, startDate, endDate, silent } = params;
  let obs: OrderBookSchema[] = [];

  if (!_.isEmpty(obExchanges)) {
    // load all rest obs and merge with main ob.
    for (let i = 0; i < obExchanges!.length; i++) {
      let obSub: OrderBookSchema[] = [];
      const startTimePerf = Date.now();
      if (constantObj.realtimeObLevels && constantObj.realtimeObLevels > 0) {
        // fetch raw realtime obs and merge them.
        obSub = await fetchRealtimeObs({
          startDate,
          endDate,
          exchange: obExchanges[i],
          pairDb: obPairDbs![i],
          depth: constantObj.realtimeObLevels,
          minGapMs: constantObj.minObGapMs,
          silent,
        });
        console.log(`${obExchanges[i]} obSub loaded len=${obSub.length}`);
      }
      // merge all obs into one ob
      if (!silent) {
        console.log(
          `obSub loaded ${obExchanges[i]} ${obPairDbs![i]} realtimeObLevels=${constantObj.realtimeObLevels ||
            0} minGap=${constantObj.minObGapMs || 0} len=${obSub.length} took ${Date.now() - startTimePerf}ms`,
        );
      }
      obs = dataUtils.mergeTimeSeries(obs, obSub);
    }
    if (!silent) {
      console.log(`obs loaded startDate=${new Date(startDate).toISOString()} length=${obs.length}`);
    }
  }
  return obs;
}

export async function fetchRealtimeObs(options: {
  startDate: string | Date;
  endDate: string | Date;
  exchange: string;
  pairDb: string;
  depth: number;
  minGapMs?: number;
  silent?: boolean;
}): Promise<OrderBookSchema[]> {
  const { startDate, endDate, exchange, pairDb, depth, minGapMs = 0, silent } = options;
  const keeperOptions = { enableEvent: false, silentMode: true };
  const keeper = new NormalizedObKeeper(keeperOptions);
  let lastInsertedTs = 0;
  const obs: OrderBookSchema[] = [];
  function pushOb(ob: OrderBookSchema | null, ts: number) {
    if (!ob) {
      return;
    }
    if (ob && (!minGapMs || ts - lastInsertedTs > minGapMs)) {
      obs.push({
        bids: ob.bids,
        asks: ob.asks,
        ts,
        c: tfUtils.pairDbToNumber(pairDb, exchange),
      });
      lastInsertedTs = ts;
    }
  }

  function onReceiveData(data: any) {
    const ob = generateObFromRealtimeObNormalized({ depth, pairDb, keeper, data });
    pushOb(ob, data.ts);
  }

  const startDateTs = new Date(startDate).getTime();
  const endDateTs = new Date(endDate).getTime();

  for (let currentDateTs = startDateTs; currentDateTs < endDateTs; currentDateTs += 86400000) {
    await fetchDailyRawObStreams(exchange, pairDb, new Date(currentDateTs), onReceiveData);
  }
  return obs;
}

function generateObFromRealtimeObNormalized(params: {
  depth: number;
  pairDb: string;
  keeper: NormalizedObKeeper;
  data: ObStreamShared;
}): OrderBookSchema | null {
  const { keeper, data, pairDb, depth } = params;
  data.pair = pairDb;
  keeper.onData(data);
  const ob = keeper.getOrderBookWs(pairDb, depth);
  if (!ob || ob.bids.length === 0 || ob.asks.length === 0) {
    // console.error(`${exchange} empty ob found bids=${ob.bids.length} asks=${ob.asks.length}`);
    //throw new Error(`invalid ob`);
    return null;
  }
  return ob as any;
}

import { evaluateProfit, traderUtils, TraderContractUltraHfBackTest, dataUtils } from 'basic-backtest';
import * as _ from 'lodash';
/*
export interface Position {
    amountClosed?: number;
    amountCurrency: number; // amount remaining
    side: number;
    price: number;
    pairDb: number;
  }

Trade Schema:
 ts: number; // timestamp
 s: number;
 r: number;
 a: number;
 c: number; // pairDb


 */
// const obj = new addon.CppTrader(0);
// const position = {
//     amountCurrency: 100,
//     side: 0,
//     price: 9000,
//     pair: 0,
// }
// const activeOrders = [{
//     side: 0,
//     price: 9001,
//     amountCurrency: 100,
// }, {
//     side: 1,
//     price: 9003,
//     amountCurrency: 100,
// }];
// //  [ ts, side, price, amount, pair ]
// const trade = [1579470323360, 0, 9001.5, 0.12, 0];
//
// console.log( obj.receiveTrade(trade, position, activeOrders) ); // 15
//
// // [ts, pair, bid1.price, bid1.amount, ask1.price, ask1.amount, bid2.price, ...]
// const ob = [1579470323360, 0, 9001, 0.12, 9001.5, 0.4];
//
// console.log( obj.receiveOb(ob) ); // 15
// change this to switch to different type of strategies
const STRATEGY_NAME = process.argv[2] || 'pythonSample';
console.log(`STRATEGY_NAME`, process.argv[2]);

const basePath = '../../../../dist/strategies';
const strategy = traderUtils.loadStrategy(basePath, STRATEGY_NAME);
const constantsObj = TraderContractUltraHfBackTest.getConstantsObj(strategy);
const tf1 = require('../data/bitmex_fx-USD_BTC_perpetual_swap-tf.json');
const tf2 = require('../data/binance_fx-USD_BTC_perpetual_swap-tf.json');
const ob1 = require('../data/bitmex_fx-USD_BTC_perpetual_swap-ob.json');
const ob2 = require('../data/binance_fx-USD_BTC_perpetual_swap-ob.json');
const funding1 = require('../data/bitmex_fx-USD_BTC_perpetual_swap-funding.json');
const funding2 = require('../data/binance_fx-USD_BTC_perpetual_swap-funding.json');

const dualExchange = STRATEGY_NAME === 'pythonSampleDualExchange';
const hours = 2;
const tfArr = (() => {
  let arr = dualExchange ? dataUtils.mergeTfV2(tf1, tf2) : tf1;
  if (hours > 0) {
    arr = _.filter(arr, a => a[0] <= arr[0][0] + hours * 3600 * 1000);
  }
  return arr;
})();
const obs = (() => {
  let obsTmp = dualExchange ? dataUtils.mergeTimeSeries(ob1, ob2) : ob1;
  if (hours > 0) {
    obsTmp = _.filter(obsTmp, a => a.ts <= obsTmp[0].ts + hours * 3600 * 1000);
  }
  return obsTmp;
})();
console.log(`tfflen=${tfArr.length} tf1Len=${tf1.length} obsLen=${obs.length}`);

const dataExchanges: any = {
  tfArr,
  obs,
  fundingInfo: funding1,
  fundingInfo2: funding2,
  traderOptions: {
    basePath,
    // toggle this to cppStrategy or pythonStrategy
    version: STRATEGY_NAME,
    isBackTesting: true,
    startingPrinciple: 10,
    isFittingOnly: false,
    pairDb: 'USD_BTC_perpetual_swap',
    exchange: 'bitmex_fx',
    leverage: 5,
    takerFee: 0.00075,
    makerFee: -0.00025,
    takerFee2: 0.0004,
    makerFee2: 0.0002,
    initialAssetMap: { BTC: 10, USD: 0 },
    baseCurrencySymbol: 'USD',
    tradingPairDbCode: ob1[0].c,
    tradingPairDbCode2: ob2[0].c,
    strategyOptions: {
      ...constantsObj,
    },
  },
};
const { trader, fitnessMetric } = evaluateProfit(dataExchanges);
console.log(`fitnessMetric`, fitnessMetric);

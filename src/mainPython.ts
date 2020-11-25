import { traderUtils, tfUtils, TraderContractUltraHfBackTest } from 'basic-backtest';
import { loadTfsV2, loadObs, loadCandlesV2 } from './utils/dataLoadingUtils';
import * as _ from 'lodash';
// change this to switch to different type of strategies
const STRATEGY_NAME = process.argv[2] || 'pythonSample';
console.log(`STRATEGY_NAME`, process.argv[2]);

const startDate = '2020-06-01T00:00:00.000Z';
const endDate = '2020-06-03T00:00:00.000Z';
const tradesExchanges = ['bitmex_fx'];
const tradesPairDbs = ['USD_BTC_perpetual_swap'];

async function main() {
  const basePath = '../../../../dist/strategies';
  const strategy = traderUtils.loadStrategy(basePath, STRATEGY_NAME);
  const constantsObj = traderUtils.getConstantsObj(strategy);
  const tfs = await loadTfsV2(
    new Date(startDate),
    new Date(endDate),
    tradesExchanges,
    tradesPairDbs,
    constantsObj.enableRawTrades,
  );

  let candles: any = [];
  if (constantsObj.requireCandle) {
    candles = await loadCandlesV2(
      new Date(new Date(startDate).getTime() - constantsObj.requireCandle.preloadSeconds * 1000),
      new Date(endDate),
      tradesExchanges,
      tradesPairDbs,
    );
  }

  console.log(`trades len=${tfs.length}`);

  const dataExchanges: any = {
    tfArr: tfs,
    candles,
    fundingInfo: [],
    fundingInfo2: [],
    traderOptions: {
      basePath,
      // toggle this to cppStrategy or pythonStrategy
      version: STRATEGY_NAME,
      isBackTesting: true,
      startingPrinciple: 10,
      isFittingOnly: false,
      pairDb: tradesPairDbs[0],
      exchange: tradesExchanges[0],
      leverage: 5,
      takerFee: 0.00075,
      makerFee: -0.00025,
      takerFee2: 0.0004,
      makerFee2: 0.0002,
      initialAssetMap: { BTC: 10, USD: 0 },
      baseCurrencySymbol: 'BTC',
      tradingPairDbCode: tfUtils.pairDbToNumber(tradesPairDbs[0], tradesExchanges[0]),
      tradingPairDbCode2: tfUtils.pairDbToNumber(_.last(tradesPairDbs)!, _.last(tradesExchanges)!),
      strategyOptions: {
        ...constantsObj,
      },
    },
  };
  const trader = new TraderContractUltraHfBackTest(dataExchanges.traderOptions as any);
  trader.setCandles(candles);

  let tfArrIndex = 0;
  if (constantsObj.realtimeObLevels) {
    let currentDateTs = new Date(startDate).getTime();
    const endDateTs = new Date(endDate).getTime();
    while (currentDateTs < endDateTs) {
      currentDateTs += 86400000;
      const obs = await loadObs({
        constantObj: constantsObj,
        obExchanges: tradesExchanges,
        obPairDbs: tradesPairDbs,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      });
      for (const ob of obs) {
        while (tfArrIndex < tfs.length && tfs[tfArrIndex][0] < ob.ts) {
          trader.onReceiveTf(tfs[tfArrIndex]);
          tfArrIndex++;
        }
        trader.onReceiveOb(ob);
      }
    }
  } else {
    while (tfArrIndex < tfs.length) {
      trader.onReceiveTf(tfs[tfArrIndex]);
      tfArrIndex++;
    }
  }

  trader.onComplete();
  console.log({ balance: trader.getValuation(), fitnessMetric: trader.getFitnessMetric() });
}
main();

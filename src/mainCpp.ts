import { evaluateProfit } from 'basic-backtest';
const basePath = '../../../../dist/strategies';
const data: any = {
  tfArr: require('../data/binance_fx-USD_BTC_perpetual_swap-tf.json'),
  obs: require('../data/binance_fx-USD_BTC_perpetual_swap-ob.json'),
  fundingInfo: [] as any,
  traderOptions: {
    basePath,
    // toggle this to cppStrategy or pythonStrategy
    version: 'cppStrategy',
    isBackTesting: true,
    startingPrinciple: 10,
    isFittingOnly: false,
    pairDb: 'USD_BTC_perpetual_swap',
    exchange: 'bitmex_fx',
    leverage: 5,
    takerFee: 0.00075,
    makerFee: -0.00025,
    initialAssetMap: { BTC: 10, USD: 0 },
    baseCurrencySymbol: 'USD',
    tradingPairDbCode: 0,
  },
};

const { trader, fitnessMetric } = evaluateProfit(data);
console.log(`fitnessMetric`, fitnessMetric);

const py = require('bindings')('py');
import * as _ from 'lodash';
import {
  ODSim,
  TraderUltraTfClass,
  OrderBookSchema,
  ParamConfig,
  TradeDbSchemaV2,
  StrategyType,
  ExistingOrderResponse,
  obDataUtils,
} from 'basic-backtest';
import * as dataProcessingUtils from '../utils/dataProcessingUtils';
const defaultOptions = ['minPriceUnit', 'isBackTesting'];
function pickOptions(options: TraderUltraTfClass) {
  return _.pick(options, [
    ...defaultOptions,
    ..._.map(pythonWrapper.constants, c => c.key),
    ..._.map(pythonWrapper.params, p => p.key),
  ]);
}
const pythonWrapper: StrategyType = {
  constants: [
    {
      key: 'enableSe2', // enable second exchange, should be false for single exchange strategy
      value: false,
    },
    {
      // if you don't need orderbook, remove this value
      key: 'realtimeObLevels', // configure how many levels do you want for realtime orderbook
      value: 0,
    },
    {
      // only useful when realtimeObLevels is set
      key: 'minObGapMs', // configure how frequently you like to receive orderbook updates.
      value: 1000,
    },
    {
      // configure candles
      key: 'requireCandle',
      value: {
        resolution: 300,
        preloadSeconds: 86400 * 10, // first time preload candle seconds. useful to build historical data
        pairDb: 'USD_BTC_perpetual_swap',
        exchange: 'bitmex_fx',
      },
    },
    {
      key: 'spread', // an example parameter for strategy to use down stream
      value: 1.5,
    },
  ],
  params: [
    {
      key: 'spread',
      max: 7,
      min: 1,
      type: 'integer',
    },
  ] as ParamConfig[],
  processRawOb: (ob: OrderBookSchema, options: TraderUltraTfClass) => {
    // this is where we do some order book processing.
    obDataUtils.trimObLevel(ob, 5);
    if (!options.isBackTesting) {
      dataProcessingUtils.convertObAmountToBtcNotion(ob);
    }
  },
  getFitnessMetric: (options: TraderUltraTfClass) => {
    // const winloss = options.getGainLossCount();
    // return winloss.winLossRatio;
    return options.se.getAsset(options.pairDb);
  },
  init: (options: TraderUltraTfClass) => {
    options.py = new py.PythonTrader('pythonSample');
    console.log(`pickOptions(options)`, pickOptions(options));
    options.py.init(JSON.stringify({ options: pickOptions(options) }));
  },
  onComplete: (options: TraderUltraTfClass) => {
    const winloss = options.getGainLossCount!();
    console.log(
      'winloss.winLossRatio',
      winloss.winLossRatio,
      `tradesCount=${(options.se as any).getTradeLogs().length}`,
    );

    const extraResults = options.py.complete(
      JSON.stringify({
        options: pickOptions(options),
        fills1: (options.se as any).getTradeLogs(),
        tradesCount: (options.se as any).getTradeLogs().length,
        assets1: (options.se as any).getAsset(options.pairDb),
      }),
    );
    if (extraResults) {
      options.extraResults = JSON.parse(extraResults);
    }
  },
  onReceiveTrade: (
    trade: TradeDbSchemaV2,
    position: ODSim.Position | null,
    orders: ExistingOrderResponse[],
    options: TraderUltraTfClass,
  ) => {
    const instructions = options.py.receiveTrade(
      JSON.stringify({ trade, position, orders, options: pickOptions(options) }),
    );
    const newInstructions = instructions ? JSON.parse(instructions) : [];
    // console.log(`i`, dataProcessingUtils.mapInstructions(newInstructions))
    return dataProcessingUtils.mapInstructions(newInstructions);
  },
  onReceiveOb: (
    ob: OrderBookSchema,
    position: ODSim.Position | null,
    orders: ExistingOrderResponse[],
    options: TraderUltraTfClass,
  ) => {
    const instructions = options.py.receiveOb(JSON.stringify({ ob, position, orders, options: pickOptions(options) }));
    const newInstructions = instructions ? JSON.parse(instructions) : [];
    return dataProcessingUtils.mapInstructions(newInstructions);
  },
  onReceiveCandle: (
    candle: ODSim.CandleSchema,
    positions: (ODSim.Position | null)[],
    orders: ExistingOrderResponse[][],
    options: TraderUltraTfClass,
  ) => {
    const instructions = options.py.receiveCandle(
      JSON.stringify({ candle, positions, orders, options: pickOptions(options) }),
    );
    const newInstructions = instructions ? JSON.parse(instructions) : [];
    return dataProcessingUtils.mapInstructions(newInstructions);
  },
};
export default pythonWrapper;

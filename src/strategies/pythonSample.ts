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
      key: 'placeOrderGap',
      value: 5000,
    },
    {
      key: 'enableSe2',
      value: false,
    },
    {
      key: 'spread',
      value: 1,
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
};
export default pythonWrapper;

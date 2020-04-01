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
const defaultOptions = ['minPriceUnit', 'isBackTesting', 'tradingPairDbCode', 'tradingPairDbCode2'];
function pickOptions(options: TraderUltraTfClass) {
  return _.extend(
    _.pick(options, [
      ...defaultOptions,
      ..._.map(pythonWrapper.constants, c => c.key),
      ..._.map(pythonWrapper.params, p => p.key),
    ]),
    {
      funding1: options.se.getNextFundingRate(options.pairDb),
      funding2: options.se2!.getNextFundingRate(options.pairDb),
    },
  );
}
const pythonWrapper: StrategyType = {
  constants: [
    {
      key: 'placeOrderGap',
      value: 5000,
    },
    {
      key: 'enableSe2',
      value: true,
    },
    {
      key: 'spread',
      value: 6,
    },
  ],
  params: [
    {
      key: 'spread',
      max: 7,
      min: 3,
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
    return options.se.getAsset(options.pairDb) + options.se2!.getAsset(options.pairDb);
  },
  init: (options: TraderUltraTfClass) => {
    options.py = new py.PythonTrader('pythonSampleDualExchange');
    options.py.init(JSON.stringify({ options: pickOptions(options) }));
  },
  onComplete: (options: TraderUltraTfClass) => {
    const winloss = options.getGainLossCount!();
    console.log('winloss.winLossRatio', winloss.winLossRatio);
    options.py.complete(
      JSON.stringify({
        options: pickOptions(options),
        fills1: (options.se as any).getTradeLogs(),
        fills2: (options.se2 as any).getTradeLogs(),
        assets1: (options.se as any).getAsset(options.pairDb),
        assets2: (options.se2 as any).getAsset(options.pairDb),
      }),
    );
  },
  onReceiveTradeMulti: (
    trade: TradeDbSchemaV2,
    positions: (ODSim.Position | null)[],
    orders: ExistingOrderResponse[][],
    options: TraderUltraTfClass,
  ) => {
    const instructions = options.py.receiveTradeMulti(
      JSON.stringify({ trade, positions, orders, options: pickOptions(options) }),
    );
    return dataProcessingUtils.mapInstructions(JSON.parse(instructions));
  },
  onReceiveObMulti: (
    ob: OrderBookSchema,
    positions: (ODSim.Position | null)[],
    orders: ExistingOrderResponse[][],
    options: TraderUltraTfClass,
  ) => {
    const instructions = options.py.receiveObMulti(
      JSON.stringify({ ob, positions, orders, options: pickOptions(options) }),
    );
    return dataProcessingUtils.mapInstructions(JSON.parse(instructions));
  },
  onPositionChange: (
    positions: (ODSim.Position | null)[],
    orders: ExistingOrderResponse[][],
    options: TraderUltraTfClass,
  ) => {
    const instructions = options.py.positionChange(
      JSON.stringify({ positions, orders, options: pickOptions(options) }),
    );
    return dataProcessingUtils.mapInstructions(JSON.parse(instructions));
  },
};
export default pythonWrapper;

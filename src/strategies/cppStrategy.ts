const cpp = require('bindings')('cpp');
import {
  TraderUltraTfClass,
  OrderBookSchema,
  ParamConfig,
  TradeDbSchemaV2,
  StrategyType,
  ExistingOrderResponse,
  ODSim,
} from 'basic-backtest';

const noPosition = {
  side: 0,
  amountCurrency: 0,
  price: 0,
  pair: 0,
};

function positionToCpp(position: ODSim.Position | null) {
  if (!position) return noPosition;
  return {
    ...position,
    side: position.side === 'buy' ? 0 : 1,
    pair: 0,
  };
}

const cppWrapper: StrategyType = {
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
      key: 'baseSpreadPercent',
      value: 5 / 8000,
    },
  ],
  params: [
    {
      key: 'intParam',
      max: 100,
      min: 1,
      type: 'integer',
    },
    {
      key: 'floatParam',
      max: 25 / 8000,
      min: 0,
      type: 'float',
    },
  ] as ParamConfig[],
  processRawOb: (ob: OrderBookSchema) => {},
  getFitnessMetric: (options: TraderUltraTfClass) => {
    const winloss = options.getGainLossCount!();
    return winloss.winLossRatio;
  },
  init: (options: TraderUltraTfClass) => {
    options.cpp = new cpp.CppTrader(0);
  },
  onComplete: (options: TraderUltraTfClass) => {},
  onReceiveTrade: (
    trade: TradeDbSchemaV2,
    position: ODSim.Position | null,
    orders: ExistingOrderResponse[],
    options: TraderUltraTfClass,
  ) => {
    const instructions = options.cpp.receiveTrade(trade, positionToCpp(position), orders);
    return instructions;
  },
  onReceiveOb: (
    ob: OrderBookSchema,
    position: ODSim.Position | null,
    orders: ExistingOrderResponse[],
    options: TraderUltraTfClass,
  ) => {
    return options.cpp.receiveOb(ob, positionToCpp(position), orders);
  },
};
export default cppWrapper;

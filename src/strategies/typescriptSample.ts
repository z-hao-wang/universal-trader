import {
  commonUtils,
  ExistingOrderResponse,
  Inst,
  ODSim,
  OpCode,
  OrderBookSchema,
  ParamConfig,
  SimContractEx,
  StrategyType,
  TradeDbSchemaV2,
  TraderUltraTfClass,
} from 'basic-backtest';

function handleNoPosition(
  options: TraderUltraTfClass,
  direction: number,
  spreadPercents: { bid: number; ask: number },
  ts: number,
): Inst.Instruction[] {
  const { se } = options;
  const lastTick = se.getLastTick(options.pairDb);
  if (!lastTick) return [];
  const { bid, ask } = lastTick;

  const amountCurrency = Math.round(se.getAsset(options.pairDb) * bid);
  const instructions: Inst.Instruction[] = [{ op: OpCode.cancelAllOrders }];

  if (!direction || direction > 0) {
    instructions.push({
      op: OpCode.createLimitOrder,
      amountCurrency,
      side: 'buy',
      price: bid - commonUtils.roundByMinUnit(bid * spreadPercents.bid, options.minPriceUnit),
      ts,
    });
  }
  if (!direction || direction < 0) {
    instructions.push({
      op: OpCode.createLimitOrder,
      amountCurrency,
      side: 'sell',
      price: ask + commonUtils.roundByMinUnit(ask * spreadPercents.ask, options.minPriceUnit),
      ts,
    });
  }
  return instructions;
}

function handleHasPosition(
  options: TraderUltraTfClass,
  position: ODSim.Position,
  direction: number,
  spreadPercents: { bid: number; ask: number },
  ts: number,
): Inst.Instruction[] {
  const { se } = options;
  const lastTick = se.getLastTick(options.pairDb);
  if (!lastTick) return [];
  const { bid, ask } = lastTick;

  const amountCurrency = position.amountCurrency;
  const instructions: Inst.Instruction[] = [{ op: OpCode.cancelAllOrders }];
  if (position.side === 'sell') {
    instructions.push({
      op: OpCode.createLimitOrder,
      amountCurrency,
      side: 'buy',
      price: bid - commonUtils.roundByMinUnit(bid * spreadPercents.bid, options.minPriceUnit),
      ts,
    });
  }
  if (position.side === 'buy') {
    instructions.push({
      op: OpCode.createLimitOrder,
      amountCurrency,
      side: 'sell',
      price: ask + commonUtils.roundByMinUnit(ask * spreadPercents.ask, options.minPriceUnit),
      ts,
    });
  }
  return instructions;
}

const typescriptSample: StrategyType = {
  constants: [
    {
      key: 'placeOrderGap',
      value: 2000,
    },
    {
      key: 'enableSe2',
      value: false,
    },
  ],
  params: [] as ParamConfig[],
  processRawOb: (ob: OrderBookSchema, options: TraderUltraTfClass) => {},
  init: (options: TraderUltraTfClass) => {
    if (options.isBackTesting) {
      ((options.se as any) as SimContractEx).setDelayExecutionMs(1000);
    }
    options.startTs = Date.now();
  },
  onComplete: (options: TraderUltraTfClass) => {
    const endTs = Date.now();
    console.log(`took ${endTs - options.startTs}`);
  },
  onReceiveTrade: (
    doc: TradeDbSchemaV2,
    position: ODSim.Position | null,
    orders: ExistingOrderResponse[],
    options: TraderUltraTfClass,
  ) => {
    const [ts] = doc;
    if (!position) {
      //console.log(`nopo ts`, new Date(doc[0]).toISOString());
      return handleNoPosition(options, 0, { bid: 0.001, ask: 0.001 }, ts);
    }
    //console.log(`po ts`, new Date(doc[0]).toISOString());
    return handleHasPosition(options, position, 0, { bid: 0.001, ask: 0.001 }, ts);
  },
  onReceiveOb: (
    ob: OrderBookSchema,
    position: ODSim.Position | null,
    orders: ExistingOrderResponse[],
    options: TraderUltraTfClass,
  ) => {
    return [];
  },
};
export default typescriptSample;

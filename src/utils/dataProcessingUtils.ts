import { Inst, OpCode, OrderBookSchema } from 'basic-backtest';
import * as _ from 'lodash';

export function convertObAmountToBtcNotion(ob: OrderBookSchema) {
  _.each(ob.bids, bid => {
    bid.a = bid.a / bid.r;
  });
  _.each(ob.asks, ask => {
    ask.a = ask.a / ask.r;
  });
}

export function convertOpCode(str: string): OpCode {
  switch (str) {
    case 'cancelAllOrders':
      return OpCode.cancelAllOrders;
    case 'cancelOrder':
      return OpCode.cancelOrder;
    case 'createLimitOrder':
      return OpCode.createLimitOrder;
    case 'updateOrder':
      return OpCode.updateOrder;
    case 'createStopLimitOrder':
      return OpCode.createStopLimitOrder;
    case 'createMarketOrder':
      return OpCode.createMarketOrder;
    case 'limitClosePosition':
      return OpCode.limitClosePosition;
    case 'marketClosePosition':
      return OpCode.marketClosePosition;
    default:
      throw new Error(`invalid instruction ${str}`);
  }
}

export function mapInstructions(inst: any[]): Inst.Instruction[] {
  return _.map(inst, instruction => {
    return {
      ...instruction,
      op: convertOpCode(instruction.op),
    } as any;
  });
}

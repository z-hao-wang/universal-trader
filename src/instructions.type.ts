export namespace Inst {
  type SignalBuySell = 'buy' | 'sell';
  export type OPCode =
    | 'cancelAllOrders'
    | 'cancelOrder'
    | 'createLimitOrder'
    | 'updateOrder'
    | 'createStopLimitOrder'
    | 'createMarketOrder'
    | 'limitClosePosition'
    | 'marketClosePosition';
  export interface SharedProps {
    secondExchange?: boolean;
  }

  export interface CancelAllOrders extends SharedProps {
    op: 'cancelAllOrders';
    // optional cancel orders filtered by side
    side?: SignalBuySell;
  }
  export interface CancelOrder extends SharedProps {
    op: 'cancelOrder';
    orderId: string | number;
  }

  export interface CreateLimitOrder extends SharedProps {
    op: 'createLimitOrder';
    side: SignalBuySell;
    price: number;
    amountCurrency: number;
    postOnly?: boolean;
  }

  export interface UpdateOrder extends SharedProps {
    op: 'updateOrder';
    orderId: string | number;
    price: number;
    amountCurrency: number;
  }

  export interface CreateStopLimitOrder extends SharedProps {
    op: 'createStopLimitOrder';
    side: SignalBuySell;
    stopPrice: number;
    amountCurrency: number;
  }

  export interface CreateMarketOrder extends SharedProps {
    op: 'createMarketOrder';
    side: SignalBuySell;
    amountCurrency: number;
  }

  export interface LimitClosePosition extends SharedProps {
    op: 'limitClosePosition';
    price: number;
  }

  export interface MarketClosePosition extends SharedProps {
    op: 'marketClosePosition';
  }

  export type Instruction =
    | CancelAllOrders
    | CancelOrder
    | CreateLimitOrder
    | UpdateOrder
    | CreateStopLimitOrder
    | CreateMarketOrder
    | LimitClosePosition
    | MarketClosePosition;
}

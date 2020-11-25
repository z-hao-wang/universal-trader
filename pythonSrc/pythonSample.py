import json
from datetime import datetime

class Trader:
    def __init__(self, initialValue):
        argJson = json.loads(initialValue)
        self.startTime = datetime.timestamp(datetime.now())
        # save initial values
        self.counterTrades = 0
        self.counterObs = 0
        self.counterCandles = 0

    def receiveTrade(self, trade, position, orders, options):
        time = trade[0]
        side = trade[1] # 0 = buy, 1 = sell
        price = trade[2]
        amount = trade[3] # in btc
        if self.counterTrades < 10:
            self.counterTrades = self.counterTrades + 1
            print("receiveTrade", time, price)
        # spread will be backtested with genetic fitting
        spread = options["spread"]
        if position is None:
        # all instructions can be viewed at https://github.com/z-hao-wang/universal-trader/blob/master/src/instructions.type.ts
            return [{
                "op": "cancelAllOrders"
            }, {
                "op": "createLimitOrder",
                "side": "buy",
                "price": price - spread,
                "amountCurrency": 500,
                "ts": time,
            }, {
                "op": "createLimitOrder",
                "side": "sell",
                "price": price + spread,
                "amountCurrency": 500,
                "ts": time,
            }]
        else:
            side = "buy" if position.get("side") == "sell" else "sell"
            newPrice = price - spread if side == "buy" else price + spread
            return [{
                "op": "cancelAllOrders"
            }, {
                "op": "createLimitOrder",
                "side": side,
                "price": newPrice,
                "amountCurrency": position.get("amountCurrency"),
                "ts": time,
            }]
    #interface OrderBookSchema {
    #   ts: Date; // server timestamp
    #   exchange?: string;
    #   pair?: string;
    #   bids: {r: number, a: number}[];
    #   asks: {r: number, a: number}[];
    # }

    # position { amountOriginal?: number;
    #               amountClosed?: number;
    #               amountCurrency: number; // amount remaining
    #               side: 'buy' | 'sell';
    #               price: number;
    #               pairDb: string;
    #               }
    def receiveOb(self, ob, position, orders, options):
        if self.counterObs < 10:
            self.counterObs = self.counterObs + 1
            print(f"receiveOb", ob)
        return []

    def receiveCandle(self, candle, positions, orders, options):
        if self.counterCandles < 5:
            self.counterCandles = self.counterCandles + 1
            print('receiveCandle', candle)
        return []

traderInstance = Trader("{}")
def receiveOb(arg):
    argJson = json.loads(arg)
    global traderInstance
    ret = traderInstance.receiveOb(argJson["ob"], argJson.get("position"), argJson["orders"], argJson["options"])
    return json.dumps(ret)

def receiveTrade(arg):
    argJson = json.loads(arg)
    global traderInstance
    ret = traderInstance.receiveTrade(argJson["trade"], argJson.get("position"), argJson["orders"], argJson["options"])
    return json.dumps(ret)

def receiveCandle(arg):
    argJson = json.loads(arg)
    global traderInstance
    ret = traderInstance.receiveCandle(argJson["candle"], argJson.get("positions"), argJson["orders"], argJson["options"])
    return json.dumps(ret)

def init(arg):
    argJson = json.loads(arg)
    global traderInstance
    print("init", argJson["options"])

def complete(arg):
    global traderInstance
    argJson = json.loads(arg)
    endTime = datetime.timestamp(datetime.now())
    timeSpend = endTime - traderInstance.startTime
    print("took", timeSpend)
    print("completed", argJson["options"])
    # print your orders execution data
    #print("fills", argJson["fills1"])

def positionChange(arg):
    global traderInstance
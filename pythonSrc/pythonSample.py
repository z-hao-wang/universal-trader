import json
from datetime import datetime

class Trader:
    def __init__(self, initialValue):
        argJson = json.loads(initialValue)
        self.startTime = datetime.timestamp(datetime.now())
        # save initial values

    def receiveTrade(self, trade, position, orders, options):
        time = trade[0]
        side = trade[1] # 0 = buy, 1 = sell
        price = trade[2]
        amount = trade[3] # in btc
        # spread will be backtested with genetic fitting
        spread = options["spread"]
        if position is None:
        # all instructions can be viewed at https://bitbucket.org/whateverhow/basic-backtest/src/master/src/types/instruction.ts
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
        return []
    def receiveCandle(self, candle, positions, orders, options):
        # print('candle', candle)
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

def positionChange(arg):
    global traderInstance
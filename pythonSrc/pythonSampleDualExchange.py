import json, math
import pandas
from datetime import datetime
import numpy as np
class Trader:

    def __init__(self, initialValue):
        argJson = json.loads(initialValue)
        self.startTime = datetime.timestamp(datetime.now())
        self.printedOb = 0
        self.printedTrade = False
        # save initial values

    def reset(self):
        self.printedOb = 0

    def processSingleExchange(self, position, price, spread, secondExchange):
        if position is None:
        # all instructions can be viewed at https://bitbucket.org/whateverhow/basic-backtest/src/master/src/types/instruction.ts
            return [{
                "op": "cancelAllOrders",
                "secondExchange": secondExchange
            }, {
                "op": "createLimitOrder",
                "side": "buy",
                "price": price - spread,
                "amountCurrency": 500,
                "postOnly": True,
                "secondExchange": secondExchange
            }, {
                "op": "createLimitOrder",
                "side": "sell",
                "price": price + spread,
                "amountCurrency": 500,
                "postOnly": True,
                "secondExchange": secondExchange
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
            }]
        return []

    def receiveTradeMulti(self, trade, positions, orders, options):
        time = trade[0]
        side = trade[1] # 0 = buy, 1 = sell
        price = trade[2]
        amount = trade[3] # in btc
        product = trade[4] # 100 is bitmex USD_BTC_perpetual_swap, 302 is binance USDT_BTC
        # spread will be backtested with genetic fitting
        spread = options["spread"]
        if not self.printedTrade:
            print("trade", trade)
            self.printedTrade = True
        instructions1 = self.processSingleExchange(positions[0], price, spread, False)
        instructions2 = self.processSingleExchange(positions[1], price, spread, True)

        return instructions1 + instructions2
    #interface OrderBookSchema {
    #   ts: Date; // server timestamp
    #   exchange?: string;
    #   c?: number;
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
    def receiveObMulti(self, ob, position, orders, options):
        if self.printedOb < 5:
            print("ob", ob)
            self.printedOb = self.printedOb + 1
        return []

traderInstance = Trader("{}")
def receiveObMulti(arg):
    argJson = json.loads(arg)
    global traderInstance
    ret = traderInstance.receiveObMulti(argJson["ob"], argJson.get("positions"), argJson["orders"], argJson["options"])
    return json.dumps(ret)

def receiveTradeMulti(arg):
    argJson = json.loads(arg)
    global traderInstance
    ret = traderInstance.receiveTradeMulti(argJson["trade"], argJson.get("positions"), argJson["orders"], argJson["options"])
    return json.dumps(ret)
# you must clear everything in the class in init function.
# because init can potentially by called a few times.
def init(arg):
    argJson = json.loads(arg)
    global traderInstance
    print("init", argJson["options"])
    traderInstance.reset()
    return "{}"
def complete(arg):
    global traderInstance
    argJson = json.loads(arg)
    endTime = datetime.timestamp(datetime.now())
    timeSpend = endTime - traderInstance.startTime
    print("took", timeSpend)
    print("completed", argJson["options"])
    return ""

def positionChange(arg):
    global traderInstance
    argJson = json.loads(arg)
    #print("positionChange", argJson["positions"])
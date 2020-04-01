#include "cpptrader.h"
using namespace Napi;

Napi::FunctionReference CppTrader::constructor;

Napi::Object CppTrader::Init(Napi::Env env, Napi::Object exports) {
  Napi::HandleScope scope(env);

  Napi::Function func =
      DefineClass(env,
                  "CppTrader",
                  {
                   InstanceMethod("receiveTrade", &CppTrader::ReceiveTrade),
                   InstanceMethod("receiveOb", &CppTrader::ReceiveOb)
                   });

  constructor = Napi::Persistent(func);
  constructor.SuppressDestruct();

  exports.Set("CppTrader", func);
  return exports;
}

CppTrader::CppTrader(const Napi::CallbackInfo& info)
    : Napi::ObjectWrap<CppTrader>(info) {
  Napi::Env env = info.Env();
  Napi::HandleScope scope(env);

  int length = info.Length();

  if (length <= 0 || !info[0].IsNumber()) {
    Napi::TypeError::New(env, "Number expected").ThrowAsJavaScriptException();
    return;
  }

  Napi::Number value = info[0].As<Napi::Number>();
  this->value_ = value.DoubleValue();
}

Napi::Value CppTrader::ReceiveTrade(const Napi::CallbackInfo& info) {
  this->value_ = this->value_ + 2;
  // get trade info
  Napi::Array trade = info[0].As<Napi::Array>();
  Napi::Number ts = trade.Get("0").ToNumber();
  Napi::Number side = trade.Get("1").ToNumber(); // 0 = buy, 1 = sell
  float price = trade.Get("2").ToNumber().FloatValue();
  Napi::Number amount = trade.Get("3").ToNumber();
  Napi::Number pair = trade.Get("4").ToNumber();

  // get active position info
  Napi::Object position = info[1].As<Napi::Object>();
  uint32_t positionAmount = position.Get("amountCurrency").ToNumber().Uint32Value();
  uint32_t positionSide = position.Get("side").ToNumber().Uint32Value();
  Napi::Number positionPrice = position.Get("price").ToNumber();
  Napi::Number positionPair = position.Get("pair").ToNumber();

  Napi::Array activeOrders = info[2].As<Napi::Array>();

  std::vector<ActiveOrder> buyOrders = this->FilterActiveOrders(activeOrders, true);
  // printf("buyOrders length %lu \n", buyOrders.size());

  // START core logic
  // cancel all orders first
  Object instructionClear = Object::New(info.Env());
  instructionClear.Set("op", "cancelAllOrders");

  if (positionAmount == 0) {
    // no position
    Object instructionBuy = Object::New(info.Env());
    instructionBuy.Set("op", "createLimitOrder");
    instructionBuy.Set("side", "buy");
    instructionBuy.Set("price", price - 5);
    instructionBuy.Set("amountCurrency", 500);

    Object instructionSell = Object::New(info.Env());
    instructionSell.Set("op", "createLimitOrder");
    instructionSell.Set("side", "sell");
    instructionSell.Set("price", price + 5);
    instructionSell.Set("amountCurrency", 500);
    Array ret = Array::New(info.Env(), 3);
    ret["0"] = instructionClear;
    ret["1"] = instructionBuy;
    ret["2"] = instructionSell;
    return ret;
  } else {
    Object instruction = Object::New(info.Env());
    instruction.Set("op", "createLimitOrder");
    instruction.Set("side", positionSide == 0 ? "sell" : "buy");
    instruction.Set("price", positionSide == 0 ? price + 5 : price - 5);
    instruction.Set("amountCurrency", positionAmount);
    Array ret = Array::New(info.Env(), 2);
    ret["0"] = instructionClear;
    ret["1"] = instruction;
    return ret;
  }
}

Napi::Value CppTrader::ReceiveOb(const Napi::CallbackInfo& info) {
  Napi::Array orderbook = info[0].As<Napi::Array>();
  uint32_t ts = orderbook.Get("0").ToNumber().Uint32Value();
  uint32_t pair = orderbook.Get("1").ToNumber().Uint32Value();

  // printf("orderbook ts %u, pair=%u \n", ts, pair);
  Array ret = Array::New(info.Env(), 0);
  return ret;
}

// filter orders by side.
std::vector<ActiveOrder> CppTrader::FilterActiveOrders(const Napi::Array& activeOrders, bool isBuyOnly) {
  std::vector<ActiveOrder> ret = {};
  for (int i = 0; i < activeOrders.Length(); i++) {
    Napi::Object order = activeOrders.Get(std::to_string(i)).ToObject();
    uint32_t side = order.Get("side").ToNumber().Uint32Value();
    float price =  order.Get("price").ToNumber().FloatValue();
    uint32_t amountCurrency =  order.Get("amountCurrency").ToNumber().Uint32Value();
    uint32_t pair =  order.Get("pair").ToNumber().Uint32Value();

    if (side == 0 && isBuyOnly) {
      ActiveOrder orderNew = {
        side,
        price,
        amountCurrency,
        pair,
      };
      ret.push_back(orderNew);
    }
  }
  return ret;
}
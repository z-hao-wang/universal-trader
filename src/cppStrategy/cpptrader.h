#ifndef CPP_TRADER_H
#define CPP_TRADER_H

#include <napi.h>

struct ActiveOrder {
  uint32_t side;
  float price;
  uint32_t amountCurrency;
  uint32_t pair; 
};

class CppTrader : public Napi::ObjectWrap<CppTrader> {
 public:
  static Napi::Object Init(Napi::Env env, Napi::Object exports);
  CppTrader(const Napi::CallbackInfo& info);

 private:
  static Napi::FunctionReference constructor;

  Napi::Value ReceiveTrade(const Napi::CallbackInfo& info);
  Napi::Value ReceiveOb(const Napi::CallbackInfo& info);
  std::vector<ActiveOrder> FilterActiveOrders(const Napi::Array& activeOrders, bool isBuyOnly);

  double value_;
};

#endif

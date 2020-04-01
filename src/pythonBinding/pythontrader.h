#ifndef PYTHON_TRADER_H
#define PYTHON_TRADER_H

#include <napi.h>
#include <Python.h>

class PythonTrader: public Napi::ObjectWrap<PythonTrader> {
 public:
  static Napi::Object Init(Napi::Env env, Napi::Object exports);
  PythonTrader(const Napi::CallbackInfo& info);

 private:
  static Napi::FunctionReference constructor;

  Napi::Value ReceiveTrade(const Napi::CallbackInfo& info);
  Napi::Value ReceiveTradeMulti(const Napi::CallbackInfo& info);
  Napi::Value ReceiveOb(const Napi::CallbackInfo& info);
  Napi::Value ReceiveObMulti(const Napi::CallbackInfo& info);
  Napi::Value PositionChange(const Napi::CallbackInfo& info);
  Napi::Value Complete(const Napi::CallbackInfo& info);
  Napi::Value Init(const Napi::CallbackInfo& info);
  Napi::Value callFunc(const Napi::CallbackInfo& info, char* funcName);

  PyObject *pModule;
};

#endif

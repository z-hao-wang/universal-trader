#include <napi.h>
#include "pythonBinding/pythontrader.h"

Napi::Object InitAll(Napi::Env env, Napi::Object exports) {
  return PythonTrader::Init(env, exports);
}

NODE_API_MODULE(addon, InitAll)

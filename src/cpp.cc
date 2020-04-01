#include <napi.h>
#include "cppStrategy/cpptrader.h"

Napi::Object InitAll(Napi::Env env, Napi::Object exports) {
  return CppTrader::Init(env, exports);
}

NODE_API_MODULE(addon, InitAll)

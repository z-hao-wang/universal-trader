#include "pythontrader.h"
#include <iostream>
#include <Python.h>
#include <dlfcn.h>

using namespace Napi;
const wchar_t *GetWC(const char *c) {
    const size_t cSize = strlen(c)+1;
    wchar_t* wc = new wchar_t[cSize];
    mbstowcs (wc, c, cSize);

    return wc;
}

Napi::FunctionReference PythonTrader::constructor;
inline char* pyObjectToString(PyObject * pValue) {
  PyObject * tempBytes = PyUnicode_AsEncodedString(pValue, "UTF-8", "strict");
    if (tempBytes != NULL) {
        char* charRes = PyBytes_AS_STRING(tempBytes); // Borrowed pointer
        charRes = strdup(charRes);
        Py_DECREF(tempBytes);
        return charRes;
    } else {
        // fprintf(stderr, "parse pyObjec to string failed \n");
        return NULL;
    }
}

Napi::Object PythonTrader::Init(Napi::Env env, Napi::Object exports) {
  Napi::HandleScope scope(env);

  Napi::Function func =
      DefineClass(env,
                  "PythonTrader",
                  {
                   InstanceMethod("receiveTrade", &PythonTrader::ReceiveTrade),
                   InstanceMethod("receiveOb", &PythonTrader::ReceiveOb),
                   InstanceMethod("receiveTradeMulti", &PythonTrader::ReceiveTradeMulti),
                   InstanceMethod("receiveObMulti", &PythonTrader::ReceiveObMulti),
                   InstanceMethod("receiveCandle", &PythonTrader::ReceiveCandle),
                   InstanceMethod("positionChange", &PythonTrader::PositionChange),
                   InstanceMethod("complete", &PythonTrader::Complete),
                   InstanceMethod("init", &PythonTrader::Init)
                   });

  constructor = Napi::Persistent(func);
  constructor.SuppressDestruct();

  exports.Set("PythonTrader", func);
  return exports;
}

PythonTrader::PythonTrader(const Napi::CallbackInfo& info)
    : Napi::ObjectWrap<PythonTrader>(info) {
  Napi::Env env = info.Env();
  Napi::HandleScope scope(env);
  int length = info.Length();

  if (length == 0 || !info[0].IsString()) {
    Napi::TypeError::New(env, "python src path arg expected").ThrowAsJavaScriptException();
    return;
  }
  Py_UnbufferedStdioFlag = 1; // force line_buffering for _all_ I/O
  // https://stackoverflow.com/questions/49784583/numpy-import-fails-on-multiarray-extension-library-when-called-from-embedded-pyt
  void *handle = dlopen("libpython3.7m.so", RTLD_LAZY | RTLD_GLOBAL);
  if (!handle) {
    std::cout << "dlopen libpython3.7m failed!\n";
  }
  Py_Initialize();
  if (!Py_IsInitialized())
  {
      std::cout << "Python initialization failed!\n";
  }
  // ref https://docs.python.org/2/extending/embedding.html
  std::string arg1 = info[0].ToString().Utf8Value();
  const char* pythonFile = arg1.c_str();

  char cwd[PATH_MAX];
  getcwd(cwd, sizeof(cwd));

  PyObject* pName = PyUnicode_DecodeFSDefault(pythonFile);
  PyObject* sysPath = PySys_GetObject((char*)"path");
  std::string baseCwd (cwd);
  std::string relativePath ("/pythonSrc");
  std::string newBasePath = baseCwd + relativePath;
  printf("init pythonFile %s/%s \n", newBasePath.c_str(), pythonFile);
  // we must append the base directory to python env, otherwise it can't find our file.
  PyObject* basePathName = PyUnicode_DecodeFSDefault(newBasePath.c_str());
  PyList_Append(sysPath, basePathName);

  this->pModule = PyImport_Import(pName);
  Py_DECREF(pName);
  Py_DECREF(sysPath);
  Py_DECREF(basePathName);
  if (this->pModule == NULL) {
    PyErr_Print();
    fprintf(stderr, "Cannot find file \"%s\"\n", pythonFile);
    // Napi::TypeError::New(env, "python file not found").ThrowAsJavaScriptException();
  }
}

Napi::Value PythonTrader::callFunc(const Napi::CallbackInfo& info, char* funcName) {
  Napi::Env env = info.Env();
  Napi::HandleScope scope(env);
  std::string arg1 = info[0].ToString().Utf8Value();
  PyObject *pFunc = PyObject_GetAttrString(pModule, funcName);
  PyObject *pValue;
  if (pFunc && PyCallable_Check(pFunc)) {
    PyObject *pArgs = PyTuple_New(1);
    pValue = PyUnicode_FromString(arg1.c_str());
    PyTuple_SetItem(pArgs, 0, pValue);

    pValue = PyObject_CallObject(pFunc, pArgs);
    if (pValue == NULL) {
      PyErr_Print();
      fprintf(stderr, "call python function %s failed\n", funcName);
    }
    char* charRes = pyObjectToString(pValue);
    
    Py_DECREF(pValue);
    Py_DECREF(pArgs);
    Py_DECREF(pFunc);

    if (charRes == NULL) {
      return info.Env().Null();
    }
    return String::New(info.Env(), charRes);
  } else {
    fprintf(stderr, "%s function is not defined\n", funcName);
  }
  return info.Env().Null();
}

Napi::Value PythonTrader::ReceiveTrade(const Napi::CallbackInfo& info) {
  return this->callFunc(info, (char*)"receiveTrade");
}

Napi::Value PythonTrader::ReceiveTradeMulti(const Napi::CallbackInfo& info) {
  return this->callFunc(info, (char*)"receiveTradeMulti");
}

Napi::Value PythonTrader::PositionChange(const Napi::CallbackInfo& info) {
  return this->callFunc(info, (char*)"positionChange");
}

Napi::Value PythonTrader::ReceiveOb(const Napi::CallbackInfo& info) {
  return this->callFunc(info, (char*)"receiveOb");
}

Napi::Value PythonTrader::ReceiveObMulti(const Napi::CallbackInfo& info) {
  return this->callFunc(info, (char*)"receiveObMulti");
}

Napi::Value PythonTrader::ReceiveCandle(const Napi::CallbackInfo& info) {
  return this->callFunc(info, (char*)"receiveCandle");
}

Napi::Value PythonTrader::Init(const Napi::CallbackInfo& info) {
  return this->callFunc(info, (char*)"init");
}

Napi::Value PythonTrader::Complete(const Napi::CallbackInfo& info) {
  return this->callFunc(info, (char*)"complete");
}
# getting started

Note: you will need special access to basic-backtest repo.

# python trader
Can write core strategy in python. python file in pythonSrc/
the easiest way is to run in docker.
These commands works in mac, and probably work in linux. 

first build docker image
```
make docker
```

### docker dev mode with live console
```
make console
```
### run either of the 2 sample strategies
```
rr pythonSample
rr pythonSampleDualExchange
```
### rebuild typescript file (required when typescript file is changed)
```
npm run tsc
```

# to exit docker console
```
exit
```



# c++ trader
this repo is for integrating with trading framework.

ReceiveTrade, ReceiveOb are 2 functions to receive live stream data, any decisioning logic can be done there, output trading instructions.

sample in cpptrader.cc

edit c++ file, and run this command to compile and run strategy.
```
node-gyp rebuild && npm run tsc && node dist/mainCpp.js
```
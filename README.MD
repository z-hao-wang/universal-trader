## getting started
```
# install git lfs
bash ops/unzipData.sh
```
Note: you will need special access to basic-backtest repo.

## c++ trader
this repo is for integrating with trading framework.

ReceiveTrade, ReceiveOb are 2 functions to receive live stream data, any decisioning logic can be done there, output trading instructions.

sample in cpptrader.cc

edit c++ file, and run this command to compile and run strategy.
```
node-gyp rebuild && npm run tsc && node src/mainCpp.js
```

## python trader
similar concept with c++ trader, can write core strategy in python. python file in pythonSrc/
the easiest way is to run in docker.
These commands works in mac, and probably work in linux. 

first build it.
```
bash ops/buildDocker.sh
```

Then make any changes in pythonSrc/ and run it again

```
bash ops/runpy.sh pythonSample
bash ops/runpy.sh pythonSampleDualExchange
```

To Kill the docker instance, open separate browser tab and run
```
docker rm -f pytrader
```

if you modify ts file, you need to rebuild the docker image.



# DEV only notes, don't try this unless you know what you are doing
## test on linux server
node dist/mainPython.js pythonSampleDualExchange

## setup in macos
For some reason, the linking didn't work well in linux or macos
`"<!(python3-config --ldflags)",` this link flag works fine in docker env,
but appears to not working in ubuntu 18 or mac

node-gyp rebuild --python $(which python3) && node dist/mainPython.js pythonSampleDualExchange

debug 
node-gyp configure

# docker dev mode with live console
```
docker run -t -i --name pytrader --rm -v $(pwd)/pythonSrc:/app/pythonSrc -v $(pwd)/data:/app/data -v $(pwd)/src:/app/src cpptrader:master bash

npm run tsc && node dist/mainPython.js pythonSampleDualExchange
```


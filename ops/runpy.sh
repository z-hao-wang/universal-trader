docker rm -f pytrader || true
docker run -t -i --name pytrader --rm -v $(pwd)/pythonSrc:/app/pythonSrc -v $(pwd)/data:/app/data cpptrader:master node dist/mainPython.js $@

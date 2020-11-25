docker run -t -i --name pytrader --rm -v $(pwd)/pythonSrc:/app/pythonSrc -v $(pwd)/market-data:/app/market-data -v $(pwd)/src:/app/src cpptrader:master bash

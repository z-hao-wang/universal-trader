
docker:
	bash ops/buildDocker.sh master

console:
	docker rm -f pytrader || true
	bash ops/runInteractiveConsole.sh

run:
	node --max-old-space-size=16000 dist/mainPython.js $(strategy)

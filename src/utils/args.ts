const ArgumentParser = require('argparse').ArgumentParser;
const parser = new ArgumentParser({
  version: '0.0.1',
  addHelp: true,
  description: 'genetic fitting',
});
parser.addArgument(['--strategy'], {
  help: 'strategy name',
});

export function getArgs() {
  return parser.parseArgs();
}

const fs = require('fs');
const zlib = require('zlib');
const readline = require('readline');
import { dataUtils, tfUtils } from 'basic-backtest';
const { getUTCDateFromTime } = dataUtils;

export function getDay(startDate: string | Date) {
  return getUTCDateFromTime(new Date(startDate));
}

export class GzReader {
  unzip = zlib.createGunzip();
  fileContents: any;
  fileName: string;

  constructor(fileName: string) {
    // console.log(`gunzip ${fileName}`);
    this.fileName = fileName;
    this.fileContents = fs.createReadStream(fileName);
    this.fileContents.on('error', () => {
      console.error(`read gz file error ${this.fileName}`);
    });
  }

  async readStream(onData: (data: any) => any) {
    this.fileContents.on('pipe', (data: any) => {
      console.log('ReadStream: Piped on Stream...\n', data);
    });

    const streamReader = this.fileContents.pipe(this.unzip);
    let lineReader = readline.createInterface({
      input: streamReader,
    });
    lineReader.on('line', (line: string) => {
      onData(JSON.parse(line));
    });

    return new Promise((resolve, reject) => {
      this.fileContents.on('error', () => {
        reject();
      });
      this.fileContents.on('end', () => {
        // console.log(`pipe finished`);
        resolve();
      });
    });
  }
}

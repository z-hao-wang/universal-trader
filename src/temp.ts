const tfArr = require('../data/trades.json');
console.log(`tfArr`, new Date(tfArr[0][0]).toISOString(), new Date(tfArr[tfArr.length - 1][0]).toISOString());

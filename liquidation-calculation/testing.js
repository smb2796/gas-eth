const minimist = require('minimist');

let args = minimist(process.argv.slice(2), {
  alias: {
      p: 'price',
      t: 'timestamp'
  }
});

console.log(args.p)
const {BigQuery} = require('@google-cloud/bigquery');
const highland = require('highland');
const moment = require('moment');
const minimist = require('minimist');

let args = minimist(process.argv.slice(2), {
  alias: {
      p: 'priceId',
      t: 'timestamp'
  }
});

// console.log('args:', args);

const client = new BigQuery();

async function runTest(query){
  
  // returns a node read stream
  const stream = await client.createQueryStream({query})
  // highland wraps a stream and adds utilities simlar to lodash
  // https://caolan.github.io/highland/
  return highland(stream)
    
    // from here you can map or reduce or whatever you need for down stream processing
    // we are just going to "collect" stream into an array for display
    .collect()
    // emit the stream as a promise when the stream ends
    // this is the start of a data pipeline so you can imagine 
    // this could also "pipe" into some other processing pipeline or write to a file
    .toPromise(Promise)

}

function buildQuery(priceId, timestamp) {
    let query, timeDifference, t1, t2, minBlockAmount;
    
    //If a timestamp is passed in (i.e. voting or a dispute) use that. If not, use the current time.
    (timestamp) ? t1 = timestamp : t1 = new Date();

    //timeDifference equals 3600 (seconds in an hour) * the number of hours in the specified price identifier
    switch(priceId){
        case 'GASETH-1HR':
            timeDifference = 3600000;
            minBlockAmount = 200;
            break;
        case 'GASETH-4HR':
            timeDifference = 14400000;
            minBlockAmount = 800;
            break;
        case 'GASETH-1D':
            timeDifference = 86400000;
            minBlockAmount = 4800;
            break;
        case 'GASETH-1W':
            timeDifference = 604800000;
            minBlockAmount = 33600;
            break;
        case 'GASETH-1M':
            timeDifference = 2592000000;
            minBlockAmount = 134400;
            break;
        default:
            timeDifference = 3600000;
            minBlockAmount = 200;
    }
    t2 = new Date(t1 - timeDifference);
    t1 = moment(t1).utc().format('YYYY-MM-DD HH:mm:ss');
    t2 = moment(t2).utc().format('YYYY-MM-DD HH:mm:ss');

    query = `
        DECLARE halfway int64;
        DECLARE block_count int64;
        DECLARE max_block int64;

        -- Querying for the amount of blocks in the preset time range. This will allow block_count to be compared against a given minimum block amount.
        SET (block_count, max_block) = (SELECT AS STRUCT (MAX(number) - MIN(number)), MAX(number) FROM \`bigquery-public-data.crypto_ethereum.blocks\` 
        WHERE timestamp BETWEEN TIMESTAMP('${t2}', 'UTC') AND TIMESTAMP('${t1}', 'UTC'));

        CREATE TEMP TABLE cum_gas (
          gas_price int64,
          cum_sum int64
        );

        -- If the minimum threshold of blocks is met, query on a time range
        IF block_count >= ${minBlockAmount} THEN
        INSERT INTO cum_gas (
          SELECT
            gas_price,
            SUM(gas_used) OVER (ORDER BY gas_price) AS cum_sum
          FROM (
            SELECT
              gas_price,
              SUM(receipt_gas_used) AS gas_used
            FROM
              \`bigquery-public-data.crypto_ethereum.transactions\`
            WHERE block_timestamp 
            BETWEEN TIMESTAMP('${t2}', 'UTC')
            AND TIMESTAMP('${t1}', 'UTC')  
            GROUP BY
              gas_price));
        ELSE -- If a minimum threshold of blocks is not met, query for the minimum amount of blocks
        INSERT INTO cum_gas (
          SELECT
            gas_price,
            SUM(gas_used) OVER (ORDER BY gas_price) AS cum_sum
          FROM (
            SELECT
              gas_price,
              SUM(receipt_gas_used) AS gas_used
            FROM
              \`bigquery-public-data.crypto_ethereum.transactions\`
            WHERE block_number 
            BETWEEN (max_block - ${minBlockAmount})
            AND max_block
            GROUP BY
              gas_price));
        END IF;

        SET halfway = (SELECT DIV(MAX(cum_sum),2) FROM cum_gas);

        SELECT cum_sum, gas_price FROM cum_gas WHERE cum_sum > halfway ORDER BY gas_price LIMIT 1;
        `
        return query;
 }

 runTest(buildQuery(args.p, args.t)).then(res => {

   console.log(res[0].gas_price)

 }).catch(console.log);
 
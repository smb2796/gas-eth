# Synthetic Gas Liquidation and Dispute Bots


## Installation

Use npm to install dependencies

```bash
npm install
```

## Usage

Within `./liquidation-calculation` run:

```bash
node bigquery-connection.js -p 'PRICE_IDENTIFIER' -t 'UNIX_TIMESTAMP'
```

This will return the median gas price for the specified price identifier. -t is optional and if not passed will give results based on the *current time* as the end bound.

| Identifier |
|------------|
| GASETH-1HR |
| GASETH-4HR |
| GASETH-1D | 
| GASETH-1W |
| GASETH-1M |


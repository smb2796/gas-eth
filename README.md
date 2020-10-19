# Synthetic Gas Calculation

This code is intended to be used by UMA Protocol voters or bot operators to calculate the weighted median Ethereum gas price over a certain time or block range. The specifications of this calculation are explained in [UMIP-16](https://github.com/UMAprotocol/UMIPs/blob/master/UMIPs/umip-16.md)

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

The price identifier can be any of the options below. These are the same as the supported GASETH identifiers on the UMA protocol.

| Identifier |
|------------|
| GASETH-1HR |
| GASETH-4HR |
| GASETH-1D | 
| GASETH-1W |
| GASETH-1M |



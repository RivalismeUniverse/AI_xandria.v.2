require('@nomiclabs/hardhat-waffle');
require('@nomiclabs/hardhat-etherscan');
require('dotenv').config();

const SOMNIA_RPC_URL = process.env.SOMNIA_RPC_URL || 'https://rpc.shanon-somnia.network';
const PRIVATE_KEY = process.env.PRIVATE_KEY || 'your_private_key_here';
const CHAIN_ID = process.env.SOMNIA_CHAIN_ID || 50312;

module.exports = {
  solidity: {
    version: '0.8.19',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    somnia: {
      url: SOMNIA_RPC_URL,
      chainId: parseInt(CHAIN_ID),
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : []
    },
    localhost: {
      url: 'http://127.0.0.1:8545'
    }
  },
  etherscan: {
    apiKey: {
      somnia: 'your_api_key' // Somnia might have block explorer API
    },
    customChains: [
      {
        network: "somnia",
        chainId: parseInt(CHAIN_ID),
        urls: {
          apiURL: "https://explorer.somnia.network/api",
          browserURL: "https://explorer.somnia.network"
        }
      }
    ]
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};

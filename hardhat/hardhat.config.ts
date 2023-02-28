import { HardhatUserConfig } from 'hardhat/config'
import '@nomicfoundation/hardhat-toolbox'
import dotenv from 'dotenv'
dotenv.config()
const privateKey = process.env.PRIVATE_KEY

let accounts = privateKey !== undefined ? [privateKey] : []

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.17',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    mainnet: {
      url: process.env.BSC_URL || 'https://bsc-dataseed1.binance.org/',
      accounts: accounts,
      chainId: 56,
      timeout: 60000,
    },
    testnet: {
      url: process.env.BSC_TEST_URL || 'https://data-seed-prebsc-1-s1.binance.org:8545/',
      accounts: accounts,
      chainId: 97,
      timeout: 60000,
    },
  },
}

export default config

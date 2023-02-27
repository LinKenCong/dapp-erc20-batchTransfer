# dapp-erc20-batchTransfer

website:

## Run Test

Terminal 1：

```
cd frontend
yarn install
yarn dev
```

Terminal 2：

```
cd hardhat 
yarn install
yarn hardhat node
```

Terminal 3：


```
cd hardhat 
yarn hardhat run scripts/deploy.ts --network localhost
```

### Description

1. There is a contract address in the log after hardhat deployment, fill in the contract address of config.js (frontend/src/config.js).

2. MetaMask imports the first private key of the hardhat test wallet.

3. There is a test address list in config.js, which can be filled in the frontend input for testing.

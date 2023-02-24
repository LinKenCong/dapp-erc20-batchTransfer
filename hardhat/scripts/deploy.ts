import { ethers } from 'hardhat'

async function main() {
  const BatchTransferFactory = await ethers.getContractFactory('BatchTransfer')
  const TestCoinFactory = await ethers.getContractFactory('TestCoin')
  const batchTransfer = await BatchTransferFactory.deploy()
  const testCoin = await TestCoinFactory.deploy()

  await batchTransfer.deployed()
  await testCoin.deployed()

  console.log(`batchTransfer contract deployed to ${batchTransfer.address}`)
  console.log(`testCoin contract deployed to ${testCoin.address}`)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})

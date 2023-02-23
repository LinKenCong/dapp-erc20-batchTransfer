import { time, loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { expect } from 'chai'
import { ethers } from 'hardhat'

describe('Batch Transfer Test', () => {
  const initFixture = async () => {
    // accounts
    const Signers = await ethers.getSigners()
    let addrs: string[] = []
    for (let i = 0; i < Signers.length; i++) {
      addrs.push(Signers[i].address)
    }
    // contract deploy
    const BatchTransferFactory = await ethers.getContractFactory('BatchTransfer')
    const TestCoinFactory = await ethers.getContractFactory('TestCoin')
    const batchTransfer = await BatchTransferFactory.deploy()
    const testCoin = await TestCoinFactory.deploy()
    // return
    return { Signers, addrs, batchTransfer, testCoin }
  }
  describe('01', () => {
    it('accounts no token', async () => {
      const { addrs, testCoin } = await loadFixture(initFixture)
      // verify account no token
      for (let i = 1; i < addrs.length; i++) {
        expect(await testCoin.balanceOf(addrs[i])).to.equal(0)
      }
    })
    it('batch transfer', async () => {
      const { Signers, addrs, batchTransfer, testCoin } = await loadFixture(initFixture)
      const owner = Signers[0]
      // params
      const airdropAddrs = addrs
      console.log('send account =>', airdropAddrs.length)
      const airdropAmount = 1
      // amount count
      const totalAmount = airdropAddrs.length * airdropAmount
      // amount to eth
      const totalETH = ethers.utils.parseEther(totalAmount.toString())
      const onceETH = ethers.utils.parseEther(airdropAmount.toString())
      // approve
      await testCoin.connect(owner).approve(batchTransfer.address, totalETH)
      // isApprove check
      expect(await testCoin.allowance(owner.address, batchTransfer.address)).to.equal(totalETH)
      // estimateGas
      const estimation = await batchTransfer.estimateGas.batchTransfer(testCoin.address, airdropAddrs, onceETH)
      console.log('batchTransfer estimateGas =>', estimation)
      // transfer
      await batchTransfer.batchTransfer(testCoin.address, airdropAddrs, onceETH)
      // verify account have 1.0 token
      for (let i = 1; i < airdropAddrs.length; i++) {
        const balance = await testCoin.balanceOf(airdropAddrs[i])
        expect(balance).to.equal(onceETH)
      }
    })
    it('batch Call', async () => {
      const { Signers, addrs, batchTransfer, testCoin } = await loadFixture(initFixture)
      const owner = Signers[0]
      // params
      const airdropAddrs = addrs
      console.log('send account =>', airdropAddrs.length)
      const airdropAmount = 1
      // amount count
      const totalAmount = airdropAddrs.length * airdropAmount
      // amount to eth
      const totalETH = ethers.utils.parseEther(totalAmount.toString())
      const onceETH = ethers.utils.parseEther(airdropAmount.toString())
      // transfer
      await testCoin.connect(owner).transfer(batchTransfer.address, totalETH)
      // balance check
      expect(Boolean((await testCoin.balanceOf(batchTransfer.address)) >= totalETH)).to.equal(true)
      // estimateGas
      const estimation = await batchTransfer.estimateGas.batchCall(testCoin.address, airdropAddrs, onceETH)
      console.log('batchCall estimateGas =>', estimation)
      // batchCall
      await batchTransfer.batchCall(testCoin.address, airdropAddrs, onceETH)
      // verify account have 1.0 token
      for (let i = 1; i < airdropAddrs.length; i++) {
        const balance = await testCoin.balanceOf(airdropAddrs[i])
        expect(balance).to.equal(onceETH)
      }
    })

    it('batch transfer more account', async () => {
      const { Signers, addrs, batchTransfer, testCoin } = await loadFixture(initFixture)
      const owner = Signers[0]
      // more account   ps: addrs.length =>20
      const whileCount = 10
      let _addrs: string[] = []
      for (let a = 0; a < whileCount; a++) {
        _addrs.push.apply(_addrs, addrs)
      }
      // params
      const airdropAddrs = _addrs
      console.log('send account =>', airdropAddrs.length)
      const airdropAmount = 1
      // amount count
      const totalAmount = airdropAddrs.length * airdropAmount
      // amount to eth
      const totalETH = ethers.utils.parseEther(totalAmount.toString())
      const onceETH = ethers.utils.parseEther(airdropAmount.toString())
      // approve
      await testCoin.connect(owner).approve(batchTransfer.address, totalETH)
      // isApprove check
      expect(await testCoin.allowance(owner.address, batchTransfer.address)).to.equal(totalETH)
      // estimateGas
      const estimation = await batchTransfer.estimateGas.batchTransfer(testCoin.address, airdropAddrs, onceETH)
      // log check
      console.log('batchTransfer estimateGas =>', estimation)
      // transfer
      await batchTransfer.batchTransfer(testCoin.address, airdropAddrs, onceETH)
      // verify account have 1.0 token
      for (let i = 1; i < addrs.length; i++) {
        const balance = await testCoin.balanceOf(addrs[i])
        expect(balance).to.equal(onceETH.mul(whileCount))
      }
    })
    it('batch Call more account', async () => {
      const { Signers, addrs, batchTransfer, testCoin } = await loadFixture(initFixture)
      const owner = Signers[0]
      // more account   ps: addrs.length =>20
      const whileCount = 10
      let _addrs: string[] = []
      for (let a = 0; a < whileCount; a++) {
        _addrs.push.apply(_addrs, addrs)
      }
      // params
      const airdropAddrs = _addrs
      console.log('send account =>', airdropAddrs.length)
      const airdropAmount = 1
      // amount count
      const totalAmount = airdropAddrs.length * airdropAmount
      // amount to eth
      const totalETH = ethers.utils.parseEther(totalAmount.toString())
      const onceETH = ethers.utils.parseEther(airdropAmount.toString())
      // transfer
      await testCoin.connect(owner).transfer(batchTransfer.address, totalETH)
      // balance check
      expect(Boolean((await testCoin.balanceOf(batchTransfer.address)) >= totalETH)).to.equal(true)
      // estimateGas
      const estimation = await batchTransfer.estimateGas.batchCall(testCoin.address, airdropAddrs, onceETH)
      console.log('batchCall estimateGas =>', estimation)
      // batchCall
      await batchTransfer.batchCall(testCoin.address, airdropAddrs, onceETH)
      // verify account have 1.0 token
      for (let i = 1; i < addrs.length; i++) {
        const balance = await testCoin.balanceOf(addrs[i])
        expect(balance).to.equal(onceETH.mul(whileCount))
      }
    })
  })
})

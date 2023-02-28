import { ethers, isAddress } from 'ethers'
import { ABI_batchTransfer, ABI_erc20 } from './abi'

/**
 * filter effective Address
 * @param {string[]} _arr
 * @returns string[]
 */
export const effectiveAddress = (_arr = []) => {
  return _arr.filter((item) => isAddress(item))
}

/**
 * slice Array
 * @param {string[]} _arr
 * @param {number} _size
 * @returns string[]
 */
export const sliceArray = (_arr = [], _size = 100) => {
  const arrNum = Math.ceil(_arr.length / _size, 10)
  let resIndex = 0
  let result = []
  for (let i = 0; i < arrNum; i++) {
    result[i] = _arr.slice(resIndex, _size + resIndex)
    resIndex += _size
  }
  return result
}

/**
 * get batchTransfer Contract
 * @returns ethers.Contract
 */
export const batchTransferContract = async (_contract) => {
  const provider = new ethers.BrowserProvider(window.ethereum)
  const signer = await provider.getSigner()
  return new ethers.Contract(_contract, ABI_batchTransfer, signer)
}

/**
 * get erc20 Contract
 * @param {string} _token
 * @returns ethers.Contract
 */
export const erc20Contract = async (_token) => {
  const provider = new ethers.BrowserProvider(window.ethereum)
  const signer = await provider.getSigner()
  return new ethers.Contract(_token, ABI_erc20, signer)
}

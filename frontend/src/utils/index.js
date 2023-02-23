import { ethers, isAddress } from 'ethers'
import { Contract_BatchTransfer } from '../config'

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

export const batchTransfer = async (_token, _arr = [], _amount) => {
  const provider = new ethers.BrowserProvider(window.ethereum)
  const signer = await provider.getSigner()
  const contract = new ethers.Contract(
    Contract_BatchTransfer,
    ['function batchCall(address, address[] calldata, uint256) external payable'],
    signer
  )
  await contract.batchCall(_token, _arr, _amount).then((res) => console.log(res))
}

import { useState } from 'react'
import * as ANTD from 'antd'
import './App.css'
import { useEffect } from 'react'

const ChainParams = [
  {
    chainId: '0x38',
    chainName: 'BNB Smart Chain Mainnet',
    rpcUrls: ['https://bsc-dataseed1.binance.org/'],
  },
  {
    chainId: '0x61',
    chainName: 'BNB Smart Chain Testnet',
    rpcUrls: ['https://data-seed-prebsc-1-s1.binance.org:8545/'],
  },
]

const NetId = 0

function App() {
  // input params
  const [tokenContract, setTokenContract] = useState('')
  const [singleAmount, setSingleAmount] = useState(0)
  const [addressList, setAddressList] = useState('')
  const [addressListFormat, setAddressListFormat] = useState('')

  // wallet params
  const [account, setAccount] = useState('')
  const [chainId, setChainId] = useState(ChainParams[NetId].chainId)
  // wallet active
  const handleAccountsChanged = async (_accounts) => {
    if (_accounts.length === 0) {
      console.log('Please connect to MetaMask.')
    } else if (_accounts[0] !== account) {
      setAccount(_accounts[0])
    }
  }
  const handleChainChanged = async (_chainId) => {
    window.location.reload()
  }
  // connect wallet
  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      // get accounts
      await ethereum
        .request({ method: 'eth_requestAccounts' })
        .then(handleAccountsChanged)
        .catch((err) => {
          if (err.code === 4001) {
            console.log('Please connect to MetaMask.')
          } else {
            console.error(err)
          }
        })
      // get chain
      try {
        await ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: chainId }],
        })
      } catch (switchError) {
        if (switchError.code === 4902) {
          try {
            await ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [ChainParams[NetId]],
            })
          } catch (addError) {
            console.error('addEthereumChain', addError)
          }
        } else {
          console.error('switchEthereumChainError', switchError)
        }
      }
    }
  }
  // event wallet
  useEffect(() => {
    ethereum.on('accountsChanged', handleAccountsChanged)
    ethereum.on('chainChanged', handleChainChanged)
    return () => {
      // clear event
      ethereum.removeListener('accountsChanged', handleAccountsChanged)
      ethereum.removeListener('chainChanged', handleChainChanged)
    }
  }, [])
  // Input active
  const handleTokenContractChanged = async (e) => {
    setTokenContract(e.target.value)
  }
  const handleSingleAmountChanged = async (e) => {
    setSingleAmount(e.target.value)
  }
  const handleAddressListChanged = async (e) => {
    const value = e.target.value
    setAddressList(value)
    let list = value ? value.split('\n') : []
    setAddressListFormat(list)
  }
  return (
    <div className="App">
      <div className="container">
        <main className="content">
          <header>
            <ANTD.Button type="primary" onClick={connectWallet}>
              {account || 'Connect Wallet'}
            </ANTD.Button>
          </header>
          <ANTD.Divider />
          <article>
            <section className="input_list">
              <ANTD.Input
                className="input_item"
                addonBefore="Token Contract Address"
                value={tokenContract}
                onChange={handleTokenContractChanged}
              />
              <ANTD.Input
                className="input_item"
                addonBefore="Single Amount"
                addonAfter="ETH"
                value={singleAmount}
                onChange={handleSingleAmountChanged}
              />
              <ANTD.Input.TextArea
                className="input_item"
                rows={4}
                style={{ resize: 'none' }}
                placeholder="maxLength is 6"
                value={addressList}
                onChange={handleAddressListChanged}
              />
            </section>
          </article>
          <ANTD.Divider />
          <footer>
            {!!account && (
              <ANTD.Descriptions title="Transaction Details" layout="vertical" bordered>
                <ANTD.Descriptions.Item label="From Account">{account}</ANTD.Descriptions.Item>
                <ANTD.Descriptions.Item label="Token Contract">{account}</ANTD.Descriptions.Item>
                <ANTD.Descriptions.Item label="Single Amount(ETH)">{singleAmount}</ANTD.Descriptions.Item>
                <ANTD.Descriptions.Item label="Total Amount(ETH)">{singleAmount}</ANTD.Descriptions.Item>
                <ANTD.Descriptions.Item label="Send Quantity">{addressListFormat.length}</ANTD.Descriptions.Item>
              </ANTD.Descriptions>
            )}
            <ANTD.List
              size="small"
              header={<div>Header</div>}
              footer={<div>Footer</div>}
              bordered
              dataSource={addressListFormat}
              renderItem={(item) => <ANTD.List.Item>{item}</ANTD.List.Item>}
            />
          </footer>
        </main>
      </div>
    </div>
  )
}

export default App

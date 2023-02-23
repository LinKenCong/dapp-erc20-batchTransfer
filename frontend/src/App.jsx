import { useState } from 'react'
import * as ANTD from 'antd'
import * as ICONS from '@ant-design/icons'
import './App.css'
import { useEffect } from 'react'
import { sliceArray, effectiveAddress } from './utils'
import { Chain_Params, Net_Id } from './config'

function App() {
  // input params
  const [tokenContract, setTokenContract] = useState('')
  const [singleAmount, setSingleAmount] = useState(0)
  const [addressList, setAddressList] = useState([])
  const [addressListFormat, setAddressListFormat] = useState([])
  const [addressListSlice, setAddressListSlice] = useState([])
  const [transferCount, setTransferCount] = useState(0)

  // wallet params
  const [account, setAccount] = useState('')
  const [chainId, setChainId] = useState(Chain_Params[Net_Id].chainId)

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
              params: [Chain_Params[Net_Id]],
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
    // format address
    let list = value ? value.split('\n') : []
    setAddressListFormat(effectiveAddress(list))
    // slice array
    setAddressListSlice(sliceArray(list, 3))
  }

  // loding icon
  const loadingIcon = (
    <ICONS.LoadingOutlined
      style={{
        fontSize: 24,
      }}
      spin
    />
  )
  const doneIcon = (
    <ICONS.CheckCircleFilled
      style={{
        fontSize: 24,
        color: '#52c41a',
      }}
    />
  )
  // loding btn
  const [loadings, setLoadings] = useState([])
  const [btnText, setBtnText] = useState('Transfer !')
  const [isOngoing, setIsOngoing] = useState(false)
  // ModalOpen
  const [isModalOpen, setIsModalOpen] = useState(false)
  // submit
  const submit = async () => {
    // start
    setIsOngoing(true)
    setLoadings((prevLoadings) => {
      const newLoadings = [...prevLoadings]
      newLoadings[0] = true
      return newLoadings
    })
    setBtnText('In Transaction ...')
    setIsModalOpen(true)
    // run code

    // end
    setTimeout(() => {
      setLoadings((prevLoadings) => {
        const newLoadings = [...prevLoadings]
        newLoadings[0] = false
        return newLoadings
      })
      setBtnText('Transfer !')
      setIsOngoing(false)
    }, 6000)
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
                placeholder="Send Address ...."
                value={addressList}
                onChange={handleAddressListChanged}
              />
            </section>
            <section>
              <div className="submit_row">
                <ANTD.Button type="primary" disabled={!account} loading={loadings[0]} onClick={submit}>
                  {account ? btnText : 'Please connect the wallet first!!'}
                </ANTD.Button>
              </div>
              <ANTD.Modal
                className="submit_modal"
                title="In Transaction"
                open={isModalOpen}
                onOk={(e) => setIsModalOpen(false)}
                okButtonProps={{ disabled: isOngoing }}
              >
                <div>
                  {isOngoing ? <ANTD.Spin indicator={loadingIcon} /> : doneIcon}
                  Some contents...
                </div>
              </ANTD.Modal>
            </section>
          </article>
          <ANTD.Divider />
          <footer>
            {!!account && (
              <>
                <ANTD.Descriptions title="Transaction Details" layout="vertical" bordered>
                  <ANTD.Descriptions.Item label="From Account">{account}</ANTD.Descriptions.Item>
                  <ANTD.Descriptions.Item label="Token Contract">{account}</ANTD.Descriptions.Item>
                  <ANTD.Descriptions.Item label="Single Amount(ETH)">{singleAmount}</ANTD.Descriptions.Item>
                  <ANTD.Descriptions.Item label="Total Amount(ETH)">{singleAmount}</ANTD.Descriptions.Item>
                  <ANTD.Descriptions.Item label="Effective Address">{addressListFormat.length}</ANTD.Descriptions.Item>
                </ANTD.Descriptions>
              </>
            )}
          </footer>
        </main>
      </div>
    </div>
  )
}

export default App

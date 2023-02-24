import { useState } from 'react'
import * as ANTD from 'antd'
import * as ICONS from '@ant-design/icons'
import './App.css'
import { useEffect } from 'react'
import { sliceArray, effectiveAddress, erc20Contract, batchTransferContract } from './utils'
import { Chain_Params, Contract_BatchTransfer, Net_Id } from './config'
import { parseEther, formatEther, isAddress } from 'ethers'
import { useRef } from 'react'

function App() {
  /* input params */
  const [tokenContract, setTokenContract] = useState('0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512')
  const [singleAmount, setSingleAmount] = useState(1.23)
  const [addressList, setAddressList] = useState([])
  const [addressListFormat, setAddressListFormat] = useState([])
  const [addressListSlice, setAddressListSlice] = useState([])
  const [transferCount, setTransferCount] = useState(0)

  /* wallet params */
  const [account, setAccount] = useState('')
  const [chainId, setChainId] = useState(Chain_Params[Net_Id].chainId)

  /* wallet active */
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

  /* connect wallet */
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

  /* event wallet */
  useEffect(() => {
    ethereum.on('accountsChanged', handleAccountsChanged)
    ethereum.on('chainChanged', handleChainChanged)
    return () => {
      // clear event
      ethereum.removeListener('accountsChanged', handleAccountsChanged)
      ethereum.removeListener('chainChanged', handleChainChanged)
    }
  }, [])

  /* Input active */
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
    setAddressListFormat(list)
    const effectiveAddressList = effectiveAddress(list)
    setTransferCount(effectiveAddressList.length)
    // slice array
    setAddressListSlice(sliceArray(effectiveAddressList, 5))
  }

  /* loding icon */
  const loadingIcon = (
    <ANTD.Spin
      indicator={
        <ICONS.LoadingOutlined
          style={{
            fontSize: 24,
          }}
          spin
        />
      }
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
  /* loding btn */
  const [verifyWrong, setVerifyWrong] = useState({ status: false, msg: '' })
  const [loadings, setLoadings] = useState([])
  const [btnText, setBtnText] = useState('Transfer !')
  const [isOngoing, setIsOngoing] = useState(false)

  /* Modal Open */
  const [isModalOpen, setIsModalOpen] = useState(false)
  /* Modal List */
  const [approveContract, setApproveContract] = useState(false)
  const [transferSchedule, setTransferSchedule] = useCallbackState({})
  const modalList = [
    <ANTD.List.Item.Meta avatar={approveContract ? doneIcon : loadingIcon} description="Approve Contract" />,
    <ANTD.List.Item.Meta
      avatar={transferSchedule.status ? doneIcon : loadingIcon}
      description={`Transfer Schedule: ${transferSchedule.schedule}/${transferSchedule.total}`}
    />,
  ]

  function useCallbackState(state) {
    const cbRef = useRef()
    const [data, setData] = useState(state)

    useEffect(() => {
      cbRef.current && cbRef.current(data)
    }, [data])

    return [
      data,
      function (val, callback) {
        cbRef.current = callback
        setData(val)
      },
    ]
  }

  /* Verify Form Params */
  const verifyWrongParams = () => {
    if (
      isNaN(transferCount) ||
      isNaN(singleAmount) ||
      transferCount <= 0 ||
      !singleAmount ||
      effectiveAddress([tokenContract]).length == 0
    ) {
      return true
    } else {
      return false
    }
  }

  /* submit */
  const submit = async () => {
    // check params ------------------- //
    if (verifyWrongParams()) return setVerifyWrong({ status: true, msg: 'Please check parameters!' })
    // init params
    setVerifyWrong({ status: false, msg: '' })
    setApproveContract(false)

    // start ------------------- //
    // update params
    setIsOngoing(true)
    setLoadings((prevLoadings) => {
      const newLoadings = [...prevLoadings]
      newLoadings[0] = true
      return newLoadings
    })
    setBtnText('In Transaction ...')
    setIsModalOpen(true)
    // sset transfer schedule
    let scheduleStatus = { total: addressListSlice.length, schedule: 0, status: false }
    setTransferSchedule(scheduleStatus)
    // run code ------------------- //
    // parse totalSendAmount to eth
    const totalSendAmount = parseEther((singleAmount * transferCount).toString())
    // check erc20 token balance
    const _erc20Contract = await erc20Contract(tokenContract)
    const balance = await _erc20Contract.balanceOf(account)
    if (balance < totalSendAmount) return setVerifyWrong({ status: true, msg: 'You do not have enough balance!' })

    // approve
    {
      const allowanceAmount = await _erc20Contract.allowance(account, Contract_BatchTransfer)
      // check/get erc20 token approve
      if (allowanceAmount < totalSendAmount) {
        const tokenApprove = await _erc20Contract.approve(Contract_BatchTransfer, totalSendAmount)
        await tokenApprove.wait()
      }
      // update approve status
      setApproveContract(true)
    }

    // --------------------------- log

    console.log('--------------------------- log')
    console.log('old owner balance', balance)
    console.log('old someone balance', await _erc20Contract.balanceOf(addressListSlice[addressListSlice.length - 1][0]))

    // log ---------------------------

    // get contract
    {
      const _batchTransferContract = await batchTransferContract()
      const onceAmount = parseEther(singleAmount.toString())

      // batch transfer
      for (let i = 0; i < addressListSlice.length; i++) {
        // update transfer schedule
        scheduleStatus.schedule += 1
        setTransferSchedule(scheduleStatus)
        // call slice address list
        const transferBatchCall = await _batchTransferContract.batchCall(tokenContract, addressListSlice[i], onceAmount)
        await transferBatchCall.wait()
      }
    }

    // --------------------------- log

    console.log('now owner balance', await _erc20Contract.balanceOf(account))
    console.log('now someone balance', await _erc20Contract.balanceOf(addressListSlice[addressListSlice.length - 1][0]))
    console.log('log ---------------------------')

    // log ---------------------------

    // end ------------------- //
    // update transfer schedule
    scheduleStatus.status = true
    setTransferSchedule(scheduleStatus)
    // update params
    setLoadings((prevLoadings) => {
      const newLoadings = [...prevLoadings]
      newLoadings[0] = false
      return newLoadings
    })
    setBtnText('Transfer !')
    setIsOngoing(false)
  }

  return (
    <div className="App">
      <div className="container">
        <main className="content">
          <header>
            {/* Button => Connect Wallet */}
            <ANTD.Button type="primary" onClick={connectWallet}>
              {account || 'Connect Wallet'}
            </ANTD.Button>
          </header>
          <ANTD.Divider />
          <article>
            <section className="input_list">
              {/* Input => Token Contract Address */}
              <ANTD.Input
                className="input_item"
                addonBefore="Token Contract Address"
                value={tokenContract}
                onChange={handleTokenContractChanged}
              />
              {/* Input => Single Amount */}
              <ANTD.Input
                className="input_item"
                addonBefore="Single Amount"
                addonAfter="ETH"
                value={singleAmount}
                onChange={handleSingleAmountChanged}
              />
              {/* Input => Send Address List */}
              <ANTD.Input.TextArea
                className="input_item"
                rows={4}
                style={{ resize: 'none' }}
                placeholder="Send Address ...."
                value={addressList}
                onChange={handleAddressListChanged}
              />
              {verifyWrong.status && <ANTD.Alert message={verifyWrong.msg} type="error" showIcon />}
            </section>
            <section>
              <div className="submit_row">
                {/* Button => Submit btn */}
                <ANTD.Button type="primary" disabled={!account} loading={loadings[0]} onClick={submit}>
                  {account ? btnText : 'Please connect the wallet first!!'}
                </ANTD.Button>
              </div>

              {/* Modal => Click Transaction modal */}
              <ANTD.Modal
                className="submit_modal"
                title="In Transaction ..."
                open={isModalOpen}
                onOk={(e) => setIsModalOpen(false)}
                okButtonProps={{ disabled: isOngoing }}
              >
                {/* Modal Content */}
                <aside>
                  <ANTD.List
                    itemLayout="horizontal"
                    dataSource={modalList}
                    renderItem={(item) => <ANTD.List.Item>{item}</ANTD.List.Item>}
                  />
                </aside>
              </ANTD.Modal>
            </section>
          </article>
          <ANTD.Divider />
          <footer>
            {!!account && (
              <>
                {/* Descriptions => This Transaction Info Show */}
                <ANTD.Descriptions title="Transaction Details" layout="vertical" bordered>
                  <ANTD.Descriptions.Item label="From Account">{account}</ANTD.Descriptions.Item>
                  <ANTD.Descriptions.Item label="Token Contract">{account}</ANTD.Descriptions.Item>
                  <ANTD.Descriptions.Item label="Single Amount(ETH)">{singleAmount}</ANTD.Descriptions.Item>
                  <ANTD.Descriptions.Item label="Total Amount(ETH)">
                    {singleAmount * transferCount}
                  </ANTD.Descriptions.Item>
                  <ANTD.Descriptions.Item label="Invalid Address">
                    {addressListFormat.length - transferCount}
                  </ANTD.Descriptions.Item>
                  <ANTD.Descriptions.Item label="Effective Address">{transferCount}</ANTD.Descriptions.Item>
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

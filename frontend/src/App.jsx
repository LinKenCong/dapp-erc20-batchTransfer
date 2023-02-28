import { useState, useEffect } from 'react'
import * as ANTD from 'antd'
import * as ICONS from '@ant-design/icons'
import './App.css'
import { sliceArray, effectiveAddress, erc20Contract, batchTransferContract } from './utils'
import { Chain_Params, Contract_BatchTransfer, Net_Id, SingleTransferSendCount } from './config'
import { parseEther, formatEther, isAddress } from 'ethers'
import ChainSelect from './components/ChainSelect'

function App() {
  /* input params */
  const [tokenContract, setTokenContract] = useState('')
  const [singleAmount, setSingleAmount] = useState(0)
  const [addressList, setAddressList] = useState([])
  const [addressListFormat, setAddressListFormat] = useState([])
  const [addressListSlice, setAddressListSlice] = useState([])
  const [transferCount, setTransferCount] = useState(0)

  /* wallet params */
  const [account, setAccount] = useState('')
  const [netId, setNetId] = useState(0)

  /* wallet active */
  const handleAccountsChanged = async (_accounts) => {
    if (_accounts.length === 0) {
      console.log('Please connect to MetaMask.')
    } else if (_accounts[0] !== account) {
      setAccount(_accounts[0])
    }
  }
  const handleChainChanged = async (_chainId) => {
    // window.location.reload()
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
      await switchChain(netId)
    }
  }

  const switchChain = async (_id) => {
    // get chain
    try {
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: Chain_Params[_id].chainId }],
      })
    } catch (switchError) {
      if (switchError.code === 4902) {
        try {
          await ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [Chain_Params[_id]],
          })
        } catch (addError) {
          console.error('addEthereumChain', addError)
        }
      } else {
        console.error('switchEthereumChainError', switchError)
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
    setAddressListSlice(sliceArray(effectiveAddressList, SingleTransferSendCount))
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
  const [transactionError, setTransactionError] = useState({ status: false, msg: '' })
  const [loadings, setLoadings] = useState([])
  const [btnText, setBtnText] = useState('Transfer !')
  const [isOngoing, setIsOngoing] = useState(false)

  /* Modal Open */
  const [isModalOpen, setIsModalOpen] = useState(false)
  /* Modal List */
  const [approveContract, setApproveContract] = useState(false)
  const [transferSchedule, setTransferSchedule] = useState({})
  const modalList = [
    <ANTD.List.Item.Meta avatar={approveContract ? doneIcon : loadingIcon} description="Approve Contract" />,
    <ANTD.List.Item.Meta
      avatar={transferSchedule.status ? doneIcon : loadingIcon}
      description={`Transfer Schedule: ${transferSchedule.schedule}/${transferSchedule.total}`}
    />,
  ]

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
    await switchChain(netId)
    // check params ------------------- //
    if (verifyWrongParams()) return setVerifyWrong({ status: true, msg: 'Please check parameters!' })
    // init params
    setTransactionError({ status: false, msg: '' })
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
    setTransferSchedule({ ...scheduleStatus })
    // run code ------------------- //
    // parse totalSendAmount to eth
    const totalSendAmount = parseEther((singleAmount * transferCount).toString())
    // check erc20 token balance
    const _erc20Contract = await erc20Contract(tokenContract)
    const balance = await _erc20Contract.balanceOf(account)
    if (balance < totalSendAmount) return setVerifyWrong({ status: true, msg: 'You do not have enough balance!' })

    // approve
    {
      try {
        const allowanceAmount = await _erc20Contract.allowance(account, Contract_BatchTransfer)
        // check/get erc20 token approve
        if (allowanceAmount < totalSendAmount) {
          const tokenApprove = await _erc20Contract.approve(Contract_BatchTransfer, totalSendAmount)
          await tokenApprove.wait()
        }
        // update approve status
        setApproveContract(true)
      } catch (error) {
        console.error('ApproveContract', error)
        endSubmit()
        setTransactionError({ status: true, msg: 'ApproveContract ERROR!' })
        throw 'ApproveContract ERROR'
      }
    }

    // get contract
    {
      const _batchTransferContract = await batchTransferContract()
      const onceAmount = parseEther(singleAmount.toString())

      // batch transfer
      for (let i = 0; i < addressListSlice.length; i++) {
        try {
          // update transfer schedule
          scheduleStatus.schedule += 1
          setTransferSchedule({ ...scheduleStatus })
          // call slice address list
          const transferBatchCall = await _batchTransferContract.batchCall(
            tokenContract,
            addressListSlice[i],
            onceAmount
          )
          await transferBatchCall.wait()
        } catch (error) {
          console.error('BatchTransfer', error)
          endSubmit()
          setTransactionError({
            status: true,
            msg: `BatchTransfer ERROR! Untransferred since address:${addressListSlice[i][0]}`,
          })
          throw 'BatchTransfer ERROR'
        }
      }
    }

    // end ------------------- //
    // update transfer schedule
    scheduleStatus.status = true
    setTransferSchedule({ ...scheduleStatus })
    endSubmit()
  }

  const endSubmit = () => {
    // update params
    setLoadings((prevLoadings) => {
      const newLoadings = [...prevLoadings]
      newLoadings[0] = false
      return newLoadings
    })
    setBtnText('Transfer !')
    setIsOngoing(false)
  }

  /* Components - ChainSelect */
  const chainId = async (_id) => {
    setNetId(_id)
    if (!account) return
    await switchChain(_id)
  }

  return (
    <div className="App">
      <div className="container">
        <main className="content">
          <header>
            <ChainSelect chainId={chainId} />
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
                  {transactionError.status ? (
                    <ANTD.Alert message={transactionError.msg} type="error" showIcon />
                  ) : (
                    <ANTD.List
                      itemLayout="horizontal"
                      dataSource={modalList}
                      renderItem={(item) => <ANTD.List.Item>{item}</ANTD.List.Item>}
                    />
                  )}
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

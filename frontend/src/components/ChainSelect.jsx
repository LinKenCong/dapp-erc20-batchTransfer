import { useEffect, useState } from 'react'
import { Chain_Params } from '../config'
import { Select } from 'antd'

const ChainSelect = (props) => {
  let { chainId } = props
  const [options, setOptions] = useState([])

  useEffect(() => {
    const getChainParams = Chain_Params.map((item, index) => {
      return { value: index, label: item.name }
    })
    setOptions(getChainParams)
  }, [])

  const handleChange = (value) => {
    chainId(value)
  }

  return <Select className='chainSelect' defaultValue={0} onChange={handleChange} options={options} />
}
export default ChainSelect

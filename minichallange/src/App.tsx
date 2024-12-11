import { useEffect, useState } from 'react'
import { getDataTemplate } from './util/fetchers'
import './App.css'

function App() {
  const [data, setData] = useState<number[]>([])

  useEffect(() => { 
    const fetchData = async () => {
      const data = await getDataTemplate()
      setData(data)
    }
    fetchData()
  }, [])

  useEffect(() => {
    console.log(data)
  },[data]);

  return (
    <>
      <div>
      </div>
    </>
  )
}

export default App

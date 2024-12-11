import { useEffect, useState } from 'react'
import { getDataTemplate } from './util/fetchers'
import './App.css'
import ParallelCoordinatesPlot from './components/ParallelCoordinatesPlot'


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
        <h1>Mini Challenge</h1>
        <ParallelCoordinatesPlot />
      </div>
    </>
  )
}

export default App

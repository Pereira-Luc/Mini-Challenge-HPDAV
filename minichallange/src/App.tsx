import { useEffect, useState } from 'react'
import { getDataTemplate } from './util/fetchers'
import './App.css'
import ParallelCoordinatesPlot from './components/ParallelCoordinatesPlot'
import DensityPlot from './components/DensityPlot'


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
        <DensityPlot />
      </div>
    </>
  )
}

export default App

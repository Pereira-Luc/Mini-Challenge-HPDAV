import { useEffect, useState } from "react";

import {
  getIDSDataByDateTimeRange,
  getFirewallDataByDateTimeRange,
} from "./util/fetchers";
import "./App.css";
import Filters from "./components/filters";
import DaySelector from "./components/DaySelector";
import TimeIntervalControls from "./components/TimeIntervalControls";
import { FirewallData, IDSData, TimeWindow } from "./util/interface";
import ParallelCoordinatesPlot from "./components/ParallelCoordinatesPlot";

import TrafficFlowVisualizationIDS from "./components/TrafficFlowVisualizationIDS";
import TrafficFlowVisualizationFirewall from "./components/TrafficFlowVisualizationFirewall"
import CategorySelector from "./components/CategorySelector";

import HistContainerFirewall from "./components/hist/HistContainerFirewall"
import HistContainerIDS from "./components/hist/HistContainerIDS"

import { fetchAllCategoryData } from "./util/fetchers";

enum GraphType {
  ParallelCoordinatesPlot = "ParallelCoordinatesPlot",
  TraficFlow = "TraficFlow",
  HistContainer = "HistContainer",
}




const MIN_TIME = new Date("2012-04-05T17:51:26");
const MAX_TIME = new Date("2012-04-07T09:00:04");

const formatDate = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const formatDateToISO = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}T${String(
    date.getHours()
  ).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}:${String(date.getSeconds()).padStart(2, "0")}`;

function App() {
  // Initial filters for IDS and Firewall data
  const initialIDSFilters = {
    sourcePort: "",
    destinationPort: "",
    priority: "",
    classification: "",
    ipAddress: "",
    degree: { min: 0, max: 100 },
    closeness: { min: 0, max: 1 },
    betweenness: { min: 0, max: 1 },
    eigenvector: { min: 0, max: 1 },
  };

  const initialFirewallFilters = {
    protocol: "",
    sourcePort: "",
    destinationPort: "",
    priority: "",
    classification: "",
    ipAddress: "",
  };

  // States for IDS Data
  const [idsData, setIDSData] = useState<IDSData[]>([]);
  const [filteredIDSData, setFilteredIDSData] = useState<IDSData[]>([]);
  const [selectedIDSFilters, setSelectedIDSFilters] = useState(initialIDSFilters);
  
  const [uniqueIDSValues, setUniqueIDSValues] = useState({
    sourcePort: [] as string[],
    destinationPort: [] as string[],
    priority: [] as string[],
    classification: [] as string[],
    label: [] as string[],
  });

  // States for Firewall Data
  const [firewallData, setFirewallData] = useState<FirewallData[]>([]);
  const [filteredFirewallData, setFilteredFirewallData] = useState<FirewallData[]>([]);
  const [selectedFirewallFilters, setSelectedFirewallFilters] = useState(initialFirewallFilters);
  const [uniqueFirewallValues, setUniqueFirewallValues] = useState({
    protocol: [] as string[],
    sourcePort: [] as string[],
    destinationPort: [] as string[],
  });
  const [enableMasking, setEnableMasking] = useState(true);

  const [displayedGraph, setDisplayedGraph] = useState(GraphType.TraficFlow);

  const [selectedCategory, setSelectedCategory] = useState<IPCategory | ''>('');

  const fetchCategoryData = async (start: string, end: string) => {
    try {
      if (selectedCategory) {
        const data = await fetchAllCategoryData(selectedCategory, start, end);
        
        // Update IDS data
        setIDSData(data.ids);
        setFilteredIDSData(data.ids);
        extractUniqueIDSValues(data.ids);
        
        // Update Firewall data
        setFirewallData(data.firewall);
        setFilteredFirewallData(data.firewall);
        extractUniqueFirewallValues(data.firewall);
        
        setTimeWindow({ start, end });
      }
    } catch (error) {
      console.error("Error fetching category data:", error);
    }
  };
  

  // Date and Time States
  const [selectedDay, setSelectedDay] = useState<string>(formatDate(MIN_TIME));
  const [startTime, setStartTime] = useState<string>("2012-04-05T17:51:26");
  const [endTime, setEndTime] = useState<string>("2012-04-05T18:00:00");
  const [intervalSize, setIntervalSize] = useState<number>(5);
  const [timeWindow, setTimeWindow] = useState<TimeWindow>({ start: startTime, end: endTime });

  // Fetch IDS Data
  const fetchIDSData = async (start: string, end: string) => {
    try {
      const data: IDSData[] = await getIDSDataByDateTimeRange(start, end);
      setIDSData(data);
      setFilteredIDSData(data);
      extractUniqueIDSValues(data);
      setTimeWindow({ start: start, end: end });
    } catch (error) {
      console.error("Error fetching IDS data:", error);
    }
  };

  const extractUniqueIDSValues = (data: IDSData[]) => {
    const sourcePorts = Array.from(new Set(data.map((item) => String(item.SourcePort)).filter(Boolean)));
    const destinationPorts = Array.from(new Set(data.map((item) => String(item.DestinationPort)).filter(Boolean)));
    const priorities = Array.from(new Set(data.map((item) => String(item.Priority)).filter(Boolean)));
    const classifications = Array.from(new Set(data.map((item) => item.Classification).filter(Boolean)));
    const labels = Array.from(new Set(data.map((item) => item.Label).filter(Boolean)));

    setUniqueIDSValues({
      sourcePort: sourcePorts,
      destinationPort: destinationPorts,
      priority: priorities,
      classification: classifications,
      label: labels,
    });
  };

  // Fetch Firewall Data
  const fetchFirewallData = async (start: string, end: string) => {
    try {
      const data: FirewallData[] = await getFirewallDataByDateTimeRange(start, end);
      setFirewallData(data);
      setFilteredFirewallData(data);
      extractUniqueFirewallValues(data);
      setTimeWindow({ start: start, end: end });
    } catch (error) {
      console.error("Error fetching Firewall data:", error);
    }
  };

  const extractUniqueFirewallValues = (data: FirewallData[]) => {
    const protocols = Array.from(new Set(data.map((item) => item.Protocol).filter(Boolean)));
    const sourcePorts = Array.from(new Set(data.map((item) => String(item.SourcePort)).filter(Boolean)));
    const destinationPorts = Array.from(new Set(data.map((item) => String(item.DestinationPort)).filter(Boolean)));


    setUniqueFirewallValues({
      protocol: protocols,
      sourcePort: sourcePorts,
      destinationPort: destinationPorts,
    });
  };

  // Handle Day Change
  const handleDayChange = (day: string) => {
    setSelectedDay(day);
    const dayStart = new Date(`${day}T00:00:00`);
    const clampedStart = new Date(Math.max(dayStart.getTime(), MIN_TIME.getTime()));
    setStartTime(formatDateToISO(clampedStart));
    setEndTime(formatDateToISO(new Date(clampedStart.getTime() + intervalSize * 60 * 1000)));
  };

// Filter IDS Data
const applyIDSFilters = () => {
  let filtered = idsData;
  const { sourcePort, destinationPort, priority, classification, ipAddress } = selectedIDSFilters;

  if (sourcePort)
    filtered = filtered.filter((item) => String(item.SourcePort) === sourcePort.trim());
  
  if (destinationPort)
    filtered = filtered.filter((item) => String(item.DestinationPort) === destinationPort.trim());
  
  if (priority)
    filtered = filtered.filter((item) => String(item.Priority) === priority.trim());
  
  if (classification)
    filtered = filtered.filter((item) =>
      item.Classification?.toLowerCase().includes(classification.trim().toLowerCase())
    );

  if (ipAddress)
    filtered = filtered.filter(
      (item) =>
        item.SourceIP?.includes(ipAddress.trim()) || item.DestinationIP?.includes(ipAddress.trim())
    );

  setFilteredIDSData(filtered);
};


const applyFirewallFilters = () => {
  let filtered = firewallData;
  const { sourcePort, destinationPort, protocol, ipAddress } = selectedFirewallFilters;

  if (sourcePort)
    filtered = filtered.filter((item) => String(item.SourcePort) === sourcePort.trim());

  if (destinationPort)
    filtered = filtered.filter((item) => String(item.DestinationPort) === destinationPort.trim());

  if (protocol)
    filtered = filtered.filter((item) => item.Protocol === protocol.trim());

  if (ipAddress)
    filtered = filtered.filter(
      (item) =>
        item.SourceIP?.includes(ipAddress.trim()) || item.DestinationIP?.includes(ipAddress.trim())
    );

  console.log("filtered: " , filtered);
  setFilteredFirewallData(filtered);
};


  // Handle Time Interval Change
  const handleTimeIntervalChange = (direction: "forward" | "backward") => {
    console.log("Changing Time Interval:", direction);
    const start = new Date(startTime);
    const intervalInMs = intervalSize * 60 * 1000;
    const newStart = new Date(
      direction === "forward"
        ? Math.min(start.getTime() + intervalInMs, MAX_TIME.getTime())
        : Math.max(start.getTime() - intervalInMs, MIN_TIME.getTime())
    );
    setStartTime(formatDateToISO(newStart));
    setEndTime(formatDateToISO(new Date(newStart.getTime() + intervalInMs)));
  };


  const onFilterChange = (
    filterType: "ids" | "fw",
    field: string,
    value: string | { min: number; max: number }
  ) => {
    if (filterType === "ids") {
      setSelectedIDSFilters((prev) => ({ ...prev, [field]: value }));
    } else if (filterType === "fw") {
      setSelectedFirewallFilters((prev) => ({ ...prev, [field]: value }));
    }
  };
  
  

  

  const handleAcceptTime = (acceptedStartTime: string, acceptedEndTime: string) => {
    console.log("Accepted Time Range:", { start: acceptedStartTime, end: acceptedEndTime });

    // Example: Updating state or triggering other actions
    setStartTime(`${selectedDay}T${acceptedStartTime}`);
    setEndTime(`${selectedDay}T${acceptedEndTime}`);
};

  // Fetch Data on Time Change
  useEffect(() => {
    if (selectedCategory) {
      fetchCategoryData(startTime, endTime);
    } else {
      fetchIDSData(startTime, endTime);
      fetchFirewallData(startTime, endTime);
    }
  }, [startTime, endTime, selectedCategory]);

  return (
    <div style={{ width: "100%", height: "100vh", padding: "20px" }}>
      <h1>Traffic Flow Visualization</h1>

      {/* IDS Filters */}
      <Filters
        uniqueIDSValues={uniqueIDSValues}
        uniqueFirewallValues={uniqueFirewallValues}
        selectedIDSFilters={selectedIDSFilters}
        selectedFirewallFilters={selectedFirewallFilters}
        onFilterChange={onFilterChange} 
        onApplyFilters={(filters) => {
          if (filters === selectedIDSFilters) {
            applyIDSFilters();
          } else if (filters === selectedFirewallFilters) {
            applyFirewallFilters();
          }
        }}
      />


      <DaySelector selectedDay={selectedDay} minTime={MIN_TIME} maxTime={MAX_TIME} onDayChange={handleDayChange} />

      <TimeIntervalControls
        startTime={startTime}
        endTime={endTime}
        isAtStart={startTime === formatDateToISO(MIN_TIME)}
        isAtEnd={endTime === formatDateToISO(MAX_TIME)}
        onIntervalChange={handleTimeIntervalChange}
        changeItervalSize={setIntervalSize}
        onAcceptTime={handleAcceptTime}
      />
      
      <div>
        <select 
          value={displayedGraph} 
          onChange={(e) => setDisplayedGraph(e.target.value as GraphType)}
          style={{ marginBottom: "20px" }}
        >
          <option value={GraphType.ParallelCoordinatesPlot}>Parallel Coordinates</option>
          <option value={GraphType.TraficFlow}>Traffic Flow</option>
          <option value={GraphType.HistContainer}>Bar Chart</option>
        </select>
        <label>
          <input 
            type="checkbox" 
            checked={enableMasking}
            onChange={(e) => setEnableMasking(e.target.checked)} 
          />
          Masking
        </label>
        
        <CategorySelector selectedCategory={selectedCategory} onCategoryChange={setSelectedCategory} />

        <div className="container">
            {displayedGraph === GraphType.ParallelCoordinatesPlot ? (
            <>
              <div className="child">
              <ParallelCoordinatesPlot width={1280} height={1280} timeWindow={timeWindow} mgData={filteredIDSData} enableMasking={enableMasking} />
              </div>
              <div className="child">
              <ParallelCoordinatesPlot width={1280} height={1280} timeWindow={timeWindow} mgData={filteredFirewallData} enableMasking={enableMasking} />
              </div>
            </>
            ) : displayedGraph === GraphType.TraficFlow ? (
            <>
              <div className="child">
              <TrafficFlowVisualizationIDS data={filteredIDSData} filter={null} />
              </div>
              <div className="child">
              <TrafficFlowVisualizationFirewall data={filteredFirewallData} filter={null} />
              </div>
            </>
            ) : (
            <>
              <div className="child">
              <HistContainerIDS data={filteredIDSData} filter={null} />
              </div>
              <div className="child">
              <HistContainerFirewall data={filteredFirewallData} filter={null} />
              </div>
            </>
            )}
        </div>
      </div>  
    </div>
  );
}

export default App;

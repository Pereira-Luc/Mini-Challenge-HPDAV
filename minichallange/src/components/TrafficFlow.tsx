import { SetStateAction, useEffect, useState } from "react";
import { getMergedDataByDateTimeRange } from "../util/fetchers";
import { MergedData } from "../util/interface";
import TrafficFlowVisualization from "./TrafficFlowVisualization";
import Filters from "./filters";
import DaySelector from "./DaySelector";
import TimeIntervalControls from "./TimeIntervalControls";

const MIN_TIME = new Date("2012-04-05T17:51:26");
const MAX_TIME = new Date("2012-04-07T09:00:04");

// Helper to format date into 'YYYY-MM-DD'
const formatDate = (date: Date): string =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const TrafficFlow = () => {
    const initialFilters = {
        protocol: "",
        sourcePort: "",
        destinationPort: "",
        priority: "",
        classification: "",
        ipAddress: "",
        degree: { min: 0, max: 100 }, // Default range for degree
        closeness: { min: 0, max: 1 }, // Closeness is usually normalized
        betweenness: { min: 0, max: 1 },
        eigenvector: { min: 0, max: 1 },
    };
    
    const [mergedData, setMergedData] = useState<MergedData[]>([]);
    const [selectedDay, setSelectedDay] = useState<string>(formatDate(MIN_TIME));
    const [startTime, setStartTime] = useState<string>("2012-04-05T17:51:26");
    const [endTime, setEndTime] = useState<string>("2012-04-05T18:00:00");
    const [intervalSize, setIntervalSize] = useState<number>(5);
    const [filteredData, setFilteredData] = useState<MergedData[]>([]);
    const [selectedFilters, setSelectedFilters] = useState(initialFilters);
    const [uniqueValues, setUniqueValues] = useState({
        protocol: [] as string[],
        sourcePort: [] as string[],
        destinationPort: [] as string[],
        priority: [] as string[],
        classification: [] as string[],
    });


    // Fetch Data
    const fetchData = async (start: string, end: string) => {
        try {
            const data: MergedData[] = await getMergedDataByDateTimeRange(start, end);
            console.log("Fetched Merged Data:", data); // Log fetched data

            setMergedData(data);
            setFilteredData(data); // Initialize with all data
            extractUniqueValues(data);
        } catch (error) {
            console.error("Error fetching merged data:", error);
        }
    };

    // Extract unique values for filters
    const extractUniqueValues = (data: MergedData[]) => {
        const protocols = Array.from(new Set(data.map((item) => item.Protocol).filter(Boolean)));
        const sourcePorts = Array.from(new Set(data.map((item) => String(item.SourcePort)).filter(Boolean)));
        const destinationPorts = Array.from(new Set(data.map((item) => String(item.DestinationPort)).filter(Boolean)));
        const priorities = Array.from(new Set(data.map((item) => String(item.Priority)).filter(Boolean)));
        const classifications = Array.from(new Set(data.map((item) => item.Classification).filter(Boolean)));

        setUniqueValues({
            protocol: protocols,
            sourcePort: sourcePorts,
            destinationPort: destinationPorts,
            priority: priorities,
            classification: classifications,
        });

    };

    useEffect(() => {
        fetchData(startTime, endTime);
    }, [startTime, endTime]);


    // Handle filter changes
    const handleFilterChange = (field: string, value: string | { min: number; max: number }) => {
        setSelectedFilters((prev) => ({
            ...prev,
            [field]: value,
        }));
    };
    const applyFilters = (filters: any) => {
        console.log("Applying Filters:", filters); // Debug incoming filters
        console.log("Original Merged Data:", mergedData); // Debug original data
    
        let filtered = mergedData;
    
        // Apply filters only if the value is not empty or default
        if (filters.protocol) {
            console.log("Before protocol filter:", filtered);
            filtered = filtered.filter(
                (item) =>
                    item.Protocol &&
                    item.Protocol.toLowerCase() === filters.protocol.trim().toLowerCase()
            );
            console.log("After protocol filter:", filtered);
        }
        if (filters.sourcePort) {
            console.log("Before sourcePort filter:", filtered);
            filtered = filtered.filter(
                (item) => String(item.SourcePort) === filters.sourcePort.trim()
            );
            console.log("After sourcePort filter:", filtered);
        }
        if (filters.destinationPort) {
            console.log("Before destinationPort filter:", filtered);
            filtered = filtered.filter(
                (item) => String(item.DestinationPort) === filters.destinationPort.trim()
            );
            console.log("After destinationPort filter:", filtered);
        }
        if (filters.priority) {
            console.log("Before priority filter:", filtered);
            filtered = filtered.filter(
                (item) =>
                    String(item.Priority)?.toLowerCase() ===
                    filters.priority.trim().toLowerCase()
            );
            console.log("After priority filter:", filtered);
        }
        if (filters.classification) {
            console.log("Before classification filter:", filtered);
            filtered = filtered.filter((item) =>
                item.Classification?.toLowerCase().includes(
                    filters.classification.trim().toLowerCase()
                )
            );
            console.log("After classification filter:", filtered);
        }
        if (filters.ipAddress) {
            console.log("Before ipAddress filter:", filtered);
            const ipFilter = filters.ipAddress.trim();
            filtered = filtered.filter(
                (item) =>
                    item.SourceIP?.includes(ipFilter) ||
                    item.DestinationIP?.includes(ipFilter)
            );
            console.log("After ipAddress filter:", filtered);
        }
    
        // Numeric filters (e.g., degree, closeness)
        if (filters.degree.min !== 0 || filters.degree.max !== 100) {
            console.log("Before degree filter:", filtered);
            filtered = filtered.filter(
                (item) =>
                    item.Degree >= filters.degree.min &&
                    item.Degree <= filters.degree.max
            );
            console.log("After degree filter:", filtered);
        }
        if (filters.closeness.min !== 0 || filters.closeness.max !== 1) {
            console.log("Before closeness filter:", filtered);
            filtered = filtered.filter(
                (item) =>
                    item.Closeness >= filters.closeness.min &&
                    item.Closeness <= filters.closeness.max
            );
            console.log("After closeness filter:", filtered);
        }
        if (filters.betweenness.min !== 0 || filters.betweenness.max !== 1) {
            console.log("Before betweenness filter:", filtered);
            filtered = filtered.filter(
                (item) =>
                    item.Betweenness >= filters.betweenness.min &&
                    item.Betweenness <= filters.betweenness.max
            );
            console.log("After betweenness filter:", filtered);
        }
        if (filters.eigenvector.min !== 0 || filters.eigenvector.max !== 1) {
            console.log("Before eigenvector filter:", filtered);
            filtered = filtered.filter(
                (item) =>
                    item.Eigenvector >= filters.eigenvector.min &&
                    item.Eigenvector <= filters.eigenvector.max
            );
            console.log("After eigenvector filter:", filtered);
        }
    
        console.log("Filtered Data:", filtered); // Debug final filtered result
        setFilteredData(filtered);
    };
    
    
    // Generate list of days in the range
    const days = [];
    let current = new Date(MIN_TIME);
    while (current <= MAX_TIME) {
        days.push(formatDate(current));
        current.setDate(current.getDate() + 1);
    }

    // Update time based on day selection
    const handleDayChange = (day: string) => {
        setSelectedDay(day);

        const dayStart = new Date(`${day}T00:00:00`);
        const dayEnd = new Date(`${day}T23:59:59`);

        const clampedStart = new Date(Math.max(dayStart.getTime(), MIN_TIME.getTime()));
        const clampedEnd = new Date(Math.min(dayEnd.getTime(), MAX_TIME.getTime()));

        setStartTime(formatDateToISO(clampedStart));
        setEndTime(formatDateToISO(new Date(clampedStart.getTime() + intervalSize * 60 * 1000)));
    };

    const handleTimeIntervalChange = (direction: "forward" | "backward") => {
        const start = new Date(startTime);
        const intervalInMs = intervalSize * 60 * 1000;

        const dayStart = new Date(`${selectedDay}T00:00:00`);
        const dayEnd = new Date(`${selectedDay}T23:59:59`);

        let newStart: Date;
        if (direction === "forward") {
            newStart = new Date(Math.min(start.getTime() + intervalInMs, Math.min(dayEnd.getTime(), MAX_TIME.getTime())));
        } else {
            newStart = new Date(Math.max(start.getTime() - intervalInMs, Math.max(dayStart.getTime(), MIN_TIME.getTime())));
        }

        const newEnd = new Date(Math.min(newStart.getTime() + intervalInMs, dayEnd.getTime()));

        setStartTime(formatDateToISO(newStart));
        setEndTime(formatDateToISO(newEnd));
    };

    const isAtStart = new Date(startTime).getTime() <= Math.max(new Date(`${selectedDay}T00:00:00`).getTime(), MIN_TIME.getTime());
    const isAtEnd = new Date(endTime).getTime() >= Math.min(new Date(`${selectedDay}T23:59:59`).getTime(), MAX_TIME.getTime());

    return (
        <div style={{ width: "100%", height: "100vh", padding: "20px" }}>
            <h1>Dynamic Traffic Flow</h1>

            <div style = {{ marginBottom: "20px" }}>
            {/* Filters Component */}
            <Filters
                uniqueValues={uniqueValues}
                selectedFilters={selectedFilters}
                onFilterChange={handleFilterChange}
                onApplyFilters={applyFilters}
            />
            </div>
            <DaySelector
                selectedDay={selectedDay}
                days={days}
                onDayChange={handleDayChange}
            />


            <TimeIntervalControls
                startTime={startTime}
                endTime={endTime}
                isAtStart={isAtStart}
                isAtEnd={isAtEnd}
                onIntervalChange={handleTimeIntervalChange}
            />
            {/* Slider for Interval Size */}
            <div style={{ marginBottom: "20px" }}>
                <label htmlFor="intervalSize">Interval Size (minutes): </label>
                <input
                    type="range"
                    id="intervalSize"
                    min="1"
                    max="60"
                    value={intervalSize}
                    onChange={(e) => setIntervalSize(Number(e.target.value))}
                />
                <span>{intervalSize} minutes</span>
            </div>

            {/* Visualization Component */}
            <TrafficFlowVisualization 
            data={filteredData} 
            filter={null} 
            onMetricsUpdate={(updatedNodes) => {
                console.log("Updated Nodes from Worker:", updatedNodes);

                const mergedWithMetrics = mergedData.map((item) => {
                    const node = updatedNodes.find(
                        (n) => n.id === item.SourceIP || n.id === item.DestinationIP
                    );
                    return {
                        ...item,
                        Degree: node?.degree || 0,
                        Closeness: node?.closeness || 0,
                        Betweenness: node?.betweenness || 0,
                        Eigenvector: node?.eigenvector || 0,
                    };
                });
                setFilteredData(mergedWithMetrics);
    }}
/>

        </div>
    );
};

// Helper function for consistent ISO formatting
const formatDateToISO = (date: Date): string => {
    const pad = (num: number) => String(num).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(
        date.getMinutes()
    )}:${pad(date.getSeconds())}`;
};

export default TrafficFlow;

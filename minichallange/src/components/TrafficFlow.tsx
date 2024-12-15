import { useEffect, useState } from "react";
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
    const [mergedData, setMergedData] = useState<MergedData[]>([]);
    const [selectedDay, setSelectedDay] = useState<string>(formatDate(MIN_TIME));
    const [startTime, setStartTime] = useState<string>("2012-04-05T17:51:26");
    const [endTime, setEndTime] = useState<string>("2012-04-05T18:00:00");
    const [intervalSize, setIntervalSize] = useState<number>(5);
    const [filteredData, setFilteredData] = useState<MergedData[]>([]);
    const [selectedFilters, setSelectedFilters] = useState({
        protocol: "",
        sourcePort: "",
        destinationPort: "",
        priority: "",
        classification: "",
        ipAddress: "",
    });
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
    const handleFilterChange = (field: string, value: string) => {
        setSelectedFilters({ ...selectedFilters, [field]: value });
        applyFilters({ ...selectedFilters, [field]: value });
    };

    const applyFilters = (filters: any) => {
        console.log("Applying Filters:", filters); // Log incoming filters
        console.log("Original Merged Data:", mergedData); // Log the unfiltered data
    
        let filtered = mergedData;
        console.log("filtered Data: ", filtered);
    
        if (filters.protocol) {
            filtered = filtered.filter(
                (item) => item.Protocol?.toLowerCase() === filters.protocol.trim().toLowerCase()
            );
        }
        if (filters.sourcePort) {
            filtered = filtered.filter(
                (item) => String(item.SourcePort) === filters.sourcePort.trim()
            );
        }
        if (filters.destinationPort) {
            filtered = filtered.filter(
                (item) => String(item.DestinationPort) === filters.destinationPort.trim()
            );
        }
        if (filters.priority) {
            filtered = filtered.filter(
                (item) => String(item.Priority)?.toLowerCase() === filters.priority.trim().toLowerCase()
            );
        }
        if (filters.classification) {
            filtered = filtered.filter(
                (item) => item.Classification?.toLowerCase().includes(filters.classification.trim().toLowerCase())
            );
        }
        if (filters.ipAddress) {
            const ipFilter = filters.ipAddress.trim();
            filtered = filtered.filter(
                (item) =>
                    item.SourceIP?.includes(ipFilter) || item.DestinationIP?.includes(ipFilter)
            );
        }        
        console.log("Filtered Data:", filtered); // Log the filtered result
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
                onFilterChange={handleFilterChange}
                onApplyFilters={applyFilters}
                selectedFilters={selectedFilters}
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
            <TrafficFlowVisualization data={filteredData} filter={null} />
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

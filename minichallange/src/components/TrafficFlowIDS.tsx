import { useEffect, useState } from "react";
import { getIDSDataByDateTimeRange } from "../util/fetchers";
import { IDSData } from "../util/interface";
import TrafficFlowVisualizationIDS from "./TrafficFlowVisualizationIDS";
import Filters from "./filters";

// Constants
const MIN_TIME = new Date("2012-04-05T17:51:00");
const MAX_TIME = new Date("2012-04-07T09:01:00");

// Helper to format dates into ISO
const formatDateToISO = (date: Date): string =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}T${String(
        date.getHours()
    ).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}:${String(date.getSeconds()).padStart(2, "0")}`;

const formatDate = (date: Date): string =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

// Filter State Interface
interface FilterState {
    sourcePort: string;
    destinationPort: string;
    priority: string;
    classification: string;
    ipAddress: string;
}

// Initial Filters
const INITIAL_FILTERS: FilterState = {
    sourcePort: "",
    destinationPort: "",
    priority: "",
    classification: "",
    ipAddress: "",
};

const TrafficFlowIDS = () => {
    // States
    const [idsData, setIDSData] = useState<IDSData[]>([]);
    const [filteredData, setFilteredData] = useState<IDSData[]>([]);
    const [selectedFilters, setSelectedFilters] = useState<FilterState>(INITIAL_FILTERS);

    const [uniqueValues, setUniqueValues] = useState({
        sourcePort: [] as string[],
        destinationPort: [] as string[],
        priority: [] as string[],
        classification: [] as string[],
    });

    const [selectedDay, setSelectedDay] = useState<string>(formatDate(MIN_TIME));
    const [startTime, setStartTime] = useState<string>(formatDateToISO(MIN_TIME));
    const [endTime, setEndTime] = useState<string>(formatDateToISO(new Date(MIN_TIME.getTime() + 5 * 60 * 1000)));
    const [intervalSize, setIntervalSize] = useState<number>(5);

    // Fetch Data
    const fetchData = async (start: string, end: string) => {
        try {
            const data: IDSData[] = await getIDSDataByDateTimeRange(start, end);
            setIDSData(data);
            setFilteredData(data);
            extractUniqueValues(data);
        } catch (error) {
            console.error("Error fetching IDS data:", error);
            alert("Failed to load IDS data. Please try again later.");
        }
    };

    // Extract unique filter values
    const extractUniqueValues = (data: IDSData[]) => {
        const sourcePorts = Array.from(new Set(data.map((item) => String(item.SourcePort)).filter(Boolean)));
        const destinationPorts = Array.from(new Set(data.map((item) => String(item.DestinationPort)).filter(Boolean)));
        const priorities = Array.from(new Set(data.map((item) => String(item.Priority)).filter(Boolean)));
        const classifications = Array.from(new Set(data.map((item) => item.Classification).filter(Boolean)));

        setUniqueValues({
            sourcePort: sourcePorts,
            destinationPort: destinationPorts,
            priority: priorities,
            classification: classifications,
        });
    };

    // Apply Filters
    const applyFilters = () => {
        let filtered = idsData;

        const { sourcePort, destinationPort, priority, classification, ipAddress } = selectedFilters;

        if (sourcePort) filtered = filtered.filter((item) => item.SourcePort?.toString() === sourcePort);
        if (destinationPort) filtered = filtered.filter((item) => item.DestinationPort?.toString() === destinationPort);
        if (priority) filtered = filtered.filter((item) => item.Priority?.toString() === priority);
        if (classification)
            filtered = filtered.filter((item) =>
                item.Classification?.toLowerCase().includes(classification.toLowerCase())
            );
        if (ipAddress)
            filtered = filtered.filter(
                (item) =>
                    item.SourceIP?.includes(ipAddress.trim()) || item.DestinationIP?.includes(ipAddress.trim())
            );

        setFilteredData(filtered);
    };

    // Update Time Interval
    const handleTimeIntervalChange = (direction: "forward" | "backward") => {
        const start = new Date(startTime);
        const intervalInMs = intervalSize * 60 * 1000;

        const newStart = new Date(
            direction === "forward"
                ? Math.min(start.getTime() + intervalInMs, MAX_TIME.getTime())
                : Math.max(start.getTime() - intervalInMs, MIN_TIME.getTime())
        );
        const newEnd = new Date(newStart.getTime() + intervalInMs);

        setStartTime(formatDateToISO(newStart));
        setEndTime(formatDateToISO(newEnd));
    };

    // Day Change Handler
    const handleDayChange = (day: string) => {
        const dayStart = new Date(`${day}T00:00:00`);
        setSelectedDay(day);

        const clampedStart = new Date(Math.max(dayStart.getTime(), MIN_TIME.getTime()));
        setStartTime(formatDateToISO(clampedStart));
        setEndTime(formatDateToISO(new Date(clampedStart.getTime() + intervalSize * 60 * 1000)));
    };

    // Fetch data on time range change
    useEffect(() => {
        fetchData(startTime, endTime);
    }, [startTime, endTime]);

    return (
        <div style={{ width: "100%", height: "100vh", padding: "20px" }}>
            <h1>IDS Traffic</h1>
            {/* Visualization */}
            <TrafficFlowVisualizationIDS data={filteredData} filter={null} />

            {/* Date Controls */}
            <div>
                <label>Select Day: </label>
                <input
                    type="date"
                    value={selectedDay}
                    min={formatDate(MIN_TIME)}
                    max={formatDate(MAX_TIME)}
                    onChange={(e) => handleDayChange(e.target.value)}
                />

                <button onClick={() => handleTimeIntervalChange("backward")}>Previous</button>
                <button onClick={() => handleTimeIntervalChange("forward")}>Next</button>
            </div>
        </div>
    );
};

export default TrafficFlowIDS;

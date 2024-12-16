import { useEffect, useState } from "react";
import { getMergedDataByDateTimeRange } from "./util/fetchers";
import { MergedData } from "./util/interface";
import Filters from "./components/filters";
import DaySelector from "./components/DaySelector";
import TimeIntervalControls from "./components/TimeIntervalControls";
import TrafficFlow from "./components/TrafficFlow";
import ParallelCoordinatesPlot from "./components/ParallelCoordinatesPlot";

import HistContainer from "./components/hist/HistContainer.jsx";

const MIN_TIME = new Date("2012-04-05T17:51:26");
const MAX_TIME = new Date("2012-04-07T09:00:04");

const formatDate = (date: Date): string =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const App = () => {
    const initialFilters = {
        protocol: "",
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

    const [mergedData, setMergedData] = useState<MergedData[]>([]);
    const [filteredData, setFilteredData] = useState<MergedData[]>([]);
    const [selectedFilters, setSelectedFilters] = useState(initialFilters);
    const [uniqueValues, setUniqueValues] = useState({
        protocol: [] as string[],
        sourcePort: [] as string[],
        destinationPort: [] as string[],
        priority: [] as string[],
        classification: [] as string[],
    });

    const [selectedDay, setSelectedDay] = useState<string>(formatDate(MIN_TIME));
    const [startTime, setStartTime] = useState<string>("2012-04-05T17:51:26");
    const [endTime, setEndTime] = useState<string>("2012-04-05T18:00:00");
    const [intervalSize, setIntervalSize] = useState<number>(5);

    const fetchData = async (start: string, end: string) => {
        try {
            const data: MergedData[] = await getMergedDataByDateTimeRange(start, end);
            setMergedData(data);
            setFilteredData(data);
            extractUniqueValues(data);
        } catch (error) {
            console.error("Error fetching merged data:", error);
        }
    };

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

    const applyFilters = (filters: typeof initialFilters) => {
        let filtered = mergedData;
        if (filters.protocol) {
            filtered = filtered.filter((item) => item.Protocol?.toLowerCase() === filters.protocol.toLowerCase());
        }
        if (filters.sourcePort) {
            filtered = filtered.filter((item) => String(item.SourcePort) === filters.sourcePort);
        }
        if (filters.destinationPort) {
            filtered = filtered.filter((item) => String(item.DestinationPort) === filters.destinationPort);
        }
        if (filters.priority) {
            filtered = filtered.filter((item) => String(item.Priority) === filters.priority);
        }
        if (filters.classification) {
            filtered = filtered.filter((item) =>
                item.Classification?.toLowerCase().includes(filters.classification.toLowerCase())
            );
        }
        if (filters.ipAddress) {
            filtered = filtered.filter(
                (item) =>
                    item.SourceIP?.includes(filters.ipAddress) || item.DestinationIP?.includes(filters.ipAddress)
            );
        }
        setFilteredData(filtered);
    };

    const handleDayChange = (day: string) => {
        setSelectedDay(day);
        const dayStart = new Date(`${day}T00:00:00`);
        const clampedStart = new Date(Math.max(dayStart.getTime(), MIN_TIME.getTime()));
        setStartTime(formatDateToISO(clampedStart));
        setEndTime(formatDateToISO(new Date(clampedStart.getTime() + intervalSize * 60 * 1000)));
    };

    const handleTimeIntervalChange = (direction: "forward" | "backward") => {
        const start = new Date(startTime);
        const intervalInMs = intervalSize * 60 * 1000;
        const dayStart = new Date(`${selectedDay}T00:00:00`);
        const newStart = new Date(
            direction === "forward"
                ? Math.min(start.getTime() + intervalInMs, MAX_TIME.getTime())
                : Math.max(start.getTime() - intervalInMs, MIN_TIME.getTime())
        );
        setStartTime(formatDateToISO(newStart));
        setEndTime(formatDateToISO(new Date(newStart.getTime() + intervalInMs)));
    };

    useEffect(() => {
        fetchData(startTime, endTime);
    }, [startTime, endTime]);

    return (
        <div style={{ width: "100%", height: "100vh", padding: "20px" }}>
            <h1>Dynamic Traffic Flow</h1>
            <Filters
                uniqueValues={uniqueValues}
                selectedFilters={selectedFilters}
                onFilterChange={(field, value) => setSelectedFilters((prev) => ({ ...prev, [field]: value }))}
                onApplyFilters={applyFilters}
            />
            <DaySelector selectedDay={selectedDay} days={[formatDate(MIN_TIME), formatDate(MAX_TIME)]} onDayChange={handleDayChange} />
            <TimeIntervalControls
                startTime={startTime}
          endTime={endTime}
          isAtStart={startTime === formatDateToISO(MIN_TIME)}
          isAtEnd={endTime === formatDateToISO(MAX_TIME)}
                onIntervalChange={handleTimeIntervalChange}
                onTimeChange={(newStartTime, newEndTime) => {
                  setStartTime(newStartTime);
                  setEndTime(newEndTime);
                }}
                onAcceptTime={(newStartTime, newEndTime) => {
                  setStartTime(newStartTime);
                  setEndTime(newEndTime);
                }
            }
        />
        <HistContainer />

        </div>
    );
};

const formatDateToISO = (date: Date): string =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}T${String(
        date.getHours()
    ).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}:${String(date.getSeconds()).padStart(2, "0")}`;

export default App;

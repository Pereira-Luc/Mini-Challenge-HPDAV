import { useEffect, useState } from "react";
import { getMergedDataByDateTimeRange } from "../util/fetchers";
import { MergedData } from "../util/interface";
import TrafficFlowVisualization from "./TrafficFlowVisualization";

const MIN_TIME = new Date("2012-04-05T17:51:26"); // Start of available data
const MAX_TIME = new Date("2012-04-07T09:00:04"); // End of available data

const TrafficFlow = () => {
    const [mergedData, setMergedData] = useState<MergedData[]>([]);
    const [startTime, setStartTime] = useState<string>("2012-04-06T17:40:00");
    const [endTime, setEndTime] = useState<string>("2012-04-06T17:45:00");
    const [intervalSize, setIntervalSize] = useState<number>(5); // Interval size in minutes

    const fetchData = async (start: string, end: string) => {
        try {
            const data: MergedData[] = await getMergedDataByDateTimeRange(start, end);
            setMergedData(data);
        } catch (error) {
            console.error("Error fetching merged data:", error);
        }
    };

    useEffect(() => {
        fetchData(startTime, endTime);
    }, [startTime, endTime]);

    const handleTimeIntervalChange = (direction: "forward" | "backward") => {
        const start = new Date(startTime);
        const intervalInMs = intervalSize * 60 * 1000; // Convert minutes to milliseconds

        let newStart: Date;
        if (direction === "forward") {
            newStart = new Date(Math.min(start.getTime() + intervalInMs, MAX_TIME.getTime()));
        } else {
            newStart = new Date(Math.max(start.getTime() - intervalInMs, MIN_TIME.getTime()));
        }

        // Clamp endTime based on newStart
        const newEnd = new Date(Math.min(newStart.getTime() + intervalInMs, MAX_TIME.getTime()));

        setStartTime(formatDateToISO(newStart));
        setEndTime(formatDateToISO(newEnd));
    };

    const isAtStart = new Date(startTime).getTime() <= MIN_TIME.getTime();
    const isAtEnd = new Date(endTime).getTime() >= MAX_TIME.getTime();

    return (
        <div style={{ width: "100%", height: "100vh", padding: "20px" }}>
            <h1>Dynamic Traffic Flow</h1>

            {/* Controls for Time Interval */}
            <div style={{ marginBottom: "20px" }}>
                <button onClick={() => handleTimeIntervalChange("backward")} disabled={isAtStart}>
                    ◀ Previous Interval
                </button>
                <span style={{ margin: "0 10px" }}>
                    {new Date(startTime).toLocaleTimeString()} - {new Date(endTime).toLocaleTimeString()}
                </span>
                <button onClick={() => handleTimeIntervalChange("forward")} disabled={isAtEnd}>
                    Next Interval ▶
                </button>
            </div>

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
            <TrafficFlowVisualization data={mergedData} filter={null} />
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

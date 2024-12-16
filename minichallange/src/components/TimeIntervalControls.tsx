import React, { useEffect, useState } from "react";

interface TimeIntervalControlsProps {
    startTime: string; // Expect in full ISO format
    endTime: string;   // Expect in full ISO format
    isAtStart: boolean;
    isAtEnd: boolean;
    onIntervalChange: (direction: "forward" | "backward") => void;
    onTimeChange?: (newStartTime: string, newEndTime: string) => void;
    changeItervalSize: (newSize: number) => void;
    onAcceptTime: (startTime: string, endTime: string) => void;
}

// Helper to extract HH:mm format from ISO date string
const extractTime = (isoString: string): string => {
    const date = new Date(isoString);
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
};

const TimeIntervalControls: React.FC<TimeIntervalControlsProps> = ({
    startTime,
    endTime,
    isAtStart,
    isAtEnd,
    onIntervalChange,
    changeItervalSize,
    onAcceptTime,
}) => {
    const [editedStartTime, setEditedStartTime] = useState(extractTime(startTime));
    const [editedEndTime, setEditedEndTime] = useState(extractTime(endTime));
    const [intervalSize, setIntervalSize] = useState<number>(5);

    // Update local state when props change
    useEffect(() => {
        setEditedStartTime(extractTime(startTime));
        setEditedEndTime(extractTime(endTime));
    }, [startTime, endTime]);

    const handleStartTimeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newStartTime = event.target.value;
        setEditedStartTime(newStartTime);
        //onTimeChange(newStartTime, editedEndTime);
    };

    const handleEndTimeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newEndTime = event.target.value;
        setEditedEndTime(newEndTime);
        //onTimeChange(editedStartTime, newEndTime);
    };

    return (
        <div style={{ marginBottom: "20px" }}>
            <button onClick={() => onIntervalChange("backward")} disabled={isAtStart}>
                ◀ Previous Interval
            </button>
            <span style={{ margin: "0 10px" }}>
                <input
                    type="time"
                    value={editedStartTime}
                    onChange={handleStartTimeChange}
                    style={{ marginRight: "5px" }}
                />
                -
                <input
                    type="time"
                    value={editedEndTime}
                    onChange={handleEndTimeChange}
                    style={{ marginLeft: "5px" }}
                />
            </span>
            <button onClick={() => onAcceptTime(editedStartTime, editedEndTime)} style={{ marginLeft: "10px" }}>
                Accept Time
            </button>
            <button onClick={() => onIntervalChange("forward")} disabled={isAtEnd}>
                Next Interval ▶
            </button>
            {/* Slider for Interval Size */}
            <div style={{ marginBottom: "20px" }}>
                <label htmlFor="intervalSize">Interval Size (minutes): </label>
                <input
                    type="range"
                    id="intervalSize"
                    min="1"
                    max="60"
                    value={intervalSize}
                    onChange={(e) => {
                        console.log("Interval Size Change:", e.target.value);
                        setIntervalSize(Number(e.target.value));
                        changeItervalSize(Number(e.target.value));
                    }}
                />
                <span>{intervalSize} minutes</span>
            </div>
        </div>
    );
};

export default TimeIntervalControls;

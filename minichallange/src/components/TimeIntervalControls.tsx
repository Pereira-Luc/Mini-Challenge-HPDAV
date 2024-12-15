import React from "react";

interface TimeIntervalControlsProps {
    startTime: string;
    endTime: string;
    isAtStart: boolean;
    isAtEnd: boolean;
    onIntervalChange: (direction: "forward" | "backward") => void;
}

const TimeIntervalControls: React.FC<TimeIntervalControlsProps> = ({
    startTime,
    endTime,
    isAtStart,
    isAtEnd,
    onIntervalChange,
}) => {
    return (
        <div style={{ marginBottom: "20px" }}>
            <button onClick={() => onIntervalChange("backward")} disabled={isAtStart}>
                ◀ Previous Interval
            </button>
            <span style={{ margin: "0 10px" }}>
                {new Date(startTime).toLocaleTimeString()} - {new Date(endTime).toLocaleTimeString()}
            </span>
            <button onClick={() => onIntervalChange("forward")} disabled={isAtEnd}>
                Next Interval ▶
            </button>
        </div>
    );
};

export default TimeIntervalControls;

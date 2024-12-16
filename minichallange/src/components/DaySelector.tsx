import React from "react";

interface DaySelectorProps {
    selectedDay: string;
    days: string[];
    onDayChange: (day: string) => void;
}

const DaySelector: React.FC<DaySelectorProps> = ({ selectedDay, days, onDayChange }) => {
    return (
        <div style={{ marginBottom: "20px" }}>
            <label htmlFor="day-select">Select Day: </label>
            <select id="day-select" value={selectedDay} onChange={(e) => onDayChange(e.target.value)}>
                {days.map((day) => (
                    <option key={day} value={day}>
                        {day}
                    </option>
                ))}
            </select>
        </div>
    );
};

export default DaySelector;

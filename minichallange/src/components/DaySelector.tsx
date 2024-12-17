import React from "react";

interface DaySelectorProps {
    selectedDay: string;
    minTime: Date;
    maxTime: Date;
    onDayChange: (day: string) => void;
}

const DaySelector: React.FC<DaySelectorProps> = ({ 
    selectedDay, 
    minTime, 
    maxTime, 
    onDayChange 
}) => {
    const generateDateRange = (start: Date, end: Date): string[] => {
        const dates: string[] = [];
        // Create new Date objects to avoid modifying originals
        const startDate = new Date(start.getFullYear(), start.getMonth(), start.getDate());
        const endDate = new Date(end.getFullYear(), end.getMonth(), end.getDate());
        
        // Add one day to endDate to include it in the range
        endDate.setDate(endDate.getDate() + 1);
        
        // Iterate through each day
        const currentDate = new Date(startDate);
        while (currentDate < endDate) {
            dates.push(formatDate(currentDate));
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        return dates;
    };

    const formatDate = (date: Date): string => {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    };

    const days = generateDateRange(minTime, maxTime);

    return (
        <div style={{ marginBottom: "20px" }}>
            <label htmlFor="day-select">Select Day: </label>
            <select 
                id="day-select" 
                value={selectedDay} 
                onChange={(e) => onDayChange(e.target.value)}
                style={{ padding: "5px", marginLeft: "10px" }}
            >
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
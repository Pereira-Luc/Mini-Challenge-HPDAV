import React, { useEffect, useState } from "react";

interface FiltersProps {
    uniqueValues: {
        protocol: string[];
        sourcePort: string[];
        destinationPort: string[];
        priority: string[];
        classification: string[];
    };
    onFilterChange: (field: string, value: string | { min: number; max: number }) => void;
    
    onApplyFilters: (filters: any) => void;
    selectedFilters: {
        protocol: string;
        sourcePort: string;
        destinationPort: string;
        priority: string;
        classification: string;
        ipAddress: string;
    };

    
}

const Filters: React.FC<FiltersProps> = ({
    uniqueValues,
    onFilterChange,
    onApplyFilters,
    selectedFilters,
}) => {
    return (
        <div style={{ marginBottom: "20px" }}>
            <h3>Filters</h3>

            {/* Existing Filters */}
            <label>Protocol: </label>
            <select
                value={selectedFilters.protocol}
                onChange={(e) => onFilterChange("protocol", e.target.value)}
            >
                <option value="">All</option>
                {uniqueValues.protocol.map((protocol) => (
                    <option key={protocol} value={protocol}>
                        {protocol}
                    </option>
                ))}
            </select>

            <label>Source Port: </label>
            <select
                value={selectedFilters.sourcePort}
                onChange={(e) => onFilterChange("sourcePort", e.target.value)}
            >
                <option value="">All</option>
                {uniqueValues.sourcePort.map((port) => (
                    <option key={port} value={port}>
                        {port}
                    </option>
                ))}
            </select>

            <label>Destination Port: </label>
            <select
                value={selectedFilters.destinationPort}
                onChange={(e) => onFilterChange("destinationPort", e.target.value)}
            >
                <option value="">All</option>
                {uniqueValues.destinationPort.map((port) => (
                    <option key={port} value={port}>
                        {port}
                    </option>
                ))}
            </select>

            <label>Priority: </label>
            <select
                value={selectedFilters.priority}
                onChange={(e) => onFilterChange("priority", e.target.value)}
            >
                <option value="">All</option>
                {uniqueValues.priority.map((priority) => (
                    <option key={priority} value={priority}>
                        {priority}
                    </option>
                ))}
            </select>

            <label>Classification: </label>
            <select
                value={selectedFilters.classification}
                onChange={(e) => onFilterChange("classification", e.target.value)}
            >
                <option value="">All</option>
                {uniqueValues.classification.map((classification) => (
                    <option key={classification} value={classification}>
                        {classification}
                    </option>
                ))}
            </select>

            <label>
                IP Address:
                <input
                    type="text"
                    placeholder="e.g., 192.168.1.1"
                    value={selectedFilters.ipAddress}
                    onChange={(e) => onFilterChange("ipAddress", e.target.value)}
                />
            </label>
            <button
                onClick={() => onApplyFilters(selectedFilters)}
                style={{ marginLeft: "10px", padding: "5px 10px" }}
            >
                Apply Filters
            </button>
        </div>
    );
};

export default Filters;

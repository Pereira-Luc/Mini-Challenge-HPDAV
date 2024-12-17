import React from "react";

interface FiltersProps {
    uniqueIDSValues: {
        sourcePort: string[];
        destinationPort: string[];
        priority: string[];
        classification: string[];
        label: string[];
    };
    uniqueFirewallValues: {
        sourcePort: string[];
        destinationPort: string[];
        protocol: string[];
    };
    onFilterChange: (filterType: "ids" | "fw", field: string, value: string) => void;
    onApplyFilters: (filters: any) => void;
    selectedIDSFilters: {
        sourcePort: string;
        destinationPort: string;
        priority: string;
        classification: string;
        ipAddress: string;
    };
    selectedFirewallFilters: {
        sourcePort: string;
        destinationPort: string;
        protocol: string;
        ipAddress: string;
    };
}

const Filters: React.FC<FiltersProps> = ({
    uniqueIDSValues,
    uniqueFirewallValues,
    onFilterChange,
    onApplyFilters,
    selectedIDSFilters,
    selectedFirewallFilters,
}) => {
    return (
        <div style={{ marginBottom: "20px" }}>
            <h3>Filters</h3>

            {/* IDS Filters Section */}
            <div style={{ marginBottom: "20px" }}>
                <h4>IDS Filters</h4>
                <label>Source Port: </label>
                <select
                    value={selectedIDSFilters.sourcePort}
                    onChange={(e) => onFilterChange("ids", "sourcePort", e.target.value)}
                >
                    <option value="">All</option>
                    {uniqueIDSValues.sourcePort.map((port) => (
                        <option key={port} value={port}>
                            {port}
                        </option>
                    ))}
                </select>

                <label>Destination Port: </label>
                <select
                    value={selectedIDSFilters.destinationPort}
                    onChange={(e) => onFilterChange("ids", "destinationPort", e.target.value)}
                >
                    <option value="">All</option>
                    {uniqueIDSValues.destinationPort.map((port) => (
                        <option key={port} value={port}>
                            {port}
                        </option>
                    ))}
                </select>

                <label>Priority: </label>
                <select
                    value={selectedIDSFilters.priority}
                    onChange={(e) => onFilterChange("ids", "priority", e.target.value)}
                >
                    <option value="">All</option>
                    {uniqueIDSValues.priority.map((priority) => (
                        <option key={priority} value={priority}>
                            {priority}
                        </option>
                    ))}
                </select>

                <label>Classification: </label>
                <select
                    value={selectedIDSFilters.classification}
                    onChange={(e) => onFilterChange("ids", "classification", e.target.value)}
                >
                    <option value="">All</option>
                    {uniqueIDSValues.classification.map((classification) => (
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
                        value={selectedIDSFilters.ipAddress}
                        onChange={(e) => onFilterChange("ids", "ipAddress", e.target.value)}
                    />
                </label>

                <button
                    onClick={() => onApplyFilters(selectedIDSFilters)}
                    style={{ marginLeft: "10px", padding: "5px 10px" }}
                >
                    Apply IDS Filters
                </button>
            </div>

            {/* Firewall Filters Section */}
            <div>
                <h4>Firewall Filters</h4>
                <label>Source Port: </label>
                <select
                    value={selectedFirewallFilters.sourcePort}
                    onChange={(e) => onFilterChange("fw", "sourcePort", e.target.value)}
                >
                    <option value="">All</option>
                    {uniqueFirewallValues.sourcePort.map((port) => (
                        <option key={port} value={port}>
                            {port}
                        </option>
                    ))}
                </select>

                <label>Destination Port: </label>
                <select
                    value={selectedFirewallFilters.destinationPort}
                    onChange={(e) => onFilterChange("fw", "destinationPort", e.target.value)}
                >
                    <option value="">All</option>
                    {uniqueFirewallValues.destinationPort.map((port) => (
                        <option key={port} value={port}>
                            {port}
                        </option>
                    ))}
                </select>

                <label>Protocol: </label>
                <select
                    value={selectedFirewallFilters.protocol}
                    onChange={(e) => onFilterChange("fw", "protocol", e.target.value)}
                >
                    <option value="">All</option>
                    {uniqueFirewallValues.protocol.map((protocol) => (
                        <option key={protocol} value={protocol}>
                            {protocol}
                        </option>
                    ))}
                </select>

                <label>
                    IP Address:
                    <input
                        type="text"
                        placeholder="e.g., 192.168.1.1"
                        value={selectedFirewallFilters.ipAddress}
                        onChange={(e) => onFilterChange("fw", "ipAddress", e.target.value)}
                    />
                </label>

                <button
                    onClick={() => onApplyFilters(selectedFirewallFilters)}
                    style={{ marginLeft: "10px", padding: "5px 10px" }}
                >
                    Apply Firewall Filters
                </button>
            </div>
        </div>
    );
};

export default Filters;

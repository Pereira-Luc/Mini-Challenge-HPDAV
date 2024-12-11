export interface FirewallData {
    DateTime: Date;                 // Format: "06/Apr/2012 17:40:02"
    SyslogPriority: string;           // Example: "Info", "Error"
    Operation: string;                // Example: "Built", "Teardown", etc.
    MessageCode: string;              // Example: "ASA-6-302015" or others
    Protocol: string;                 // Example: "TCP", "UDP", etc.
    SourceIP: string;                 // IPv4 address, e.g., "192.168.1.1"
    DestinationIP: string;            // IPv4 address, e.g., "10.0.0.1"
    SourceHostname: string;           // Hostname or empty string
    DestinationHostname: string;      // Hostname or empty string
    SourcePort: string;               // Numeric port as string, e.g., "443"
    DestinationPort: string;          // Numeric port as string, e.g., "8080"
    DestinationService: string;       // Example: "http", "dns", etc.
    Direction: string;                // Example: "Inbound", "Outbound", etc.
    ConnectionsBuilt: string;         // "0" or "1"
    ConnectionsTornDown: string;      // "0" or "1"
}
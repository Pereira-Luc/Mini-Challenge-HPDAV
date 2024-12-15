export interface FirewallData {
    DateTime: Date;                 // Format: "06/Apr/2012 17:40:02"
    SyslogPriority: string;         // Example: "Info", "Error"
    Operation: string;              // Example: "Built", "Teardown", etc.
    MessageCode: string;            // Example: "ASA-6-302015" or others
    Protocol: string;               // Example: "TCP", "UDP", etc.
    SourceIP: string;               // IPv4 address, e.g., "192.168.1.1"
    DestinationIP: string;          // IPv4 address, e.g., "10.0.0.1"
    SourceHostname: string;         // Hostname or empty string
    DestinationHostname: string;    // Hostname or empty string
    SourcePort: string;             // Numeric port as string, e.g., "443"
    DestinationPort: string;        // Numeric port as string, e.g., "8080"
    DestinationService: string;     // Example: "http", "dns", etc.
    Direction: string;              // Example: "Inbound", "Outbound", etc.
    ConnectionsBuilt: string;       // "0" or "1"
    ConnectionsTornDown: string;    // "0" or "1"
}

export interface IDSData {
    destIP: string;
    DateTime: string;                   // Format: "2024-12-01T12:00:00"
    SourceIP: string;               // Source IPv4 address
    SourcePort: number;             // Source port, e.g., 443
    DestinationIP: string;                 // Destination IPv4 address
    DestinationPort: number;               // Destination port, e.g., 80
    Classification: string;         // Example: "Malware Traffic", "DoS Attempt"
    Priority: number;               // Priority level: 1 (high), 2 (medium), etc.
    Label: string;                  // IDS rule label, e.g., "[1:2100538:17]"
    PacketInfo: string;             // Packet details, e.g., "TCP TTL:128 TOS:0x0"
    PacketInfoContd: string;        // Additional packet details
    XRef: string;            // Cross-reference URL or null if not present
}

export interface MergedData {
    DateTime: Date;                 // From FirewallData
    SourceIP: string;               // Shared between IDS and firewall
    DestinationIP: string;          // Shared between IDS and firewall
    DestinationService: string;     // Example: "http", "dns", etc.
    Direction: string;              // Example: "Inbound", "Outbound", etc.
    ConnectionsBuilt: string;       // "0" or "1"
    ConnectionsTornDown: string;    // "0" or "1"
    Protocol: string;               // From FirewallData
    SyslogPriority: string;  // From FirewallData
    Operation: string;              // From FirewallData
    MessageCode: string ;     // From FirewallData
    Classification: string;  // From IDSLog
    Priority: number ;        // From IDSLog
    Label: string ;           // From IDSLog
    PacketInfo: string ;      // From IDSLog
    PacketInfoContd: string ; // From IDSLog
    XRef: string ;            // From IDSLog
    SourceHostname: string;         // Hostname or empty string
    DestinationHostname: string;    // Hostname or empty string
    SourcePort: string | number;    // From FirewallData (string) or IDSLog (number)
    DestinationPort: string | number; // From FirewallData (string) or IDSLog (number)
}

import React, { useEffect, useRef, useState } from "react";
import { FirewallData, ParallelCoordinatesPlotProps } from "../util/interface";
import * as d3 from "d3";

// Keep IP utilities
const ipToInt = (ip: string): number => {
    return ip.split('.')
        .reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0);
};

const intToIp = (int: number): string => {
    return [
        (int >>> 24) & 255,
        (int >>> 16) & 255,
        (int >>> 8) & 255,
        int & 255
    ].join('.');
};

const getSubnet = (ip: string, mask: number = 24): string => {
    const ipInt = ipToInt(ip);
    const maskBits = ~((1 << (32 - mask)) - 1);
    return intToIp(ipInt & maskBits);
};

// Keep AggregatedData type
type AggregatedData = {
    subnet: string;
    count: number;
    SourceIP: string;
    DestinationIP: string[];
    DestinationPort: number[];
    Direction: string[];
    DateTime: {
        min: Date;
        max: Date;
    };
    originalIPs: string[];
};

// Keep merging logic
const mergeData = (items: FirewallData[]): AggregatedData => {
    return {
        subnet: getSubnet(items[0].SourceIP),
        count: items.length,
        SourceIP: getSubnet(items[0].SourceIP),
        DestinationIP: [...new Set(items.map(item => item.DestinationIP))],
        DestinationPort: [...new Set(items.map(item => item.DestinationPort))],
        Direction: [...new Set(items.map(item => item.Direction))],
        DateTime: {
            min: new Date(Math.min(...items.map(item => new Date(item.DateTime).getTime()))),
            max: new Date(Math.max(...items.map(item => new Date(item.DateTime).getTime())))
        },
        originalIPs: items.map(item => item.SourceIP)
    };
};

const ParallelCoordinatesPlot: React.FC<ParallelCoordinatesPlotProps> = ({
    width,
    height,
    timeWindow,
    mgData
}) => {
    const dimensions = ["DateTime", "SourceIP", "DestinationPort", "DestinationIP", "Direction"];
    const svgRef = useRef<SVGSVGElement | null>(null);
    const [selectedRanges, setSelectedRanges] = useState<{[key: string]: [number, number] | null}>({});


    useEffect(() => {
        if (!mgData) return;

        // Group by subnet and merge
        const subnetGroups = mgData.reduce((acc, data) => {
            const subnet = getSubnet(data.SourceIP);
            if (!acc[subnet]) {
                acc[subnet] = [];
            }
            acc[subnet].push(data);
            return acc;
        }, {} as { [key: string]: FirewallData[] });
    
        const mergedData = Object.values(subnetGroups).map(items => mergeData(items));
        generateParallelCoordinatesPlot(mergedData, dimensions, width, height);

    }, [mgData, width, height]);

    const generateParallelCoordinatesPlot = (
        data: AggregatedData[],
        dimensions: string[],
        width: number,
        height: number
    ) => {
        if (data.length === 0) return;

        const svg = d3.select(svgRef.current)
            .attr("width", width)
            .attr("height", height);
        svg.selectAll("*").remove();

        const xScale = d3.scalePoint()
            .domain(dimensions)
            .range([50, width - 50]);

        const yScales: { [key: string]: d3.ScaleTime<number, number> | d3.ScalePoint<string> } = {};

        // Create scales for each dimension
        dimensions.forEach(dim => {
            if (dim === "DateTime") {
                const allDates = data.flatMap(d => [d.DateTime.min, d.DateTime.max]);
                yScales[dim] = d3.scaleTime()
                    .domain(d3.extent(allDates) as [Date, Date])
                    .range([height - 50, 50]);
            } else {
                const values = data.flatMap(d => {
                    const val = d[dim as keyof AggregatedData];
                    return Array.isArray(val) ? val : [val];
                });
                yScales[dim] = d3.scalePoint()
                    .domain(Array.from(new Set(values)))
                    .range([height - 50, 50]);
            }
        });

        const g = svg.append("g");

        // Draw lines for each subnet
        const line = d3.line();
        data.forEach(d => {
            // For each combination of values between dimensions
            dimensions.forEach((dim, i) => {
                if (i < dimensions.length - 1) {
                    const currentValues = dim === "DateTime" ? [d.DateTime.min, d.DateTime.max] :
                        Array.isArray(d[dim as keyof AggregatedData]) ? 
                            d[dim as keyof AggregatedData] : [d[dim as keyof AggregatedData]];
                    
                    const nextDim = dimensions[i + 1];
                    const nextValues = nextDim === "DateTime" ? [d.DateTime.min, d.DateTime.max] :
                        Array.isArray(d[nextDim as keyof AggregatedData]) ?
                            d[nextDim as keyof AggregatedData] : [d[nextDim as keyof AggregatedData]];

                    currentValues.forEach(v1 => {
                        nextValues.forEach(v2 => {
                            g.append("path")
                                .datum([
                                    [xScale(dim)!, yScales[dim](dim === "DateTime" ? new Date(v1) : v1)!],
                                    [xScale(nextDim)!, yScales[nextDim](nextDim === "DateTime" ? new Date(v2) : v2)!]
                                ])
                                .attr("d", line)
                                .style("fill", "none")
                                .style("stroke", "steelblue")
                                .style("stroke-width", Math.log(d.count))
                                .style("opacity", 0.3);
                        });
                    });
                }
            });
        });

        // Draw axes
        dimensions.forEach(dim => {
            const axis = d3.axisLeft(yScales[dim]);
            g.append("g")
                .attr("transform", `translate(${xScale(dim)},0)`)
                .call(axis)
                .append("text")
                .attr("y", -10)
                .attr("text-anchor", "middle")
                .text(dim);
        });

        dimensions.forEach(dim => {
            const brush = d3.brushY()
                .extent([[xScale(dim)! - 10, 0], [xScale(dim)! + 10, height]])
                .on("brush end", (event) => {
                    const selection = event.selection as [number, number] | null;
                    
                    // Update selected ranges
                    setSelectedRanges(prev => ({
                        ...prev,
                        [dim]: selection
                    }));
        
                    // Update line colors
                    g.selectAll("path")
                        .style("stroke", (d: any) => {
                            // Check if line passes through any selected range
                            const isSelected = Object.entries(selectedRanges).every(([dimension, range]) => {
                                if (!range) return true; // No selection for this dimension
        
                                const values = dimension === "DateTime" ? 
                                    [d[0][1], d[1][1]] : // Use actual y coordinates
                                    [d[0][1], d[1][1]];
        
                                return values.some(v => v >= range[0] && v <= range[1]);
                            });
        
                            return isSelected ? "white" : "steelblue";
                        })
                        .style("stroke-opacity", (d: any) => {
                            const isSelected = Object.values(selectedRanges).some(range => range !== null);
                            if (!isSelected) return 0.3; // Default opacity
                            
                            // Check if line passes through all selected ranges
                            const passesThrough = Object.entries(selectedRanges).every(([dimension, range]) => {
                                if (!range) return true;
        
                                const values = dimension === "DateTime" ? 
                                    [d[0][1], d[1][1]] :
                                    [d[0][1], d[1][1]];
        
                                return values.some(v => v >= range[0] && v <= range[1]);
                            });
        
                            return passesThrough ? 0.8 : 0.1;
                        });
                });
        
            g.append("g")
                .attr("class", "brush")
                .call(brush);
        });
        
        // Add background for contrast
        svg.append("rect")
            .attr("width", width)
            .attr("height", height)
            .attr("fill", "#333")
            .attr("opacity", 0.1);
        
        // Add style for brushed areas
        g.selectAll(".brush rect.selection")
            .style("fill", "rgba(255, 255, 255, 0.1)")
            .style("stroke", "white");
    };

    return (
        <div>
            <h1>Parallel Coordinates Plot</h1>
            <svg ref={svgRef}></svg>
        </div>
    );
};

export default ParallelCoordinatesPlot;
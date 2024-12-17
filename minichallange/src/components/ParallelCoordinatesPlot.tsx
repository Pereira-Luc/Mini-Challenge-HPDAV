import React, { useEffect, useRef, useState } from "react";
import { FirewallData, IDSData, ParallelCoordinatesPlotProps } from "../util/interface";
import * as d3 from "d3";

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

const getRegularDimensionValues = (data: FirewallData | IDSData, dim: string): any => {
    if (dim === "DateTime") {
        return new Date(data.DateTime);
    }
    return data[dim as keyof (FirewallData | IDSData)];
};

const getDimensionValues = (data: AggregatedData | FirewallData | IDSData, dim: string): any[] => {
    if ('subnet' in data) { // Check if it's AggregatedData
        if (dim === "DateTime") {
            return [data.DateTime.min, data.DateTime.max];
        }
        const value = data[dim as keyof AggregatedData];
        return Array.isArray(value) ? value : [value];
    } else {
        const value = getRegularDimensionValues(data, dim);
        return [value];
    }
};

type AggregatedData = {
    subnet: string;
    count: number;
    SourceIP: string;
    DestinationIP: string[];
    DestinationPort: string[];
    Direction: string[];
    DateTime: {
        min: Date;
        max: Date;
    };
    originalIPs: string[];
};

const mergeData = (items: FirewallData[] | IDSData[]): AggregatedData => {
    return {
        subnet: getSubnet(items[0].SourceIP),
        count: items.length,
        SourceIP: getSubnet(items[0].SourceIP),
        DestinationIP: [...new Set(items.map(item => item.DestinationIP))],
        DestinationPort: [...new Set(items.map(item => item.DestinationPort))],
        Direction: items.length > 0 && 'Direction' in items[0] 
            ? [...new Set(items.map(item => item.Direction))]
            : ['N/A'],
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
    mgData,
    enableMasking = true
}) => {
    const svgRef = useRef<SVGSVGElement | null>(null);

    useEffect(() => {
        if (!mgData || mgData.length === 0) return;

        const dimensions = ["DateTime", "SourceIP", "DestinationPort", "DestinationIP"]
            .concat(mgData.length > 0 && 'Direction' in mgData[0] ? ["Direction"] : []);
        
        if (!enableMasking) {
            generateParallelCoordinatesPlot(mgData, dimensions, width, height);
            return;
        }

        const subnetGroups = mgData.reduce((acc, data) => {
            const subnet = getSubnet(data.SourceIP);
            if (!acc[subnet]) { acc[subnet] = []; }
            acc[subnet].push(data);
            return acc;
        }, {} as { [key: string]: (FirewallData | IDSData)[] });
    
        const mergedData = Object.values(subnetGroups).map(items => mergeData(items));
        generateParallelCoordinatesPlot(mergedData, dimensions, width, height);

    }, [mgData, width, height, enableMasking]);

    const generateParallelCoordinatesPlot = (
        data: (AggregatedData | FirewallData | IDSData)[],
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

        dimensions.forEach(dim => {
            if (dim === "DateTime") {
                const allDates = enableMasking
                    ? data.flatMap(d => [
                        (d as AggregatedData).DateTime.min,
                        (d as AggregatedData).DateTime.max
                    ])
                    : data.map(d => new Date((d as FirewallData | IDSData).DateTime));
                yScales[dim] = d3.scaleTime()
                    .domain(d3.extent(allDates) as [Date, Date])
                    .range([height - 50, 50]);
            } else {
                const values = data.flatMap(d => {
                    const val = getDimensionValues(d, dim);
                    return Array.isArray(val) ? val : [val];
                });
                yScales[dim] = d3.scalePoint()
                    .domain(Array.from(new Set(values)))
                    .range([height - 50, 50]);
            }
        });

        const g = svg.append("g");
        const line = d3.line();

        data.forEach(d => {
            dimensions.forEach((dim, i) => {
                if (i < dimensions.length - 1) {
                    const currentValues = getDimensionValues(d, dim);
                    const nextDim = dimensions[i + 1];
                    const nextValues = getDimensionValues(d, nextDim);

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
                                .style("stroke-width", enableMasking ? Math.log('count' in d ? d.count : 1) : 1)
                                .style("opacity", 0.3);
                        });
                    });
                }
            });
        });

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

        if (enableMasking) {
            dimensions.forEach(dim => {
                const brush = d3.brushY()
                    .extent([[xScale(dim)! - 10, 0], [xScale(dim)! + 10, height]])
                    .on("brush end", (event: d3.D3BrushEvent<any>) => {
                        if (!event.selection) {
                            svg.selectAll("path").style("opacity", 0.3);
                            return;
                        }
                        
                        const selection = event.selection as [number, number];
                        
                        svg.selectAll("path")
                            .style("opacity", 0.1)
                            .filter((d: any) => {
                                const values = getDimensionValues(d, dim);
                                return values.some((val: any) => {
                                    const yVal = yScales[dim](dim === "DateTime" ? new Date(val) : val);
                                    return yVal !== undefined && yVal >= selection[0] && yVal <= selection[1];
                                });
                            })
                            .style("opacity", 0.7);
                    });
            
                g.append("g")
                    .attr("class", `brush ${dim}`)
                    .call(brush);
            });
        }
    };

    return (
        <div>
            <h1>Parallel Coordinates Plot</h1>
            <svg ref={svgRef}></svg>
        </div>
    );
};

export default ParallelCoordinatesPlot;
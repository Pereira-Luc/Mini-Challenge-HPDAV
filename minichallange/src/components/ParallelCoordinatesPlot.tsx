import React, { useEffect, useRef, useState } from "react";
import { FirewallData, IDSData, ParallelCoordinatesPlotProps } from "../util/interface";
import * as d3 from "d3";
import { IPCategory, IPCategoriesResponse } from "../util/interface";
import { fetchIPCategories } from "../util/fetchers";
import LoadingOverlay from './LoadingOverlay'; 


// Utility functions
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

// Data handling functions
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

const getRegularDimensionValues = (data: FirewallData | IDSData, dim: string): any => {
    if (dim === "DateTime") {
        return new Date(data.DateTime);
    }
    return data[dim as keyof (FirewallData | IDSData)];
};

const getDimensionValues = (data: AggregatedData | FirewallData | IDSData, dim: string): any[] => {
    if ('subnet' in data) {
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
    const [ipCategories, setIpCategories] = useState<IPCategoriesResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [loadingProgress, setLoadingProgress] = useState(0);

    const updateLoadingState = (progress: number, loading: boolean) => {
        setLoadingProgress(progress);
        setIsLoading(loading);
    };

    // Fetch IP categories
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const categories = await fetchIPCategories();
                setIpCategories(categories);
            } catch (error) {
                console.error("Error fetching IP categories:", error);
            }
        };
        fetchCategories();
    }, []);

    // Get category for an IP
    const getIPCategory = (ip: string): IPCategory | 'Unknown' => {
        if (!ipCategories) return 'Unknown';
        for (const [category, ips] of Object.entries(ipCategories)) {
            if (ips?.includes(ip)) {
                return category as IPCategory;
            }
        }
        return 'Unknown';
    };

    // Format value with category info
    const formatValue = (dim: string, value: any): string => {
        if ((dim === 'SourceIP' || dim === 'DestinationIP') && typeof value === 'string') {
            const category = getIPCategory(value);
            return `${value} (${category})`;
        }
        return String(value);
    };

    // Main plot generation effect
    useEffect(() => {
        if (!mgData || mgData.length === 0) return;
        //clear previous plot
        d3.select(svgRef.current).selectAll("*").remove();
        setIsLoading(true);
        updateLoadingState(10, true);

        const dimensions = ["DateTime", "SourceIP", "DestinationPort", "DestinationIP"]
            .concat(mgData.length > 0 && 'Direction' in mgData[0] ? ["Direction"] : []);
        
        if (!enableMasking) {
            generateParallelCoordinatesPlot(mgData, dimensions, width, height);
            updateLoadingState(100, false);
            return;
        }
        updateLoadingState(20, true);
        const subnetGroups = mgData.reduce((acc, data) => {
            const subnet = getSubnet(data.SourceIP);
            if (!acc[subnet]) { acc[subnet] = []; }
            acc[subnet].push(data);
            return acc;
        }, {} as { [key: string]: (FirewallData | IDSData)[] });
        updateLoadingState(30, true);
    
        const mergedData = Object.values(subnetGroups).map(items => mergeData(items));
        updateLoadingState(40, true);
        generateParallelCoordinatesPlot(mergedData, dimensions, width, height).then(() => {
            console.log("Done generating plot!");
            setIsLoading(false);
        });
    }, [mgData, width, height, enableMasking, ipCategories]);

    const generateParallelCoordinatesPlot = async (
        data: (AggregatedData | FirewallData | IDSData)[],
        dimensions: string[],
        width: number,
        height: number
    ) => {
        if (data.length === 0) return;


        return new Promise<void>((resolve) => {
            setIsLoading(true);
            const margin = { top: 50, right: 50, bottom: 50, left: 50 };
            const innerWidth = width - margin.left - margin.right;
            const innerHeight = height - margin.top - margin.bottom;

            const svg = d3.select(svgRef.current)
                .attr("width", width)
                .attr("height", height);
            svg.selectAll("*").remove();

            const g = svg.append("g")
                .attr("transform", `translate(${margin.left},${margin.top})`);

            // Create color scale for categories
            const categoryColorScale = d3.scaleOrdinal<string>()
                .domain([...Object.values(IPCategory), 'Unknown'])
                .range(d3.schemeCategory10);

            // Create scales
            const xScale = d3.scalePoint()
                .domain(dimensions)
                .range([0, innerWidth]);

            const yScales: { [key: string]: d3.ScaleTime<number, number> | d3.ScalePoint<string> } = {};
            setLoadingProgress(50);

            dimensions.forEach(dim => {
                if (dim === "DateTime") {
                    const allDates = enableMasking
                        ? data.flatMap(d => [(d as AggregatedData).DateTime.min, (d as AggregatedData).DateTime.max])
                        : data.map(d => new Date((d as FirewallData | IDSData).DateTime));
                    yScales[dim] = d3.scaleTime()
                        .domain(d3.extent(allDates) as [Date, Date])
                        .range([innerHeight, 0]);
                } else {
                    const values = data.flatMap(d => {
                        const val = getDimensionValues(d, dim);
                        return Array.isArray(val) ? val : [val];
                    });
                    yScales[dim] = d3.scalePoint()
                        .domain(Array.from(new Set(values)))
                        .range([innerHeight, 0]);
                }
            });
            setLoadingProgress(60);

            // Draw lines
            const line = d3.line();
            data.forEach(d => {
                dimensions.forEach((dim, i) => {
                    if (i < dimensions.length - 1) {
                        const currentValues = getDimensionValues(d, dim);
                        const nextDim = dimensions[i + 1];
                        const nextValues = getDimensionValues(d, nextDim);

                        currentValues.forEach(v1 => {
                            nextValues.forEach(v2 => {
                                const color = (dim === 'SourceIP' || nextDim === 'SourceIP') 
                                    ? categoryColorScale(getIPCategory(v1 as string))
                                    : 'steelblue';

                                g.append("path")
                                    .datum([
                                        [xScale(dim)!, yScales[dim](dim === "DateTime" ? new Date(v1) : v1)!],
                                        [xScale(nextDim)!, yScales[nextDim](nextDim === "DateTime" ? new Date(v2) : v2)!]
                                    ])
                                    .attr("d", line)
                                    .style("fill", "none")
                                    .style("stroke", color)
                                    .style("stroke-width", enableMasking ? Math.log('count' in d ? d.count : 1) : 1)
                                    .style("opacity", 0.3)
                                    .append("title")
                                    .text(formatValue(dim, v1) + " → " + formatValue(nextDim, v2));
                            });
                        });
                    }
                });
            });
            setLoadingProgress(80);

            // Draw axes
            dimensions.forEach(dim => {
                const axis = d3.axisLeft(yScales[dim]);
                if (dim === 'SourceIP' || dim === 'DestinationIP') {
                    axis.tickFormat(d => formatValue(dim, d));
                }
            
                const axisG = g.append("g")
                    .attr("transform", `translate(${xScale(dim)},0)`)
                    .call(axis);
            
                // Keep labels horizontal but adjust positioning for readability
                axisG.selectAll("text")
                    .style("text-anchor", "end")
                    .attr("dx", "-0.5em")  // Reduced offset
                    .attr("dy", "0.3em");  // Slight vertical adjustment
            
                // Add dimension title
                axisG.append("text")
                    .attr("y", -16)
                    .attr("text-anchor", "middle")
                    .style("fill", "black")
                    .text(dim);
            });
            setLoadingProgress(90);

            // Add brushing if masking is enabled
            if (enableMasking) {
                dimensions.forEach(dim => {
                    const brush = d3.brushY()
                        .extent([[xScale(dim)! - 10, 0], [xScale(dim)! + 10, innerHeight]])
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

            // Add legend
            const legend = svg.append("g")
                .attr("font-family", "sans-serif")
                .attr("font-size", 10)
                .attr("text-anchor", "start")
                .selectAll("g")
                .data([...Object.values(IPCategory), 'Unknown'])
                .enter().append("g")
                .attr("transform", (d, i) => `translate(${width - 100},${i * 20 + 20})`);

            legend.append("rect")
                .attr("x", 0)
                .attr("width", 19)
                .attr("height", 19)
                .attr("fill", categoryColorScale);

            legend.append("text")
                .attr("x", 24)
                .attr("y", 9.5)
                .attr("dy", "0.32em")
                .text(d => d);
            setLoadingProgress(100);
            console.log("Parallel Coordinates Plot generated successfully!");
            resolve();
        });
    };

    return (
        <div style={{ position: 'relative', width, height }}>
            {isLoading && (
                <LoadingOverlay 
                    progress={loadingProgress} 
                    message="Generating Parallel Coordinates Plot..." 
                />
            )}
            <svg ref={svgRef}></svg>
        </div>
    );
};

export default ParallelCoordinatesPlot;
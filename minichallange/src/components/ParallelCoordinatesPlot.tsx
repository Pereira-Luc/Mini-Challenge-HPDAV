import React, {useEffect, useRef, useState} from "react";
import {getFirewallDataByDateTimeRange} from "../util/fetchers";
import {FirewallData, ParallelCoordinatesPlotProps} from "../util/interface";
import * as d3 from "d3";

const ParallelCoordinatesPlot: React.FC<ParallelCoordinatesPlotProps> = ({width, height, startDate, endDate, timeWindow}) => {
    const [firewallData, setFirewallData] = useState<FirewallData[]>([]);
    const dimensions: Array<keyof FirewallData> = ["DateTime", "SourceIP","DestinationPort","DestinationIP", "Direction"];
    const svgRef = useRef<SVGSVGElement | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                console.log("Fetching firewall data...");

                
                // Format dates for Python compatibility (YYYY-MM-DD HH:MM:SS)
                const formatDateForPython = (date: Date): string => {
                    return date.toISOString()
                        .replace('T', ' ')     // Replace T with space
                        .replace(/\.\d+Z$/, '') // Remove milliseconds and Z
                };

                const start = timeWindow?.start ? formatDateForPython(timeWindow.start) : "";
                const end = timeWindow?.end ? formatDateForPython(timeWindow.end) : "";

                console.log("Start Date:", start);
                console.log("End Date:", end);

                const data: FirewallData[] = await getFirewallDataByDateTimeRange(
                    start || "",
                    end || ""
                );
                console.log("Fetched data:", data.length);
                setFirewallData(data);

            } catch (error) {
                console.error("Error fetching firewall data:", error);
            }
        };
        fetchData();
    }, [timeWindow]);

    useEffect(() => {
        if (firewallData.length > 0) {
            // Convert keyof FirewallData to string for dimensions
            const dimensionStrings = dimensions.map(dim => dim as string);
            generateParallelCoordinatesPlot(
                firewallData,
                dimensionStrings,
                width,
                height,
                svgRef
            );
        }
    }, [firewallData]);

    const generateParallelCoordinatesPlot = (
        data: FirewallData[],
        dimensions: string[],
        width: number,
        height: number,
        svgRef: React.RefObject<SVGSVGElement>
    ) => {
        console.log("Generating Parallel Coordinates Plot...");
        console.log("Data length:", data.length);
        console.log("Dimensions:", dimensions);

        // Clear previous plot
        if (data.length === 0 || dimensions.length === 0) return;

        // Select the SVG element and clear its content
        const svg = d3.select(svgRef.current)
            .attr("width", width)
            .attr("height", height);
        svg.selectAll("*").remove();

        // 1. Create Scales
        const xScale = d3.scalePoint()
            .domain(dimensions)
            .range([50, width - 50]);

        const yScales: { [key: string]: d3.ScaleTime<number, number> | d3.ScalePoint<string> } = {};

        dimensions.forEach(dim => {
            // Get values for each dimension
            const values = data.map(d => {
                if (dim === "DateTime") {
                    return new Date(d[dim as keyof FirewallData] as string);
                } else {
                    return d[dim as keyof FirewallData] as string;
                }
            });

            if (dim === "DateTime") {
                const minDate: Date | undefined = d3.min(values as Date[]);
                const maxDate: Date | undefined = d3.max(values as Date[]);

                if (!minDate || !maxDate) return;

                yScales[dim] = d3.scaleTime()
                    .domain([minDate as Date, maxDate as Date])
                    .range([height - 50, 50]);
            } else {
                const uniqueValues = Array.from(new Set(values as string[]));
                yScales[dim] = d3.scalePoint()
                    .domain(uniqueValues)
                    .range([height - 50, 50])
                    .padding(0.5);
            }
        });

        // 2. Create SVG group
        const g = svg.append("g");

        // 3. Draw Lines
        const drawLines = (filteredData: FirewallData[] = data) => {
            g.selectAll(".line").remove();

            g.selectAll(".line")
                .data(filteredData)
                .enter()
                .append("path")
                .attr("class", "line")
                .attr("d", d => {
                    return d3.line()
                        .x(dim => xScale(dim) || 0)
                        .y(dim => {
                            const value = d[dim as keyof FirewallData];
                            const scale = yScales[dim];

                            if (dim === "DateTime") {
                                return (scale as d3.ScaleTime<number, number>)(new Date(value as string));
                            }
                            return (scale as d3.ScalePoint<string>)(value as string) || 0;
                        })(dimensions) as string;
                })
                .style("fill", "none")
                .style("stroke", "steelblue")
                .style("stroke-width", 1.5)
                .style("opacity", 0.5);
        };

        drawLines();

        // 4. Draw axes and add brushes
        dimensions.forEach(dim => {
            const scale = yScales[dim];
            const axis = dim === "DateTime"
                ? d3.axisLeft(scale as d3.ScaleTime<number, number>).tickFormat(d3.timeFormat("%Y-%m-%d %H:%M:%S"))
                : d3.axisLeft(scale as d3.ScalePoint<string>);

            const axisGroup = g.append("g")
                .attr("transform", `translate(${xScale(dim)},0)`)
                .call(axis);

            // Add axis labels
            axisGroup.append("text")
                .attr("x", 0)
                .attr("y", height - 10)
                .attr("text-anchor", "middle")
                .text(dim);

            // Add brush
            const brush = d3.brushY()
                .extent([[0, 0], [10, height]])
                .on("brush end", (event) => {
                    const selection = event.selection;
                    if (selection) {
                        if (dim === "DateTime") {
                            // Continuous scale (time)
                            const [y0, y1] = selection;
                            const minVal = (scale as d3.ScaleTime<number, number>).invert(y0);
                            const maxVal = (scale as d3.ScaleTime<number, number>).invert(y1);

                            const filteredData = data.filter(d => {
                                const dateValue = new Date(d[dim as keyof FirewallData] as string);
                                return dateValue >= minVal && dateValue <= maxVal;
                            });
                            drawLines(filteredData);
                        } else {
                            // Categorical scale (point)
                            const [y0, y1] = selection;
                            const pointScale = scale as d3.ScalePoint<string>;
                            const domainValues = pointScale.domain();

                            const filteredDomain = domainValues.filter(val => {
                                const pos = pointScale(val);
                                return pos !== undefined && pos >= y0 && pos <= y1;
                            });

                            const filteredData = data.filter(d => {
                                const val = d[dim as keyof FirewallData] as string;
                                return filteredDomain.includes(val);
                            });
                            drawLines(filteredData);
                        }
                    } else {
                        // No selection, show all data
                        drawLines(data);
                    }
                });

            axisGroup.append("g")
                .attr("class", "brush")
                .call(brush);
        });

        // 5. Add Zoom Behavior
        const zoom = d3.zoom()
            .filter((event) => {
                ;
                if (event.type === "wheel") {
                    return true;
                }
                // Middle mouse button only
                if (event.type === "mousedown") {
                    // This is middle mouse button
                    return event.buttons === 4;
                }

                // By default, no other events trigger zoom/pan.
                return false;
            })
            .scaleExtent([0.5, 5])
            .on("zoom", (event) => {
                g.attr("transform", event.transform);
            });

        svg.call(zoom);

    };

    return (
        <div>
            <h1>Parallel Coordinates Plot</h1>
            <svg ref={svgRef}></svg>
        </div>
    );
};

export default ParallelCoordinatesPlot;
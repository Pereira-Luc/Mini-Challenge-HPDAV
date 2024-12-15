import * as d3 from "d3";
import { useEffect, useRef } from "react";
import { MergedData } from "../util/interface";

interface SimulationNode extends d3.SimulationNodeDatum {
    degree: number; // Custom property for node connectivity
    id: string;
    isHighPriority?: boolean;
    group?: number;
}

interface TrafficFlowVisualizationProps {
    data: MergedData[];
    filter: string | null;
}

const TrafficFlowVisualization: React.FC<TrafficFlowVisualizationProps> = ({ data }) => {
    const containerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (data.length > 0) {
            generateTrafficFlow(data);
        }
    }, [data]);

    const generateTrafficFlow = (data: MergedData[]) => {
        if (!containerRef.current) return;
    
        d3.select(containerRef.current).selectAll("*").remove(); // Clear previous visualization
    
        const width = 800;
        const height = 800;
    
        const svg = d3
            .select(containerRef.current)
            .append<SVGSVGElement>("svg")
            .attr("width", "100%")
            .attr("height", "100%")
            .attr("viewBox", `0 0 ${width} ${height}`)
            .call(
                d3.zoom<SVGSVGElement, unknown>().on("zoom", (event) => {
                    svgGroup.attr("transform", event.transform);
                })
            );
    
        const svgGroup = svg.append("g");
    
        // Create links first
        const links = data.map((d) => ({
            source: d.SourceIP,
            target: d.DestinationIP,
            protocol: d.Protocol || "TCP",
            packetSize: d.PacketInfo ? parseInt(d.PacketInfo, 10) : 1000,
            priority: d.Priority !== undefined ? d.Priority : 999,
        }));
    
        // Step 1: Calculate node degrees
        const nodeDegree: { [key: string]: number } = {};
        links.forEach((link) => {
            nodeDegree[link.source] = (nodeDegree[link.source] || 0) + 1;
            nodeDegree[link.target] = (nodeDegree[link.target] || 0) + 1;
        });
    
        // Step 2: Create nodes
        const nodes: SimulationNode[] = Array.from(
            new Set(data.flatMap((d) => [d.SourceIP, d.DestinationIP]))
        ).map((id) => ({
            id,
            degree: nodeDegree[id] || 0,
            isHighPriority: data.some(
                (link) =>
                    (link.SourceIP === id || link.DestinationIP === id) &&
                    link.Priority !== undefined &&
                    link.Priority !== null &&
                    link.Priority <= 2
            ),
        }));
    
        // Step 3: Define scales for size and color
        const sizeScale = d3.scaleLinear().domain([0, d3.max(nodes, (d) => d.degree) || 1]).range([8, 20]);
        // Define degree thresholds and colors
        const colorScale = d3
            .scaleThreshold<number, string>()
            .domain([5, 10, 20, 50]) // Degree thresholds
            .range(["#b3d9ff", "#66b3ff", "#0073e6", "#004080", "#00264d"]); // Light to dark blues

    
        // Define force simulation
        const simulation = d3
            .forceSimulation<SimulationNode>(nodes)
            .force(
                "link",
                d3
                    .forceLink<SimulationNode, typeof links[0]>(links).id((d) => d.id)
                    .id((d) => d.id)
                    .distance(150)
            )
            .force("charge", d3.forceManyBody().strength(-300))
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force("collision", d3.forceCollide<SimulationNode>().radius((d) => sizeScale(d.degree || 0) + 5));
    
        // Render links
        const link = svgGroup
            .selectAll<SVGLineElement, typeof links[0]>(".link")
            .data(links)
            .enter()
            .append("line")
            .attr("class", "link")
            .attr("stroke", (d) => (d.priority !== null && d.priority <= 2 ? "red" : "#999"))
            .attr("stroke-width", (d) => Math.max(2, d.packetSize / 1000));
    
        // Render nodes
        const node = svgGroup
            .selectAll<SVGCircleElement, SimulationNode>(".node")
            .data(nodes)
            .enter()
            .append("circle")
            .attr("class", "node")
            .attr("r", (d) => sizeScale(d.degree || 0)) // Adjust node size by degree
            .attr("fill", (d) => colorScale(d.degree || 0))
            .call(
                d3
                    .drag<SVGCircleElement, SimulationNode>()
                    .on("start", (event, d) => {
                        if (!event.active) simulation.alphaTarget(0.3).restart();
                        d.fx = event.x;
                        d.fy = event.y;
                    })
                    .on("drag", (event, d) => {
                        d.fx = event.x;
                        d.fy = event.y;
                    })
                    .on("end", (event, d) => {
                        if (!event.active) simulation.alphaTarget(0);
                        d.fx = null;
                        d.fy = null;
                    })
            );
    
        // Add labels to nodes
        const labels = svgGroup
            .selectAll<SVGTextElement, SimulationNode>(".label")
            .data(nodes)
            .enter()
            .append("text")
            .attr("class", "label")
            .attr("dx", 12)
            .attr("dy", ".35em")
            .text((d) => d.id);
    
        // Update positions on simulation tick
        simulation.on("tick", () => {
            link
                .attr("x1", (d: any) => ((d.source as SimulationNode).x ?? 0)) // Default to 0 if undefined
                .attr("y1", (d: any) => ((d.source as SimulationNode).y ?? 0))
                .attr("x2", (d: any) => ((d.target as SimulationNode).x ?? 0))
                .attr("y2", (d: any) => ((d.target as SimulationNode).y ?? 0));
    
            node.attr("cx", (d) => d.x || 0).attr("cy", (d) => d.y || 0);
    
            labels.attr("x", (d) => d.x || 0).attr("y", (d) => d.y || 0);
        });
    };
    
    

    return <div ref={containerRef} id="traffic-flow"></div>;
};

export default TrafficFlowVisualization;

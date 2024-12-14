import { useEffect, useState } from "react";
import * as d3 from "d3";
import { getMergedDataByDateTimeRange } from "../util/fetchers";
import { MergedData } from "../util/interface";

interface SimulationNode extends d3.SimulationNodeDatum {
    id: string;
}

const TrafficFlow = () => {
    const [mergedData, setMergedData] = useState<MergedData[]>([]);
    const [portsFilter, setPortsFilter] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data: MergedData[] = await getMergedDataByDateTimeRange(
                    "2012-04-06T17:40:00",
                    "2012-04-06T17:45:00"
                );
                setMergedData(data);
            } catch (error) {
                console.error("Error fetching merged data:", error);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        if (mergedData.length > 0) {
            generateTrafficFlow(mergedData, portsFilter);
        }
    }, [mergedData, portsFilter]);

    const generateTrafficFlow = (data: MergedData[], portFilter: string | null) => {
        const filteredData = portFilter
            ? data.filter(
                  (d) =>
                      d.SourcePort.toString() === portFilter ||
                      d.DestinationPort.toString() === portFilter
              )
            : data;

        d3.select("#traffic-flow").selectAll("*").remove();

        const width = 800;
        const height = 800;

        const svg = d3
            .select("#traffic-flow")
            .append("svg")
            .attr("width", "100%")
            .attr("height", "100%")
            .attr("viewBox", `0 0 ${width} ${height}`)
            .call(
                d3.zoom().on("zoom", (event) => {
                    svgGroup.attr("transform", event.transform);
                })
            );

        const svgGroup = svg.append("g");

        const nodes: SimulationNode[] = Array.from(
            new Set(filteredData.flatMap((d) => [d.SourceIP, d.DestinationIP]))
        ).map((id) => ({ id }));

        const links = filteredData.map((d) => ({
            source: d.SourceIP,
            target: d.DestinationIP,
            protocol: d.Protocol || "TCP",
            packetSize: d.PacketInfo ? parseInt(d.PacketInfo, 10) : 1000, // Default packetSize
            priority: d.Priority,
        }));

        svg.append("defs")
            .append("marker")
            .attr("id", "arrowhead")
            .attr("viewBox", "0 -5 10 10")
            .attr("refX", 15)
            .attr("refY", 0)
            .attr("markerWidth", 6)
            .attr("markerHeight", 6)
            .attr("orient", "auto")
            .append("path")
            .attr("d", "M0,-5L10,0L0,5")
            .attr("fill", "#999");

        const simulation = d3
            .forceSimulation<SimulationNode>(nodes)
            .force(
                "link",
                d3
                    .forceLink<SimulationNode, typeof links[0]>(links)
                    .id((d) => d.id)
                    .distance(200)
            )
            .force("charge", d3.forceManyBody().strength(-200))
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force("collision", d3.forceCollide().radius(20));

        const dragBehavior = d3
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
            });

        const link = svgGroup
            .selectAll<SVGLineElement, typeof links[0]>(".link")
            .data(links)
            .enter()
            .append("line")
            .attr("class", "link")
            .attr("stroke", (d) => (d.priority && d.priority <= 2 ? "red" : "green"))
            .attr("stroke-width", 2)
            .attr("marker-end", "url(#arrowhead)");

        const node = svgGroup
            .selectAll<SVGCircleElement, SimulationNode>(".node")
            .data(nodes)
            .enter()
            .append("circle")
            .attr("class", "node")
            .attr("r", 12)
            .attr("fill", "#69b3a2")
            .call(dragBehavior);

        const labels = svgGroup
            .selectAll<SVGTextElement, SimulationNode>(".label")
            .data(nodes)
            .enter()
            .append("text")
            .attr("class", "label")
            .attr("dx", 15)
            .attr("dy", ".35em")
            .text((d) => d.id);

        simulation.on("tick", () => {
            link.attr("x1", (d: any) => d.source.x)
                .attr("y1", (d: any) => d.source.y)
                .attr("x2", (d: any) => d.target.x)
                .attr("y2", (d: any) => d.target.y);

            node.attr("cx", (d: any) => d.x).attr("cy", (d: any) => d.y);

            labels.attr("x", (d: any) => d.x).attr("y", (d: any) => d.y);
        });

        // Animate blue dots along links
        links.forEach((link) => {
            const particle = svgGroup
                .append("circle")
                .attr("r", 4)
                .attr("fill", "blue");

            function animateParticle() {
                particle
                    .attr("cx", (link.source as SimulationNode).x || 0)
                    .attr("cy", (link.source as SimulationNode).y || 0)
                    .transition()
                    .duration(link.packetSize || 1000)
                    .attr("cx", (link.target as SimulationNode).x || 0)
                    .attr("cy", (link.target as SimulationNode).y || 0)
                    .on("end", animateParticle);
            }

            animateParticle();
        });
    };

    return (
        <div style={{ width: "100%", height: "100vh" }}>
            <h1>Dynamic Traffic Flow</h1>
            <div>
                <label>
                    Filter by Port:
                    <input
                        type="text"
                        placeholder="Enter port"
                        onChange={(e) => setPortsFilter(e.target.value)}
                    />
                </label>
            </div>
            <div id="traffic-flow"></div>
        </div>
    );
};

export default TrafficFlow;

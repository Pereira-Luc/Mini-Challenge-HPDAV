// TrafficFlowWorker.ts
import * as d3 from "d3-force";

let simulation: d3.Simulation<any, any> | null = null;

self.onmessage = (event) => {
    const { nodes, links } = event.data;

    // Initialize the simulation
    simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id((d: any) => d.id).distance(100))
        .force("charge", d3.forceManyBody().strength(-50))
        .force("center", d3.forceCenter(400, 400)) // Center the graph at canvas midpoint
        .on("tick", () => {
            // Send updated positions to the main thread
            self.postMessage({ nodes });
        });
};

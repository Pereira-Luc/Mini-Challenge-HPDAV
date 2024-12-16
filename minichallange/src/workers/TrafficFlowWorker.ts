import * as d3 from "d3-force";

// A helper function to calculate degree for nodes
function calculateMetrics(nodes: any[], links: any[]) {
    const degreeMap: { [key: string]: number } = {};

    links.forEach((link) => {
        degreeMap[link.source] = (degreeMap[link.source] || 0) + 1;
        degreeMap[link.target] = (degreeMap[link.target] || 0) + 1;
    });

    return nodes.map((node) => ({
        ...node,
        degree: degreeMap[node.id] || 0,
        closeness: Math.random(), // Placeholder
        betweenness: Math.random(), // Placeholder
        eigenvector: Math.random(), // Placeholder
    }));
}

let simulation: d3.Simulation<any, any> | null = null;

self.onmessage = (event) => {
    const { nodes, links } = event.data;

    // Calculate metrics
    const updatedNodes = calculateMetrics(nodes, links);

    // Initialize the simulation
    simulation = d3
        .forceSimulation(updatedNodes)
        .force("link", d3.forceLink(links).id((d: any) => d.id).distance(100))
        .force("charge", d3.forceManyBody().strength(-50))
        .force("center", d3.forceCenter(400, 400))
        .on("tick", () => {
            self.postMessage({ type: "progress", nodes: updatedNodes });
        })
        .on("end", () => {
            self.postMessage({ type: "complete", nodes: updatedNodes });
        });

    setTimeout(() => {
        if (simulation) {
            simulation.stop();
            self.postMessage({ type: "complete", nodes: updatedNodes });
        }
    }, 5000);
};

import * as d3 from "d3-force";

// Calculate metrics
function calculateMetrics(nodes: any[], links: any[]) {
    const degreeMap: { [key: string]: number } = {};
    // Count degrees for each node
    links.forEach((link) => {
        degreeMap[link.source] = (degreeMap[link.source] || 0) + 1;
        degreeMap[link.target] = (degreeMap[link.target] || 0) + 1;
    });
        
    nodes.forEach((node) => {
        degreeMap[node.id] = degreeMap[node.id] || 0; // Ensure disconnected nodes are included
    });

    return nodes.map((node) => ({
        ...node,
        degree: degreeMap[node.id] || 0,
        closeness: Math.random(), // Placeholder
        betweenness: Math.random(), // Placeholder
        eigenvector: Math.random(), // Placeholder
    }));
}

self.onmessage = (event) => {
    const { nodes, links } = event.data;

    const updatedNodes = calculateMetrics(nodes, links);
    console.log("Sending updated nodes from worker:", updatedNodes);

    const simulation = d3.forceSimulation(updatedNodes)
        .force("link", d3.forceLink(links).id((d: any) => d.id).distance(100))
        .force("charge", d3.forceManyBody().strength(-50))
        .force("center", d3.forceCenter(400, 400))
        .on("tick", () => {
            self.postMessage({ type: "progress", nodes: updatedNodes });
        })
        .on("end", () => {
            self.postMessage({ type: "complete", nodes: updatedNodes });
        });

    // Safety timeout to stop simulation after a duration
    setTimeout(() => {
        if(simulation)
        {
            simulation.stop();
            self.postMessage({ type: "complete", nodes: updatedNodes });
        }
    }, 5000); // Fallback after 5 seconds
};

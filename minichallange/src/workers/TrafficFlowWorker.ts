import * as d3 from "d3-force";

self.onmessage = (event) => {
    const { nodes, links } = event.data;

    const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links)
            .id((d: any) => d.id)
            .distance(100) // Reduced link distance to keep nodes closer
        )
        .force("charge", d3.forceManyBody()
            .strength(-50) // Weaker repulsion to avoid spreading too far
        )
        .force("center", d3.forceCenter(450, 600)) // Adjust canvas center
        .force("collision", d3.forceCollide(25)) // Prevent overlap
        .alphaDecay(0.01) // Slower decay to allow for stabilization
        .on("tick", () => {
            // Send node updates for smoother animation
            self.postMessage({ type: "progress", nodes });
        })
        .on("end", () => {
            // Send final stabilized nodes
            self.postMessage({ type: "complete", nodes });
        });

    // Safety fallback timeout to stop simulation if it takes too long
    const safetyTimeout = setTimeout(() => {
        simulation.stop();
        self.postMessage({ type: "complete", nodes });
    }, 10000); // Increased to 10 seconds

    // Stop the timeout if simulation completes naturally
    simulation.on("end", () => clearTimeout(safetyTimeout));
};

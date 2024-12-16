import * as d3 from "d3-force";


self.onmessage = (event) => {
    const { nodes, links } = event.data;
    const simulation = d3.forceSimulation(nodes)
            .force("link", d3.forceLink(links)
            .id((d: any) => d.id)
            .distance(150) // Increase link distance to spread nodes further
        )
        .force("charge", d3.forceManyBody()
            .strength(-200) // Stronger repulsion between nodes
        )
        .force("center", d3.forceCenter(400, 400))
        .force("collision", d3.forceCollide(20)) // Add collision to prevent node overlap
        .on("tick", () => {
            self.postMessage({ type: "progress", nodes: nodes });
        })
        .on("end", () => {
            self.postMessage({ type: "complete", nodes: nodes });
        });

    // Safety timeout to stop simulation after a duration
    setTimeout(() => {
        if(simulation)
        {
            simulation.stop();
            self.postMessage({ type: "complete", nodes: nodes });
        }
    }, 5000); // Fallback after 5 seconds
};
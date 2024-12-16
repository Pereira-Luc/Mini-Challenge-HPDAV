import * as d3 from "d3-force";


self.onmessage = (event) => {
    const { nodes, links } = event.data;
    const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id((d: any) => d.id).distance(100))
        .force("charge", d3.forceManyBody().strength(-50))
        .force("center", d3.forceCenter(400, 400))
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
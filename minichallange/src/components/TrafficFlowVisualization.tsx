import { useEffect, useRef, useState } from "react";
import { MergedData } from "../util/interface";

interface SimulationNode {
    x: number;
    y: number;
    degree: number;
    id: string;
    isHighPriority?: boolean;
    group?: number;
}

interface SimulationLink {
    source: string;
    target: string;
    protocol: string;
    packetSize: number;
    priority: number;
}

interface TrafficFlowVisualizationProps {
    data: MergedData[];
    filter: string | null;
}

const TrafficFlowVisualization: React.FC<TrafficFlowVisualizationProps> = ({ data }) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const workerRef = useRef<Worker | null>(null);
    const [scale, setScale] = useState(1); // For zoom functionality
    const [translate, setTranslate] = useState({ x: 0, y: 0 }); // For pan functionality
    const [nodes, setNodes] = useState<SimulationNode[]>([]); // To store nodes
    const [links, setLinks] = useState<SimulationLink[]>([]); // To store links

    useEffect(() => {
        if (workerRef.current) {
            workerRef.current.terminate(); // Clean up old worker if it exists
        }
        workerRef.current = new Worker(new URL("../workers/TrafficFlowWorker.ts", import.meta.url), {
            type: "module",
        });

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Convert data into nodes and links
        const linksData: SimulationLink[] = data.map((d) => ({
            source: d.SourceIP,
            target: d.DestinationIP,
            protocol: d.Protocol || "TCP",
            packetSize: d.PacketInfo ? parseInt(d.PacketInfo, 10) : 1000,
            priority: d.Priority !== undefined && d.Priority !== null ? d.Priority : 999,
        }));

        const nodeDegree: { [key: string]: number } = {};
        linksData.forEach((link) => {
            nodeDegree[link.source] = (nodeDegree[link.source] || 0) + 1;
            nodeDegree[link.target] = (nodeDegree[link.target] || 0) + 1;
        });

        const nodesData: SimulationNode[] = Array.from(
            new Set(data.flatMap((d) => [d.SourceIP, d.DestinationIP]))
        ).map((id) => ({
            id,
            degree: nodeDegree[id] || 0,
            x: Math.random() * canvas.width, // Initialize with random positions
            y: Math.random() * canvas.height,
        }));

        setNodes(nodesData);
        setLinks(linksData);

        // Send nodes and links to the worker
        workerRef.current.postMessage({ nodes: nodesData, links: linksData });

        workerRef.current.onmessage = (event) => {
            const updatedNodes: SimulationNode[] = event.data.nodes;
            setNodes(updatedNodes); // Update nodes state
            renderCanvas(ctx, updatedNodes, linksData); // Render with updated nodes
        };

        return () => {
            if (workerRef.current) workerRef.current.terminate();
        };
    }, [data]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        renderCanvas(ctx, nodes, links);
    }, [scale, translate, nodes, links]);

    const renderCanvas = (
        ctx: CanvasRenderingContext2D,
        nodes: SimulationNode[],
        links: SimulationLink[]
    ) => {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
        ctx.save();
        ctx.setTransform(scale, 0, 0, scale, translate.x, translate.y);
    
        // Draw links
        links.forEach((link) => {
            const source = nodes.find((node) => node.id === link.source);
            const target = nodes.find((node) => node.id === link.target);
            if (source && target) {
                ctx.beginPath();
                ctx.moveTo(source.x, source.y);
                ctx.lineTo(target.x, target.y);
                ctx.lineWidth = 0.5; // Make links very thin
                ctx.strokeStyle = link.priority <= 2 ? "red" : "#ccc";
                ctx.stroke();
            }
        });
    
        // Draw nodes and labels
        nodes.forEach((node) => {
            ctx.beginPath();
            ctx.arc(node.x, node.y, Math.min(2, node.degree * 0.2 + 1), 0, Math.PI * 2); // Make nodes smaller
            ctx.fillStyle = node.degree > 10 ? "#0073e6" : "#b3d9ff";
            ctx.fill();
            ctx.closePath();
    
            // Show labels only for high-degree nodes or significant zoom level
            if (scale > 2 && node.degree > 10) {
                ctx.font = "10px Arial";
                ctx.fillStyle = "#000";
                ctx.fillText(node.id, node.x + 3, node.y - 3); // Offset the labels
            }
        });
    
        ctx.restore();
    };
    

    const handleWheel = (event: React.WheelEvent<HTMLCanvasElement>) => {
        event.preventDefault();
        const scaleAmount = event.deltaY > 0 ? 0.9 : 1.1; // Zoom in or out
        setScale((prev) => Math.max(0.5, Math.min(5, prev * scaleAmount))); // Restrict scale range between 0.5 and 5
    };

    const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
        const startX = event.clientX;
        const startY = event.clientY;
        const initialTranslate = { ...translate };

        const handleMouseMove = (moveEvent: MouseEvent) => {
            setTranslate({
                x: initialTranslate.x + (moveEvent.clientX - startX),
                y: initialTranslate.y + (moveEvent.clientY - startY),
            });
        };

        const handleMouseUp = () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        };

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
    };

    return (
        <canvas
            ref={canvasRef}
            width={800}
            height={800}
            style={{ border: "1px solid black", cursor: "grab" }}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
        ></canvas>
    );
};

export default TrafficFlowVisualization;

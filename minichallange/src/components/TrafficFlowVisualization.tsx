import { useEffect, useMemo, useRef, useState } from "react";
import { MergedData } from "../util/interface";
import LoadingOverlay from "./LoadingOverlay";

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
    onMetricsUpdate: (updatedNodes: any[]) => void; // Callback to update metrics

}

const TrafficFlowVisualization: React.FC<TrafficFlowVisualizationProps> = ({ data, onMetricsUpdate, }) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const workerRef = useRef<Worker | null>(null);
    const [scale, setScale] = useState(1);
    const [translate, setTranslate] = useState({ x: 0, y: 0 });
    const [nodes, setNodes] = useState<SimulationNode[]>([]);
    const [links, setLinks] = useState<SimulationLink[]>([]);
    const [loading, setLoading] = useState(true);
    const [progress, setProgress] = useState(0);
    const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
 


    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        renderCanvas(ctx, nodes, links, cursorPos);
    }, [scale, translate, nodes, links, cursorPos]);

    useEffect(() => {
        if (workerRef.current) {
            workerRef.current.terminate();
        }
        workerRef.current = new Worker(new URL("../workers/TrafficFlowWorker.ts", import.meta.url), {
            type: "module",
        });

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        setLoading(true);
        setProgress(0);

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
        ).map((id) => {
            const originalData = data.find((d) => d.SourceIP === id || d.DestinationIP === id); // Find data for node
            return {
                id,
                degree: nodeDegree[id] || 0,
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
            };
        });

        setNodes(nodesData);
        setLinks(linksData);

        workerRef.current.postMessage({ nodes: nodesData, links: linksData });

        // Simulate progress bar
        const progressInterval = setInterval(() => {
            setProgress((prev) => Math.min(prev + 5, 95));
        }, 200);
    
        workerRef.current.onmessage = (event) => {
            const { type, nodes: updatedNodes } = event.data;
    
            if (type === "progress") {
                setProgress((prev) => Math.min(prev + 5, 95));
            } else if (type === "complete") {
                clearInterval(progressInterval);
                setNodes(updatedNodes);
                setLoading(false);
                setProgress(100);
            }
        };
    
        workerRef.current.postMessage({ nodes: nodesData, links: linksData });

        return () => {
            if (workerRef.current) workerRef.current.terminate();
            clearInterval(progressInterval);
        };
    }, [data]);

    const memoizedData = useMemo(() => data, [data]);

    useEffect(() => {
        // Existing worker logic here
    }, [memoizedData]);


    const renderCanvas = (
        ctx: CanvasRenderingContext2D,
        nodes: SimulationNode[],
        links: SimulationLink[],
        cursor: { x: number; y: number }
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
                ctx.lineWidth = 0.5;
                ctx.strokeStyle = link.priority <= 2 ? "red" : "#ccc";
                ctx.stroke();
            }
        });
    
        // Draw nodes
        nodes.forEach((node) => {
            ctx.beginPath();
            ctx.arc(node.x, node.y, Math.min(2, node.degree * 0.2 + 1), 0, Math.PI * 2);
            ctx.fillStyle = node.degree > 10 ? "#0073e6" : "#b3d9ff";
            ctx.fill();
            ctx.closePath();
    
            // Always show labels for high-degree nodes
            if (node.degree > 10) {
                ctx.font = "10px Arial";
                ctx.fillStyle = "blue";
                ctx.fillText(node.id, node.x + 5, node.y - 5);
            }
        });
    
        // Highlight node if cursor is close
        nodes.forEach((node) => {
            const distance = Math.hypot(
                (cursor.x - translate.x) / scale - node.x,
                (cursor.y - translate.y) / scale - node.y
            );
            if (distance < 20 && node.degree <= 10) {
                ctx.font = "10px Arial";
                ctx.fillStyle = "black";
                ctx.fillText(node.id, node.x + 5, node.y - 5);
            }
        });
    
        ctx.restore();
    };
    
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
    
        const handleWheel = (event: WheelEvent) => {
            event.preventDefault();
            const scaleAmount = event.deltaY > 0 ? 0.9 : 1.1; // Zoom in or out
            setScale((prev) => Math.max(0.5, Math.min(5, prev * scaleAmount)));
        };
    
        canvas.addEventListener("wheel", handleWheel, { passive: false });
    
        return () => {
            canvas.removeEventListener("wheel", handleWheel);
        };
    }, []);
    


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

    const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        setCursorPos({
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
        });
    };



    return (
        <div>
            {loading && <LoadingOverlay progress={progress} />}
            <canvas
                ref={canvasRef}
                width={1800}
                height={1200}
                style={{
                    border: "1px solid black",
                    cursor: loading ? "not-allowed" : "grab", // Change cursor during loading
                    pointerEvents: loading ? "none" : "auto", // Disable interactions
                }}
                onMouseDown={!loading ? handleMouseDown : undefined} // Disable dragging
                onMouseMove={!loading ? handleMouseMove : undefined} // Disable cursor tracking
            ></canvas>
        </div>
    );
};


export default TrafficFlowVisualization;
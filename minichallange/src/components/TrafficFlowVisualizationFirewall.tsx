import { useEffect, useMemo, useRef, useState } from "react";
import { FirewallData, IDSData, MergedData } from "../util/interface";
import LoadingOverlay from "./LoadingOverlay";

// Keep IP utilities
const ipToInt = (ip: string): number => {
    return ip.split('.')
        .reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0);
};

const intToIp = (int: number): string => {
    return [
        (int >>> 24) & 255,
        (int >>> 16) & 255,
        (int >>> 8) & 255,
        int & 255
    ].join('.');
};

const getSubnet = (ip: string, mask: number = 24): string => {
    const ipInt = ipToInt(ip);
    const maskBits = ~((1 << (32 - mask)) - 1);
    return intToIp(ipInt & maskBits);
};

// Keep AggregatedData type
type AggregatedData = {
    Protocol: string;
    subnet: string;
    count: number;
    SourceIP: string;
    DestinationIP: string[];
    DestinationPort: string[];
    Direction: string[];
    DateTime: {
        min: Date;
        max: Date;
    };
    originalIPs: string[];
};


const mergeData = (items: FirewallData[] | IDSData[]): AggregatedData => {
    return {
        subnet: getSubnet(items[0].SourceIP),
        count: items.length,
        SourceIP: getSubnet(items[0].SourceIP),
        DestinationIP: [...new Set(items.map((item) => item.DestinationIP))],
        DestinationPort: [...new Set(items.map((item) => item.DestinationPort))],
        Direction: items.every((item) => "Direction" in item)
            ? [...new Set(items.map((item) => (item as FirewallData).Direction))]
            : ['N/A'],
        DateTime: {
            min: new Date(Math.min(...items.map((item) => new Date(item.DateTime).getTime()))),
            max: new Date(Math.max(...items.map((item) => new Date(item.DateTime).getTime())))
        },
        originalIPs: items.map((item) => item.SourceIP),
        Protocol: items.every((item) => "Protocol" in item)
            ? (items[0] as FirewallData).Protocol
            : 'Unknown' // Default value if Protocol doesn't exist
    };
};


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
}

interface TrafficFlowVisualizationProps {
    data: FirewallData[];
    filter: string | null;

}

const TrafficFlowVisualization: React.FC<TrafficFlowVisualizationProps> = ({ data }) => {
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

        if (!data) return;

        // Group by subnet and merge
        const subnetGroups = data.reduce((acc, data) => {
            const subnet = getSubnet(data.SourceIP);

            if (!acc[subnet]) { acc[subnet] = []; }
            
            acc[subnet].push(data);

            return acc;
        }, {} as { [key: string]: FirewallData[] });
    
        const mergedData = Object.values(subnetGroups).map(items => mergeData(items));
        const dimensions = ["DateTime", "SourceIP", "DestinationPort", "DestinationIP"]
            .concat(data.length > 0 && 'Direction' in data[0] ? ["Direction"] : []);

        const linksData: SimulationLink[] = mergedData.flatMap((d) =>
            d.DestinationIP.map((destIP) => ({
                source: d.SourceIP,
                target: destIP, // Convert from array to single string
                protocol: d.Protocol,
            }))
        );
        
        

        const nodeDegree: { [key: string]: number } = {};
        linksData.forEach((link) => {
            nodeDegree[link.source] = (nodeDegree[link.source] || 0) + 1;
            nodeDegree[link.target] = (nodeDegree[link.target] || 0) + 1;
        });

        const nodesData: SimulationNode[] = Array.from(
            new Set(mergedData.flatMap((d) => [d.SourceIP, ...d.DestinationIP])) // Flatten DestinationIP
        ).map((id) => {
            if (typeof id !== "string") return null; // Filter out invalid IDs
            return {
                id,
                degree: nodeDegree[id] || 0,
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
            };
        }).filter((node): node is SimulationNode => node !== null); // Remove null entries
        
        

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
                ctx.strokeStyle = "red";
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
                width={900}
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
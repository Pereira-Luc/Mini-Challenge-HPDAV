import { useEffect, useMemo, useRef, useState } from "react";
import { IDSData } from "../util/interface";
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
    packetSize: number;
    priority: number;
    label: string;
}

interface TrafficFlowVisualizationIDSProps {
    data: IDSData[];
    filter: string | null;

}

const TrafficFlowVisualization: React.FC<TrafficFlowVisualizationIDSProps> = ({ data, }) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const workerRef = useRef<Worker | null>(null);
    const [scale, setScale] = useState(1);
    const [translate, setTranslate] = useState({ x: 0, y: 0 });
    const [nodes, setNodes] = useState<SimulationNode[]>([]);
    const [links, setLinks] = useState<SimulationLink[]>([]);
    const [loading, setLoading] = useState(true);
    const [progress, setProgress] = useState(0);
    const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
    const usedHues: number[] = [];
    const MIN_HUE_DISTANCE = 30; // Minimum distance between hues to consider them "not close"
    let hoveredLink: SimulationLink | null = null; // Explicitly typed
    const getRandomRainbowColor = () => {
        let hue: number;
        let isClose;
    
        do {
            hue = Math.floor(Math.random() * 360); // Random hue between 0 and 360
            isClose = usedHues.some((usedHue) => Math.abs(usedHue - hue) < MIN_HUE_DISTANCE);
        } while (isClose);
    
        usedHues.push(hue); // Store the hue
        const saturation = 100; // Full saturation for vibrant colors
        const lightness = 50;   // Medium lightness for balanced brightness
        return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    };
    
    const labelColorMapRef = useRef<{ [key: string]: string }>({});

    const getColorForLabel = (label: string) => {
        if (!labelColorMapRef.current[label]) {
            labelColorMapRef.current[label] = getRandomRainbowColor(); // Assign a random color for new labels
        }
        return labelColorMapRef.current[label];
    };
    

    function pointToSegmentDistance(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
        const A = px - x1;
        const B = py - y1;
        const C = x2 - x1;
        const D = y2 - y1;
    
        const dot = A * C + B * D;
        const len_sq = C * C + D * D;
        let param = -1;
    
        if (len_sq !== 0) {
            param = dot / len_sq;
        }
    
        let xx, yy;
    
        if (param < 0) {
            xx = x1;
            yy = y1;
        } else if (param > 1) {
            xx = x2;
            yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }
    
        const dx = px - xx;
        const dy = py - yy;
    
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    

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
            packetSize: d.PacketInfo ? parseInt(d.PacketInfo, 10) : 1000,
            priority: d.Priority !== undefined && d.Priority !== null ? d.Priority : 999,
            label: d.Label || "default", // Replace 'Label' with the actual property name from your data
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
    
        const hoverThreshold = 10; // Hover distance
        const hoveredLabels: Set<string> = new Set(); // Ensure distinct labels
        const hoveredLinks: { label: string; absX: number; absY: number }[] = []; // Store label positions
    
        // Apply zoom/translate transformations for links and nodes
        ctx.save();
        ctx.setTransform(scale, 0, 0, scale, translate.x, translate.y);
    
        // Draw links and detect hover
        links.forEach((link) => {
            const source = nodes.find((node) => node.id === link.source);
            const target = nodes.find((node) => node.id === link.target);
    
            if (source && target) {
                ctx.beginPath();
                ctx.moveTo(source.x, source.y);
                ctx.lineTo(target.x, target.y);
                ctx.lineWidth = 1.5;
                ctx.strokeStyle = getColorForLabel(link.label);
                ctx.stroke();
    
                // Detect hover (cursor in absolute position)
                const distance = pointToSegmentDistance(
                    (cursor.x - translate.x) / scale,
                    (cursor.y - translate.y) / scale,
                    source.x,
                    source.y,
                    target.x,
                    target.y
                );
    
                if (distance < hoverThreshold && !hoveredLabels.has(link.label)) {
                    const absX = (source.x + target.x) / 2 * scale + translate.x; // Absolute X position
                    const absY = (source.y + target.y) / 2 * scale + translate.y; // Absolute Y position
                    hoveredLabels.add(link.label);
                    hoveredLinks.push({ label: link.label, absX, absY });
                }
            }
        });

        // Draw links and detect hover
        links.forEach((link) => {
            const source = nodes.find((node) => node.id === link.source);
            const target = nodes.find((node) => node.id === link.target);

            if (source && target) {
                const colors = Array.isArray(link.label)
                    ? link.label.map((lbl) => getColorForLabel(lbl))
                    : [getColorForLabel(link.label)]; // Ensure label can handle arrays
                
                const totalSegments = colors.length;

                for (let i = 0; i < totalSegments; i++) {
                    ctx.beginPath();
                    const segmentStartX = source.x + (i / totalSegments) * (target.x - source.x);
                    const segmentStartY = source.y + (i / totalSegments) * (target.y - source.y);
                    const segmentEndX = source.x + ((i + 1) / totalSegments) * (target.x - source.x);
                    const segmentEndY = source.y + ((i + 1) / totalSegments) * (target.y - source.y);

                    ctx.moveTo(segmentStartX, segmentStartY);
                    ctx.lineTo(segmentEndX, segmentEndY);
                    ctx.lineWidth = 1.5;
                    ctx.strokeStyle = colors[i];
                    ctx.stroke();
                }
            }
        });

    
        // Draw nodes
        // Always display node IP addresses
        nodes.forEach((node) => {
            const textX = node.x; // Position based on node coordinates
            const textY = node.y - 10; // Position slightly above the node
        
            ctx.font = "10px Arial";
            ctx.fillStyle = "black";
            ctx.textAlign = "center";
            ctx.fillText(node.id, textX, textY);
        });
        

        ctx.restore(); // Reset transformation for text rendering
    
        // Draw labels in absolute positions (outside of zoom/translate context)
        const labelSpacing = 18;
        let currentYOffset = 0;
    
        hoveredLinks.forEach(({ label, absX, absY }) => {
            // Adjust Y-position for vertical stacking
            const textX = absX;
            const textY = absY + currentYOffset;
    
            const textWidth = ctx.measureText(label).width;
    
            // White background for clarity
            ctx.fillStyle = "white";
            ctx.fillRect(textX - 3, textY - 12, textWidth + 6, 14);
    
            // Draw the label text
            ctx.font = "12px Arial";
            ctx.fillStyle = getColorForLabel(label);
            ctx.fillText(label, textX, textY);
    
            currentYOffset += labelSpacing; // Vertical spacing between labels
        });
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

    const Legend: React.FC = () => (
        <div style={{ display: "flex", flexDirection: "column", marginTop: 10 }}>
            {Object.entries(labelColorMapRef.current).map(([label, color]) => (
                <div key={label} style={{ display: "flex", alignItems: "center", marginBottom: 5 }}>
                    <div style={{ width: 20, height: 20, backgroundColor: color, marginRight: 10 }}></div>
                    <span>{label}</span>
                </div>
            ))}
        </div>
    );
    

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
            <Legend />
        </div>
    );
};


export default TrafficFlowVisualization;
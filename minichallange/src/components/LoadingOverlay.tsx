import React from "react";

interface LoadingOverlayProps {
    progress: number;
    message?: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ progress, message = "Loading..." }) => {
    return (
        <div
            style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                background: "rgba(255, 255, 255, 0.8)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                zIndex: 10,
            }}
        >
            <p>{message}</p>
            <div
                style={{
                    width: "80%",
                    height: "10px",
                    background: "#ddd",
                    borderRadius: "5px",
                    overflow: "hidden",
                }}
            >
                <div
                    style={{
                        width: `${progress}%`,
                        height: "100%",
                        background: "#0073e6",
                        transition: "width 0.2s ease",
                    }}
                ></div>
            </div>
        </div>
    );
};

export default LoadingOverlay;

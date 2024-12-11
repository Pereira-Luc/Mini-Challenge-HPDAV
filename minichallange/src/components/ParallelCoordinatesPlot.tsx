import React, { useEffect } from "react";
import { getFirewallDataByDateTimeRange } from "../util/fetchers";

const ParallelCoordinatesPlot = () => {
    useEffect(() => {
        console.log("ParallelCoordinatesPlot component mounted");
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                console.log("Fetching data...");
                const data = await getFirewallDataByDateTimeRange("2012-04-06T17:40:00", "2012-04-06T17:45:00");
                console.log(data);
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };
        fetchData();
    }, []);

    return (
        <>
            <div>
                <h1>Parallel Coordinates Plot</h1>
            </div>
        </>
    );
};

export default ParallelCoordinatesPlot;

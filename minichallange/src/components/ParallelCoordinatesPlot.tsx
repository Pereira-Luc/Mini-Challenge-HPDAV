import { useEffect, useState } from "react";
import { getFirewallDataByDateTimeRange } from "../util/fetchers";
import { FirewallData } from "../util/interface";

const ParallelCoordinatesPlot = () => {
    const [firewallData, setfirewallData] = useState<FirewallData[]>([]);

    useEffect(() => {
        generateParallelCoordinatesPlot(firewallData, ["DateTime", "SourceIP", "DestinationIP"]);
    }, [firewallData]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                console.log("Fetching data...");
                const data: FirewallData[] = await getFirewallDataByDateTimeRange("2012-04-06T17:40:00", "2012-04-06T17:45:00");
                setfirewallData(data);
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };
        fetchData();
    }, []);

    const generateParallelCoordinatesPlot = (data: FirewallData[], dimensions: string[] = ["DateTime", "SourceIP", "DestinationIP"]) => { 
        console.log("Generating Parallel Coordinates Plot...");
        console.log("Data length:", data);
        console.log("Dimensions:", dimensions);

        if (data.length === 0 || !data) {
            console.error("Data is empty");
            return;
        }

    };

    return (
        <>
            <div>
                <h1>Parallel Coordinates Plot</h1>
            </div>
        </>
    );
};

export default ParallelCoordinatesPlot;

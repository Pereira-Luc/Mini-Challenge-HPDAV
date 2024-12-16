import { FC } from "react";
import TrafficFlowVisualization from "./TrafficFlowVisualization";
import { MergedData } from "../util/interface";

interface TrafficFlowProps {
    data: MergedData[];
}

const TrafficFlow: FC<TrafficFlowProps> = ({ data }) => {
    return (
        <div>
            <TrafficFlowVisualization data={data} />
        </div>
    );
};

export default TrafficFlow;

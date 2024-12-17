import './Hist.css'
import { useEffect, useRef, useState } from 'react';
import {useSelector, useDispatch} from 'react-redux'
import {getFirewallDataByDateTimeRange} from "../../util/fetchers";
import { FirewallData, MergedData } from "../../util/interface";
import HistD3 from './Hist-d3';


// TODO: import action methods from reducers

interface HistContainerProps {
    data: FirewallData[];
    filter: string | null;

}

const HistContainer: React.FC<HistContainerProps> = ({ data, }) => {

// function HistContainer(){
    //const dataSetData = useSelector(state =>state.dataSet)
    // const [dataSetData, setDataSetData] = useState({});
    // const selectedDataData = useSelector(state =>state.selectedData)
    const dispatch = useDispatch();

    const xAttribute= ""
    const yAttribute= "Count"

    // every time the component re-render
    useEffect(() => {
        // const fetchData = async () => {
        //     try {
        //         console.log("Fetching firewall data...");
        //         const timeWindow = { };
                
        //         // Format dates for Python compatibility (YYYY-MM-DD HH:MM:SS)
        //         const formatDateForPython = (date) => {
        //             return date.toISOString()
        //                 .replace('T', ' ')     // Replace T with space
        //                 .replace(/\.\d+Z$/, '') // Remove milliseconds and Z
        //         };

        //         const start = timeWindow?.start ? formatDateForPython(timeWindow.start) : "2012-04-05T17:51:26";
        //         const end = timeWindow?.end ? formatDateForPython(timeWindow.end) : "2012-04-05T17:59:26";

        //         console.log("Start Date:", start);
        //         console.log("End Date:", end);

        //         const data = await getFirewallDataByDateTimeRange(
        //             start || "",
        //             end || ""
        //         );
        //         console.log("Fetched data:", data.length);
        //         console.log("Fetched data:", data);
        //         setDataSetData(data);
        //         console.log("TUK", data);

        //     } catch (error) {
        //         console.error("Error fetching firewall data:", error);
        //     }
        // };
        // fetchData();
    },[]);

    const divContainerRef=useRef(null);
    const histD3Ref = useRef(null)

    const getCharSize = function(){
        // fixed size
        // return {width:900, height:900};
        // getting size from parent item
        let width = 600;// = 800;
        let height = 600;// = 100;
        // if(divContainerRef.current!==undefined){
        //     width=divContainerRef.current.offsetWidth;
        //     // width = '100%';
        //     height=divContainerRef.current.offsetHeight;
        //     // height = '100%';
        // }
        return {width:width,height:height};
    }

    // did mount called once the component did mount
    useEffect(()=>{
        console.log("HistContainer useEffect [] called once the component did mount");
        const histD3 = new HistD3(divContainerRef.current);
        histD3.create({size:getCharSize()});
        histD3Ref.current = histD3;
        return ()=>{
            // did unmout, the return function is called once the component did unmount (removed for the screen)
            console.log("HistContainer useEffect [] return function, called when the component did unmount...");
            const histD3 = histD3Ref.current;
            histD3.clear()
        }
    },[]);// if empty array, useEffect is called after the component did mount (has been created)

    // did update, called each time dependencies change, dispatch remain stable over component cycles
    useEffect(()=>{
        console.log("HistContainer useEffect with dependency [dataSetData,dispatch], called each time dataSetData changes...");
        const histD3 = histD3Ref.current;

        const handleOnChangeOfSelection = function(payload){
            //dispatch(updateSelection({...dataSetData, selected:payload}));
        }
        const controllerMethods={
            handleOnChangeOfSelection: handleOnChangeOfSelection,
        }
        console.log("dataSetData: ", data);
        if (data === undefined || data === undefined || data.length == 0) {
            console.log("PRAZNO EEE!");
            return;
        }

        var allAtributes = []
        if(!(data === undefined || data.length == 0))
        {
            allAtributes = Object.keys(data[0]);
            allAtributes.splice(0, 1);
        }
        console.log("allAtr", allAtributes);

        histD3.renderHist(data,allAtributes,controllerMethods);
    },[data]);// if dependencies, useEffect is called after each data update, in our case only dataSetData changes.

    return(
        <div ref={divContainerRef} className="histDivContainer col2">

        </div>
    )
}

export default HistContainer;
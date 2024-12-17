import * as d3 from 'd3'

class HistD3 {
    margin = {top: 50, right: 5, bottom: 100, left: 100};
    size;
    height;
    width;
    matSvg;
    matSel;
    // add specific class properties used for the vis render/updates
    // cellSize= 34;
    // radius = this.cellSize / 2;
    // colorScheme = d3.schemeYlGnBu[9];
    // cellColorScale = d3.scaleQuantile(this.colorScheme);
    // cellSizeScale = d3.scaleLinear()
    //     .range([2, this.radius-1])
    // ;
    circleRadius = 1;
    xScale;
    yScale;
    selectedAttribute=""
    yAttribute="Count"


    constructor(el){
        this.el=el;
    };

    create = function (config) {
        this.size = {width: config.size.width, height: config.size.height};

        // adapt the size locally if necessary
        // e.g. to create a square svg
        // if (this.size.width > this.size.height) {
        //     this.size.width = this.size.height;
        // } else {
        //     this.size.height = this.size.width;
        // }

        // get the effect size of the view by subtracting the margin
        this.width = this.size.width - this.margin.left - this.margin.right;
        this.height = this.size.height - this.margin.top - this.margin.bottom;

        this.matSel=d3.select(this.el)
        .append("select")
        .attr("class", "dd")
        ;
            
        // initialize the svg and keep it in a class property to reuse it in renderMatrix()
        this.matSvg=d3.select(this.el).append("svg")
            .attr("width", this.width + this.margin.left + this.margin.right)
            .attr("height", this.height + this.margin.top + this.margin.bottom)
            .append("g")
            .attr("class","matSvgG")
            .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")")
        ;

        
        this.xScale = d3.scaleBand().range([0,this.width]);
        this.yScale = d3.scaleLinear().range([this.height,0]);
        
        // build xAxisG
        this.matSvg.append("g")
            .attr("class","xAxisG")
            .attr("transform","translate(0,"+this.height+")")
        ;
        this.matSvg.append("g")
            .attr("class","yAxisG")
        ;
        console.log("height: ", this.height);

    }

    zoom = function(svg,w,h,x,selectedAttr) {
        const extent = [[0, 0], [w, h]];
    
        svg.call(d3.zoom()
            .scaleExtent([1, 64])
            .translateExtent(extent)
            .extent(extent)
            .on("zoom", zoomed));
    
        function zoomed(event) {
            console.log("xxx: ", x)
          x.range([0,w].map(d => event.transform.applyX(d)));
          svg.selectAll(".barRect").attr("x", d => x(d[selectedAttr])).attr("width", x.bandwidth());
          svg.selectAll(".xAxisG").call(d3.axisBottom(x));
        }
      }

    updateAxis = function(visData,xAttribute,yAttribute,allAtributes){
        // const minX = d3.min(visData.map(item=>item[xAttribute]));
        // const maxX = d3.max(visData.map(item=>item[xAttribute]));
        // this.xScale.domain([0, maxX]);
        this.xScale.domain(visData.map(item=>item[xAttribute])).padding(0.1);
        console.log("dom: " + xAttribute);
        const minY = 0; // d3.min(visData.map(item=>item[yAttribute]));
        const maxY = d3.max(visData.map(item=>item[yAttribute]));
        // this.yScale.domain([0, maxY]);
        this.yScale.domain([minY, maxY]);

    }

    updateTextAxis = function(visData,xAttribute,yAttribute,allAtributes){
        this.matSvg.select(".xAxisG")
        .call(d3.axisBottom(this.xScale))
            .selectAll("text")
            .style("text-anchor", "end")
            // .style("font-size", "5px")
            // .attr("dx", "-1")
            // .attr("dy", "20")
            .attr("transform", " translate(-10) rotate(-65)" );

        this.matSvg.select(".xAxisG")
        .call(d3.axisBottom(this.xScale))
            .selectAll(".axisText").remove("*");

        this.matSvg.select(".xAxisG")
            .call(g => g.append("text")
                .attr("class", "axisText")
                .attr("x", this.width - this.margin.right)
                .attr("y", -4)
                .attr("text-anchor", "end")
                .attr("fill", "currentColor")
                .text(xAttribute)
                )
            .transition().duration(this.transitionDuration)
        ;
        this.matSvg.select(".yAxisG")
            .call(g => g.append("text")
                .attr("x", 4)
                .attr("text-anchor", "start")
                .attr("fill", "currentColor")
                .text(yAttribute))
            .transition().duration(this.transitionDuration)
            .call(d3.axisLeft(this.yScale))
            .call(g => g.select(".domain").remove());
        ;

    }



    renderHist = function (visData, allAtributes, controllerMethods){
        // build the size scale from the data
        // const minVal =
        // const maxValo =
        // this.scale1.domain([minVal, maxVal])
        // console.log(visData);
        
        if(!(allAtributes === undefined || allAtributes.length == 0))
            {            
                this.matSel
                .selectAll("option")
                .data(allAtributes)
                .enter()
                .append("option")
                .text(function(d) {
                    return d;
                  })
                  .attr("value", function(d) {
                    return d;
                  });
                
            }
    
        
        d3.select(this.el)
        .select(".dd")
        .on("change", (event,itemData)=>{
            // controllerMethods.handleOnChangeOfSelection(d3.select(this.el).select(".dd").property("value"));
            this.selectedAttribute = d3.select(this.el).select(".dd").property("value");
            console.log("event: ", event, "itemData: ", itemData, "prop: ", d3.select(this.el).select(".dd").property("value"));
            this.renderHist(visData,allAtributes,controllerMethods);
            
        })
        
        if(this.selectedAttribute=="") {return;}

        const ara = visData.map( x => { return x[this.selectedAttribute]; }).sort();
        const counts = {};
        for (const num of ara) {
            counts[num] = counts[num] ? counts[num] + 1 : 1;
        }
        var result = Object.entries(counts);
        result = Object.fromEntries(result);
        var visDataN = Object.entries(result).map(([key, value]) => ({[this.selectedAttribute] : key, Count : value}));
        console.log(visDataN);

        
        this.updateAxis(visDataN,this.selectedAttribute,this.yAttribute, allAtributes);
        this.updateTextAxis(visDataN,this.selectedAttribute,this.yAttribute, allAtributes);

        this.matSvg.selectAll(".barG")
            // all elements with the class .cellG (empty the first time)
            .data(visDataN,(itemData)=>itemData[this.selectedAttribute])
            .join(
                enter=>{
                    // all data items to add:
                    // doesn’exist in the select but exist in the new array
                    const itemG=enter.append("g")
                        .attr("class","barG")
                        // .attr("stroke", "steelblue")
                    ;
                    // render element as child of each element "g"
                    itemG.append("rect")
                    // ...
                        .attr("class","barRect")
                        // .attr("r",this.circleRadius)
                        // .attr("stroke","steelblue")
                        .attr("fill", "steelblue")
                        .attr("x", (d) => this.xScale(d[this.selectedAttribute]))
                        .attr("y", (d) => this.yScale(d[this.yAttribute]))
                        .attr("height", (d) => this.yScale(0) - this.yScale(d[this.yAttribute]))
                        .attr("width", this.xScale.bandwidth())

                    ;
                },
                update=>{
                    console.log("update: ", update);
                    update.select(".barRect")
                    .attr("x", (d) => this.xScale(d[this.selectedAttribute]))
                    .attr("y", (d) => this.yScale(d[this.yAttribute]))
                    .attr("height", (d) => this.yScale(0) - this.yScale(d[this.yAttribute]))
                    .attr("width", this.xScale.bandwidth())
                    ;
                },
                exit =>{
                    exit.remove()
                    ;
                }

            )

            this.matSvg.call(this.zoom, this.width, this.height, this.xScale, this.selectedAttribute);
            this.matSvg.select(".xAxisG").raise();
            this.matSvg.select(".yAxisG").raise();
    
    }

    clear = function(){
        d3.select(this.el).selectAll("*").remove();
    }
}
export default HistD3;

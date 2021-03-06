var SVGWidth = 1160;  // width of whole SVG object
var SVGHeight = 500;  // height of whole SVG object
var SidebarWidth = 270;  // width of sidebar displaying current temp & heating / cooling

var mode = 0;
var isDrag = 1;
var n = 0;

var margin = {top: 20, right: 40, bottom: 80, left: 60},
width = SVGWidth - SidebarWidth - margin.left - margin.right,
height = SVGHeight - margin.top - margin.bottom;

var parse = d3.time.format("%Y-%m-%d %H:%M:%S").parse,
format = d3.time.format("%a %H:%M"),
number = d3.format("f");

var zoom = d3.behavior.zoom()
.scaleExtent([1, 5])
.on("zoom", zoomed);

var drag = d3.behavior.drag()
//.origin(function(d) { return d; })
.on("dragstart", dragstarted)
.on("drag", dragged)
.on("dragend", dragended);

var svg = d3.select("body").select("#svg")
.append("g")
.attr("transform", "translate(" + margin.left + "," + margin.right + ")")
.on("click", added)      // adds a new dot?
.call(zoom);

// Maybe this's popup time & temp display?
var div = d3.select("body").append("div")
.attr("class", "tooltip")
.style("opacity", 1e-6);



var defs = svg.append("defs");

defs.append('svg:linearGradient')
.attr('x1', "0%").attr('y1', "100%").attr('x2', "0%").attr('y2', "0%")
.attr('id', 'gradient').call(
                             function (gradient) {
                             gradient.append('svg:stop').attr('offset', '0%').attr('style', 'stop-color:rgb(0,23,153);stop-opacity:.7');
                             gradient.append('svg:stop').attr('offset', '10%').attr('style', 'stop-color:rgb(1,27,236);stop-opacity:.7');
                             gradient.append('svg:stop').attr('offset', '20%').attr('style', 'stop-color:rgb(0,56,255);stop-opacity:.7');
                             gradient.append('svg:stop').attr('offset', '30%').attr('style', 'stop-color:rgb(0,84,255);stop-opacity:.7');
                             gradient.append('svg:stop').attr('offset', '40%').attr('style', 'stop-color:rgb(0,160,254);stop-opacity:.7');
                             gradient.append('svg:stop').attr('offset', '45%').attr('style', 'stop-color:rgb(0,208,255);stop-opacity:.7');
                             gradient.append('svg:stop').attr('offset', '50%').attr('style', 'stop-color:rgb(158,255,100);stop-opacity:.7');
                             gradient.append('svg:stop').attr('offset', '60%').attr('style', 'stop-color:rgb(255,229,49);stop-opacity:.7');
                             gradient.append('svg:stop').attr('offset', '75%').attr('style', 'stop-color:rgb(255,102,0);stop-opacity:.7');
                             gradient.append('svg:stop').attr('offset', '85%').attr('style', 'stop-color:rgb(214,19,0);stop-opacity:.7');
                             gradient.append('svg:stop').attr('offset', '100%').attr('style', 'stop-color:rgb(30,30,30);stop-opacity:.7');
                             });


var clip = svg
.append("clipPath")
.attr("id", "clip")
.append("rect")
.attr("width", width)
.attr("height", height);


//actually drawing rainbow box:
var rect = svg.append("rect")
.attr("width", width)
.attr("height", height)
.style("fill", "url(#gradient)")
.style("pointer-events", "all");

var container = svg.append("g");

// Set scales for time & temp axes:
var d1 = new Date(2013, 10, 27, 5, 30, 0, 0);
var d2 = new Date(2013, 10, 27, 5, 31, 0, 0);   // This's only a one-minute time span!
var x = d3.time.scale().domain([d1,d2]).range([0, width]),
y = d3.scale.linear().domain([40, 90]).range([height, 0]);


// Set number of ticks on axes:
var xAxis = d3.svg.axis().scale(x).orient("bottom").ticks(10),  // was ticks(d3.time.hour, 3),
yAxis = d3.svg.axis().scale(y).orient("left").ticks(10);



//make grid lines
container.append("g")
.attr("class", "x axis")
.selectAll("line")
.data(d3.range(0, width, 65.9 ))  // 65.9 makes a grid line every 5 sec for 1 min timespan.
.enter().append("line")
.attr("x1", function(d) { return d; })
.attr("y1", 0)
.attr("x2", function(d) { return d; })
.attr("y2", height);

container.append("g")
.attr("class", "y axis")
.selectAll("line")
.data(d3.range(0, height, 40 ))  // 40 makes a grid line every 5°F.
.enter().append("line")
.attr("x1", 0)
.attr("y1", function(d) { return d; })
.attr("x2", width)
.attr("y2", function(d) { return d; });
//done making grid lines



// Start the graph with some stock datapoints?
var initGraph = function() {
    d3.tsv("http://www.juandejoya.com/test.tsv", dottype, function(error, dots) {
           dot = container.append("g")
           .attr("clip-path", "url(#clip)")
           .attr("class", "dots")
           .selectAll("circle")
           .data(dots);
           
           dot.enter().append("g")
           .attr("class", "dot")
           .append("circle")
           .attr("r", 5)
           .attr("cx", function(d) {
                 console.log(parse(d.date + " " + d.time));
                 return x(parse(d.date + " " + d.time)); })
           .attr("cy", function(d) {
                 //console.log(d.temp);
                 return y(d.temp); })
           .on("click", removed)
           .on("mouseover", mouseover)
           .on("mousemove", mousemove)
           .on("mouseout", mouseout)
           .call(drag);
           
           });
}


function dottype(d) {
    d.x = +d.x;
    d.y = +d.y;
    return d;
}

function zoomed() {
    if (mode == 5) {
        rect.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
        container.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
    }
}






// Add a dot where the user clicks, and record them in "TimeTempData" array:
var TimeTempData = [];

function added() {
    if (isDrag == 0) {
        
        var coords = d3.mouse(this);
        var dot = container.select(".dots")
        .append("g")
        .attr("id", function() {
              tmp = n;
              n += 1;
              return tmp;})
        .attr("cursor", "pointer")
        .on("mouseover", mouseover)
        .on("mousemove", mousemove)
        .on("mouseout", mouseout)
        .on("click", removed)
        .call(drag);
        
        dot.append("circle")
        .attr("r", 15)
        .attr("cx", function(d) { return coords[0]; })
        .attr("cy", function(d) { return coords[1]; });
        
        //done adding a dot
        dot.append("text")
        .attr("class", "txt")
        .attr("dx", 12)
        .attr("dy", ".35em")
        .attr("x", function(d) { return coords[0] - 23; })
        .attr("y", function(d) { return coords[1]; })
        .attr("font-weight","Bold")
        .attr('fill', '#fff')
        .text(function(d) { return Math.round(y.invert(coords[1]) ) })
        .attr("text-anchor", "start")
        .style('font-family', 'Arial');
        
        //to pull time, temp from x,y pixel values:
        var TransformedCoords =
        [x.invert(coords[0]), y.invert(coords[1])];
        //   [x.invert(coords[0]), y.invert(coords[1])];
        TimeTempData.push(TransformedCoords);
    } else {
        isDrag = 0;
    }
}

function removed() {
    if (d3.event.shiftKey) {
        d3.select(this).remove();
    }
}

function dragstarted(d) {
    isDrag = 1;
    d3.event.sourceEvent.stopPropagation();
    d3.select(this).selectAll("*").classed("dragging", true);
}

function dragged(d) {
    //console.log(d3.event.x);
    //console.log(d3.event.y);
    
    if (d3.event.y >= 0 && d3.event.y <= 395
        && d3.event.x >= 0 && d3.event.x <= 790) {
        d3.select(this).selectAll("circle")
        .attr("cx", function() { return d3.event.x; })
        .attr("cy", function() { return d3.event.y; });
        d3.select(this).selectAll("text")
        .attr("x", function() { return d3.event.x - 23; })
        .attr("y", function() { return d3.event.y; });
    }
}

function dragended(d) {
    d3.select(this).selectAll("*").classed("dragging", false);
}


// stuff that wasn't in previous version; what does it do?
function mouseover() {
    d3.select(this).select("circle").attr("fill", "red");
}

function mousemove() {
    //d3.select(this).select("circle")
    var x0 = x.invert(d3.mouse(this)[0]);
    var y0 = y.invert(d3.mouse(this)[1]);
    var centery = d3.select(this).select("circle").attr("cy");
    console.log(centery);
    console.log(d3.event.y);
    //if ((d3.event.y - centery) > 100) {//&& (centery - d3.event.y) > -90) {
    d3.select(this).selectAll("text").text(number(y0));
    //}
}

function mouseout() {
    d3.select(this).select("circle").attr("fill", "#000");
}


//done deleting dot / moving dot

// Create X Axis name label
container.append("text")
.attr("class", "x label")
.attr("text-anchor", "end")
.attr("x", width/2 + margin.left + 50)
.attr("y", height + 55)
.text("Time (Months/Years)");

// Create Y Axis name label
container.append("text")
.attr("class", "y label")
.attr("text-anchor", "end")
.attr("y", -margin.left)
.attr("x", -115)
.attr("dy", ".75em")
.attr("transform", "rotate(-90)")
.text("Temperature (ºF)");


svg.append("g").attr("class", "x axis")
.attr("transform", "translate(" + 0 + "," + height + ")")
.call(xAxis);
svg.append("g").attr("class", "y axis")
.call(yAxis);



initGraph();
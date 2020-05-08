$(document).ready(function() {

  // set the dimensions and margins of the graph
  var bar_margin = {top: 20, right: 30, bottom: 40, left: 90},
      width = 300 - bar_margin.left - bar_margin.right,
      height = 120 - bar_margin.top - bar_margin.bottom;

  function make_barch(data, svg) {
    var biggest_bar = data[0].count;

    // Add X axis
    var x = d3.scaleLinear()
      .domain([0, biggest_bar])
      .range([ 0, width]);

    svg.append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x).ticks(8))
      .selectAll("text")
        .attr("transform", "translate(-10,0)rotate(-45)")
        .style("text-anchor", "end");

    // Y axis
    var y = d3.scaleBand()
      .range([ 0, height ])
      .domain(data.map(function(d) { return d.artist; }))
      .padding(.1);

    svg.append("g")
      .call(d3.axisLeft(y))

    //Bars
    svg.selectAll("myRect")
      .data(data)
      .enter()
      .append("rect")
      .attr("x", x(0) )
      .attr("y", function(d) { return y(d.artist); })
      .attr("width", function(d) { return x(d.count); })
      .attr("height", y.bandwidth() )
      .attr("fill", "#8525e5")
  }

  function add_barch(datum) {
    // based on https://www.d3-graph-gallery.com/graph/barplot_horizontal.html

    // append the svg object to the body of the page
    var svg = d3.select("#my_dataviz")
      .append("svg")
        .attr("width", width + bar_margin.left + bar_margin.right)
        .attr("height", height + bar_margin.top + bar_margin.bottom)
      .append("g")
        .attr("transform",
              "translate(" + bar_margin.left + "," + bar_margin.top + ")");

    make_barch(datum.freqs, svg);
  }

  $("#myBtn").click(function(){
    var text_input = $("#myInput").val();
    console.log('1');
    $.getJSON($SCRIPT_ROOT + '/_get_top5s', {
        words: text_input
    }, function(myfreqs) {
      console.log('2');
      $.getJSON($SCRIPT_ROOT + '/_get_histos', {
          words: text_input
      }, function(histos) {
        console.log('3');
        $.getJSON($SCRIPT_ROOT + '/_get_neighbors', {
            words: text_input
        }, function(neighbors) {
          console.log('4');
          for (var i=0; i < histos.length; i++) {
            $('#my_dataviz').append('<br/><span>' + histos[i].word + '</span><br/>');
            if (myfreqs[i].freqs.length > 0) {
              add_barch(myfreqs[i]);
              if (i < histos.length) {
                add_histo(histos[i].histo);
              }
              if (i < neighbors.length) {
                add_nns(neighbors[i]);
              }
            } else {
              $('#my_dataviz').append('<span style="color:red">no data</span><br/>');
            }
          }
        });
      });
    });
  });

  function add_histo(data) {
    // adapted from https://www.d3-graph-gallery.com/graph/line_cursor.html

    var xMin = 1973;
    var xMax = 2020;
    var yMin = 99999999;
    var yMax = 0;
    console.log(data);
    for (var i=0; i<data.length; i++) {
      count = data[i].count;
      if (count < yMin) {
        yMin = count;
      }
      if (count > yMax) {
        yMax = count;
      }
    }

    // set the dimensions and margins of the graph
    var margin = {top: 20, right: 130, bottom: 40, left: 60},
        width = 400 - margin.left - margin.right,
        height = 120 - margin.top - margin.bottom;

    // append the svg object to the body of the page
    var svg = d3.select("#my_dataviz")
      .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform",
              "translate(" + margin.left + "," + margin.top + ")");

    //Read the data
    function run() {

      // Add X axis --> it is a date format
      var x = d3.scaleLinear()
        .domain([xMin, xMax])
        .range([ 0, width ]);
      svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x)
          .tickFormat(d3.format("d"))
          .ticks(6));

      // Add Y axis
      var y = d3.scaleLinear()
        .domain([yMin, yMax])
        .range([ height, 0 ]);
      svg.append("g")
        .call(d3.axisLeft(y)
        .ticks(4));

      // This allows to find the closest X index of the mouse:
      var bisect = d3.bisector(function(d) { return d.year; }).left;

      // Create the circle that travels along the curve of chart
      var focus = svg
        .append('g')
        .append('circle')
          .style("fill", "none")
          .attr("stroke", "black")
          .attr('r', 8.5)
          .style("opacity", 0)

      // Create the text that travels along the curve of chart
      var focusText = svg
        .append('g')
        .append('text')
          .style("opacity", 0)
          .attr("text-anchor", "left")
          .attr("alignment-baseline", "middle")

      // Add the line
      svg
        .append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", "#4e3864")
        .attr("stroke-width", 1.5)
        .attr("d", d3.line()
          .x(function(d) { return x(d.year) })
          .y(function(d) { return y(d.count) })
          )

      // Create a rect on top of the svg area: this rectangle recovers mouse position
      svg
        .append('rect')
        .style("fill", "none")
        .style("pointer-events", "all")
        .attr('width', width)
        .attr('height', height)
        .on('mouseover', mouseover)
        .on('mousemove', mousemove)
        .on('mouseout', mouseout);


      // What happens when the mouse move -> show the annotations at the right positions.
      function mouseover() {
        focus.style("opacity", 1)
        focusText.style("opacity",1)
      }

      function mousemove() {
        // recover coordinate we need
        var x0 = x.invert(d3.mouse(this)[0]);
        var i = bisect(data, x0, 1);
        selectedData = data[i]
        focus
          .attr("cx", x(selectedData.year))
          .attr("cy", y(selectedData.count))
        focusText
          .html(selectedData.year + ": " + selectedData.count + " uses")
          .attr("x", x(selectedData.year)+15)
          .attr("y", y(selectedData.count))
        }
      function mouseout() {
        focus.style("opacity", 0)
        focusText.style("opacity", 0)
      }
    }
    run();

  }

  function add_nns(nn_data) {
    //  nn_data: {
    //      query: {word, x, y, z}
    //      neighbors: [
    //          {word, x, y, z}
    //      ]
    //  }
    //https://bl.ocks.org/Niekes/1c15016ae5b5f11508f92852057136b5
    var origin = [100, 70], j = 10, scale = 8, scatter = [], xLine = [], yLine = [],
      zLine = [], beta = 0, alpha = 0, key = function(d){ return d.id; },
      startAngle = Math.PI/4, h=140, w = 250;
    var svg    = d3.select('#my_dataviz').append('svg')
      .attr("width", w)
      .attr("height", h)
      .call(d3.drag().on('drag',
      dragged).on('start', dragStart).on('end', dragEnd)).append('g');
    var color  = d3.scaleOrdinal(d3.schemeCategory20);
    var mx, my, mouseX, mouseY;

     var borderPath = svg.append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("height", h)
      .attr("width", w)
      .style("stroke", "black")
      .style("fill", "none")
      .style("stroke-width", 0.3);

    nn_data.neighbors = nn_data.neighbors.slice(0,7);

    // center data around target word
    for (var i=0; i < nn_data.neighbors.length; i++) {
      nn_data.neighbors[i].x -= nn_data.query.x;
      nn_data.neighbors[i].y -= nn_data.query.y;
      nn_data.neighbors[i].z -= nn_data.query.z;
    }

    var mag_max = 0;
    for (var i=0; i < nn_data.neighbors.length; i++) {
      var pt = nn_data.neighbors[i];
      var magnitude = Math.sqrt(pt.x ** 2 + pt.y ** 2 + pt.z ** 2);
      if (magnitude > mag_max) {
        mag_max = magnitude;
      }
    }

    scale = 100 / mag_max;

    var point3d = d3._3d()
        .x(function(d){ return d.x; })
        .y(function(d){ return d.y; })
        .z(function(d){ return d.z; })
        .origin(origin)
        .rotateY( startAngle)
        .rotateX(-startAngle)
        .scale(scale);

    var yScale3d = d3._3d()
        .shape('LINE_STRIP')
        .origin(origin)
        .rotateY( startAngle)
        .rotateX(-startAngle)
        .scale(scale);

    function processData(data, tt){

        /* ----------- POINTS ----------- */

        var points = svg.selectAll('circle').data(data[0], key);

        var pointSize = function(d) {
          return 4 + d.rotated.z / 12;
        }

        points
            .enter()
            .append('circle')
            .attr('class', '_3d')
            .attr('opacity', 0)
            .attr('cx', posPointX)
            .attr('cy', posPointY)
            .merge(points)
            .transition().duration(tt)
            .attr('r', function(d) { return pointSize(d) + "px" })
            .attr('fill', function(d) {if (d.id == 'point_0') {return '#8525e5'}
                else {return '#4e3864'}})
            .attr('opacity', 0.7)
            .attr('cx', posPointX)
            .attr('cy', posPointY);

        points.exit().remove();

        /* ----------- POINT TEXT ----------- */

        var pointText = svg.selectAll('g.pointText').data(data[0]);

        pointText.enter()
          .append("g")
            .attr('class', '_3d pointText')
        .merge(pointText)
          .attr('transform', function(d) {return 'translate(' + d.projected.x +', '
            + d.projected.y + ')'}).selectAll("*").remove();

        pointText.append("text")
            .attr("dx", function(d) { return pointSize(d) * 1.2 + "px" })
            .attr("dy", function(d) { return pointSize(d) * 1.2 + "px" })
            .attr('class', 'shadow')
          .text(function(d) {return d.label})
            .attr("font-size", function(d){ return pointSize(d) * 3 + "px"});

        pointText.append("text")
            .attr("dx", function(d) { return pointSize(d) * 1.2 + "px" })
            .attr("dy", function(d) { return pointSize(d) * 1.2 + "px" })
          .text(function(d) {return d.label})
            .attr("font-size", function(d){ return pointSize(d) * 3 + "px"});

        pointText.exit().remove();


        /* ----------- x-Scale ----------- */

        var xScale = svg.selectAll('path.xScale').data(data[1]);

        xScale
            .enter()
            .append('path')
            .attr('class', '_3d xScale')
            .merge(xScale)
            .attr('stroke', 'red')
            .attr('stroke-width', 0.75)
            .attr('opacity', 0.75)
            .attr('d', yScale3d.draw);

        xScale.exit().remove();

        /* ----------- y-Scale ----------- */

        var yScale = svg.selectAll('path.yScale').data(data[2]);

        yScale
            .enter()
            .append('path')
            .attr('class', '_3d yScale')
            .merge(yScale)
            .attr('stroke', 'green')
            .attr('stroke-width', 0.75)
            .attr('opacity', 0.75)
            .attr('d', yScale3d.draw);

        yScale.exit().remove();

        /* ----------- z-Scale ----------- */

        var zScale = svg.selectAll('path.zScale').data(data[3]);

        zScale
            .enter()
            .append('path')
            .attr('class', '_3d zScale')
            .merge(zScale)
            .attr('stroke', 'blue')
            .attr('stroke-width', 0.75)
            .attr('opacity', 0.75)
            .attr('d', yScale3d.draw);

        zScale.exit().remove();

        svg.selectAll('._3d').sort(d3._3d().sort);
    }

    function posPointX(d){
        return d.projected.x;
    }

    function posPointY(d){
        return d.projected.y;
    }

    function init(){
        var cnt = 0;
        scatter = [], yLine = [];

        scatter.push({
          x: 0,
          y: 0,
          z: 0,
          label: nn_data.query.word,
          id: 'point_0'});

        for (var i=0; i < nn_data.neighbors.length; i++) {
            scatter.push(
               {x: nn_data.neighbors[i].x,
                y: nn_data.neighbors[i].y,
                z: nn_data.neighbors[i].z,
                label: nn_data.neighbors[i].word,
                id: 'point_' + (i + 1)});
        }

        xLine = [[0,0,0], [j,0,0]];
        yLine = [[0,0,0], [0,-j,0]];
        zLine = [[0,0,0], [0,0,j]];

        var data = [
            point3d(scatter),
            yScale3d([xLine]),
            yScale3d([yLine]),
            yScale3d([zLine]),
        ];

        processData(data, 1000);
        processData(data, 1000);
        // text wasn't appearing until dragged, so added this extra rotate
        point3d.rotateY(startAngle).rotateX(startAngle)(scatter);
    }

    function dragStart(){
        mx = d3.event.x;
        my = d3.event.y;
    }

    function dragged(){
        mouseX = mouseX || 0;
        mouseY = mouseY || 0;
        beta   = (d3.event.x - mx + mouseX) * Math.PI / 230 ;
        alpha  = (d3.event.y - my + mouseY) * Math.PI / 230  * (-1);
        var data = [
            point3d.rotateY(beta + startAngle).rotateX(alpha - startAngle)(scatter),
            yScale3d.rotateY(beta + startAngle).rotateX(alpha - startAngle)([xLine]),
            yScale3d.rotateY(beta + startAngle).rotateX(alpha - startAngle)([yLine]),
            yScale3d.rotateY(beta + startAngle).rotateX(alpha - startAngle)([zLine]),
        ];
        processData(data, 0);
    }

    function dragEnd(){
        mouseX = d3.event.x - mx + mouseX;
        mouseY = d3.event.y - my + mouseY;
    }

    init();
  }
})

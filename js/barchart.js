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
      .attr("fill", "#69b3a2")
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


  $.getJSON('good_freqs.json', function(myfreqs) {
    $.getJSON('good_histos.json', function(histos) {
      for (var i=0; i < histos.length; i++) {
        $('#my_dataviz').append('<br/><span>' + histos[i].word + '</span><br/>');
        add_barch(myfreqs[i]);
        if (i < histos.length) {
          add_histo(histos[i].histo);
        }
      }
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
      console.log(count);
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
        .attr("stroke", "steelblue")
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

})

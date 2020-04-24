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
      .call(d3.axisBottom(x))
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

    $('#my_dataviz').append('<br/><span>' + datum.word + '</span><br/>');

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

  $.getJSON('some_word_freqs.json', function(myfreqs) {

    for (var i=0; i < myfreqs.length; i++) {
      add_barch(myfreqs[i]);
    }
  });


  function make_histo() {

    // Set the dimensions of the canvas / graph
    var margin = {top: 30, right: 20, bottom: 30, left: 50},
        width = 600 - margin.left - margin.right,
        height = 270 - margin.top - margin.bottom;

    // Parse the date / time
    var parseDate = d3.time.format("%d-%b-%y").parse,
        formatDate = d3.time.format("%d-%b"),
        bisectDate = d3.bisector(function(d) { return d.date; }).left;

    // Set the ranges
    var x = d3.time.scale().range([0, width]);
    var y = d3.scale.linear().range([height, 0]);

    // Define the axes
    var xAxis = d3.svg.axis().scale(x)
        .orient("bottom").ticks(5);

    var yAxis = d3.svg.axis().scale(y)
        .orient("left").ticks(5);

    // Define the line
    var valueline = d3.svg.line()
        .x(function(d) { return x(d.date); })
        .y(function(d) { return y(d.close); });

    // Adds the svg canvas
    var svg = d3.select("body")
        .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
        .append("g")
            .attr("transform",
                  "translate(" + margin.left + "," + margin.top + ")");

    var lineSvg = svg.append("g");

    var focus = svg.append("g")
        .style("display", "none");

    // Get the data
    d3.csv("atad.csv", function(error, data) {
        data.forEach(function(d) {
            d.date = parseDate(d.date);
            d.close = +d.close;
        });

        // Scale the range of the data
        x.domain(d3.extent(data, function(d) { return d.date; }));
        y.domain([0, d3.max(data, function(d) { return d.close; })]);

        // Add the valueline path.
        lineSvg.append("path")
            .attr("class", "line")
            .attr("d", valueline(data));

        // Add the X Axis
        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);

        // Add the Y Axis
        svg.append("g")
            .attr("class", "y axis")
            .call(yAxis);

       // append the x line
        focus.append("line")
            .attr("class", "x")
            .style("stroke", "blue")
            .style("stroke-dasharray", "3,3")
            .style("opacity", 0.5)
            .attr("y1", 0)
            .attr("y2", height);

        // append the y line
        focus.append("line")
            .attr("class", "y")
            .style("stroke", "blue")
            .style("stroke-dasharray", "3,3")
            .style("opacity", 0.5)
            .attr("x1", width)
            .attr("x2", width);

        // append the circle at the intersection
        focus.append("circle")
            .attr("class", "y")
            .style("fill", "none")
            .style("stroke", "blue")
            .attr("r", 4);

        // place the value at the intersection
        focus.append("text")
            .attr("class", "y1")
            .style("stroke", "white")
            .style("stroke-width", "3.5px")
            .style("opacity", 0.8)
            .attr("dx", 8)
            .attr("dy", "-.3em");
        focus.append("text")
            .attr("class", "y2")
            .attr("dx", 8)
            .attr("dy", "-.3em");

        // place the date at the intersection
        focus.append("text")
            .attr("class", "y3")
            .style("stroke", "white")
            .style("stroke-width", "3.5px")
            .style("opacity", 0.8)
            .attr("dx", 8)
            .attr("dy", "1em");
        focus.append("text")
            .attr("class", "y4")
            .attr("dx", 8)
            .attr("dy", "1em");

        // append the rectangle to capture mouse
        svg.append("rect")
            .attr("width", width)
            .attr("height", height)
            .style("fill", "none")
            .style("pointer-events", "all")
            .on("mouseover", function() { focus.style("display", null); })
            .on("mouseout", function() { focus.style("display", "none"); })
            .on("mousemove", mousemove);

        function mousemove() {
        var x0 = x.invert(d3.mouse(this)[0]),
            i = bisectDate(data, x0, 1),
            d0 = data[i - 1],
            d1 = data[i],
            d = x0 - d0.date > d1.date - x0 ? d1 : d0;

        focus.select("circle.y")
            .attr("transform",
                  "translate(" + x(d.date) + "," +
                                 y(d.close) + ")");

        focus.select("text.y1")
            .attr("transform",
                  "translate(" + x(d.date) + "," +
                                 y(d.close) + ")")
            .text(d.close);

        focus.select("text.y2")
            .attr("transform",
                  "translate(" + x(d.date) + "," +
                                 y(d.close) + ")")
            .text(d.close);

        focus.select("text.y3")
            .attr("transform",
                  "translate(" + x(d.date) + "," +
                                 y(d.close) + ")")
            .text(formatDate(d.date));

        focus.select("text.y4")
            .attr("transform",
                  "translate(" + x(d.date) + "," +
                                 y(d.close) + ")")
            .text(formatDate(d.date));

        focus.select(".x")
            .attr("transform",
                  "translate(" + x(d.date) + "," +
                                 y(d.close) + ")")
                       .attr("y2", height - y(d.close));

        focus.select(".y")
            .attr("transform",
                  "translate(" + width * -1 + "," +
                                 y(d.close) + ")")
                       .attr("x2", width + width);
      }

    });
  };

})

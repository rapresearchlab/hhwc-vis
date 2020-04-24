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
    };
  });
})

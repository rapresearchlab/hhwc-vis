$(document).ready(function() {

  /*
   * Global state of mouse cursor, re whether it is currently dragging, or
   * hovering over, any instance of the Nearest Neighbors visualization.
   * Update function changes the cursor style accordingly.
   */
  var cursorStatus = {
    hovering: false,
    dragging: false,
  }
  var cursorUpdate = function(cursorStatus) {
    if (cursorStatus.dragging) {
      $('html,body').css('cursor','grabbing');
    } else if (cursorStatus.hovering) {
      $('html,body').css('cursor','grab');
    } else {
      $('html,body').css('cursor','auto');
    }
  }

  /*
   * Testing code; fetches JSON from server for query words from html form;
   * calls visualization functions, lays them out on-screen in a basic way.
   */
  $("#myBtn").click(function(){
    var text_input = $("#words_query").val();
    var num_nns_input = $("#num_nns_query").val();
    if ($.trim(text_input) !== '') {
      console.log('1');
      $.getJSON($SCRIPT_ROOT + '/_get_top5s', {
          words: text_input
      }, function(top_users_lists) {
        console.log('2');
        $.getJSON($SCRIPT_ROOT + '/_get_histories', {
            words: text_input
        }, function(histories) {
          console.log('3');
          $.getJSON($SCRIPT_ROOT + '/_get_neighbors', {
              words: text_input,
              num_nns: num_nns_input
          }, function(neighbors) {
            console.log('4');
            for (var i=0; i < histories.length; i++) {
              $('#my_dataviz').append('<br/><span>' + histories[i].word + '</span><br/>');
              if (top_users_lists[i].top_users.length > 0) {
                add_top_users(top_users_lists[i].top_users, histories[i].word, {'width': 300, 'height': 130});
                if (i < histories.length) {
                  add_word_history(histories[i].history, {'width': 400, 'height': 120});
                }
                if (i < neighbors.length) {
                  add_nns(neighbors[i], {'width': 250, 'height': 140}, cursorStatus, 200);
                }
              } else {
                $('#my_dataviz').append('<span style="color:red">no data</span><br/>');
              }
            }
          });
        });
      });
    }
  });

  /**
   * Create bar chart of top users of a word, and how many times each uses it.
   * Add to #my_dataviz div.
   *
   * params:
   *    data: [{artist: string, count: int}]
   *        list of artists, and their usage counts for word
   *    queryWord: string
   *        the original query that 'data' pertains to
   *    size: int
   *        size of viz in pixels.  includes margins
   */
  function add_top_users(data, queryWord, size) {
    // set the dimensions and margins of the graph

    var bottom_scale = d3.scaleLinear().domain([120, 160]).range([60, 70]);
    bottom_scale.clamp(true);
    var bottom_margin = bottom_scale(size.height);
    var left_scale = d3.scaleLinear().domain([90, 160]).range([75, 130]);
    left_scale.clamp(true);
    var left_margin = left_scale(size.height);
    var font_scale = d3.scaleLinear().domain([90, 160]).range([8, 14]);
    font_scale.clamp(true);
    var font_points = font_scale(size.height);

    var margin = {top: 10, right: 30, bottom: bottom_margin, left: left_margin},
        width = size.width - margin.left - margin.right,
        height = size.height - margin.top - margin.bottom;

    // append the svg object to the body of the page
    var svg = d3.select("#my_dataviz")
      .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform",
              "translate(" + margin.left + "," + margin.top + ")");

    // Add X axis
    var biggest_bar = data[0].count;
    var x = d3.scaleLinear()
      .domain([0, biggest_bar])
      .range([ 0, width]);

    svg.append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x).ticks(8))
      .selectAll("text")
        .attr("transform", "translate(-10,0)rotate(-45)")
        .attr("font-size", font_points + "px")
        .style("text-anchor", "end");

    // Y axis scale
    var y = d3.scaleBand()
      .range([ 0, height ])
      .domain(data.map(function(d) { return d.artist; }))
      .padding(.1);

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
        .on("mouseover", mouseover)
        .on("mouseout", mouseout)

    // draw Y axis (after bars so they don't overlap it
    svg.append("g")
      .call(d3.axisLeft(y))
        .attr("font-size", font_points + "px")

    var detailTextZone = svg.append("foreignObject")
        .attr('transform', 'translate(' + (-margin.left)  + ',' +
          (height + margin.top + 20) + ')')
        .attr('width', size.width)
        .attr('height', 30); // does this actually add up correctly

    var detailText = detailTextZone.append('xhtml:div')
        .style('font-size', font_points + 'px')

    // What happens when the mouse move -> show the annotations at the right positions.
    function mouseover(d) {
      console.log('hi');
      detailText
        .style("opacity", 1)
        .html(d.artist + " says \"" + queryWord + "\" " + d.count + " times in " + d.numSongs + " songs");
      d3.select(this)
        .style('fill', '#4e3864')
    }

    function mouseout(d) {
      detailText
        .style("opacity", 0)
        .html("");
      d3.select(this)
        .style('fill', '#8525e5')
    }
  }

  /**
   * Create line chart of word-usage-over-time data.  Append to #my_dataviz div.
   *
   * params:
   *    data: [{year: int, count: int}]
   *        year, and number of times word was used that year
   *    size: int
   *        size of vizualisation in pixels.  includes margins.
   */
  function add_word_history(data, size) {
    // adapted from https://www.d3-graph-gallery.com/graph/line_cursor.html

    var right_scale = d3.scaleLinear().domain([80, 160]).range([100, 180]);
    right_scale.clamp(true);
    var right_margin = right_scale(size.height);
    var font_scale = d3.scaleLinear().domain([90, 160]).range([8, 14]);
    font_scale.clamp(true);
    var font_points = font_scale(size.height);


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
    var margin = {top: 20, right: right_margin, bottom: 40, left: 60},
        width = size.width - margin.left - margin.right,
        height = size.height - margin.top - margin.bottom;

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
          .ticks(6))
        .attr("font-size", font_points + "px");

      // Add Y axis
      var y = d3.scaleLinear()
        .domain([yMin, yMax])
        .range([ height, 0 ]);
      svg.append("g")
        .call(d3.axisLeft(y)
        .ticks(4))
      .attr("font-size", font_points + "px");

      // This allows to find the closest X index of the mouse:
      var bisect = d3.bisector(function(d) { return d.year; }).left;

      // Create the circle that travels along the curve of chart
      var focus = svg
        .append('g')
        .append('circle')
          .style("fill", "none")
          .attr("stroke", "black")
          .attr('r', 4)
          .style("opacity", 0)

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

      // White drop shadow for focusText
      // (also must be drawn after the data line to work)
      var focusTextShadow = svg
        .append('g')
        .append('text')
            .attr('class', 'shadow')
          .style("opacity", 0)
          .attr("font-size", (font_points + 2) + "px")
          .attr("text-anchor", "left")
          .attr("alignment-baseline", "middle")

      // Create the text that travels along the curve of chart
      var focusText = svg
        .append('g')
        .append('text')
          .style("opacity", 0)
          .attr("font-size", (font_points + 2) + "px")
          .attr("text-anchor", "left")
          .attr("alignment-baseline", "middle")

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
        focusTextShadow.style("opacity",1)
        focusText.style("opacity",1)
      }

      function mousemove() {
        // recover coordinate we need
        var x0 = x.invert(d3.mouse(this)[0]);
        // add a coord for nothing so bisector can see lowest year point
        var dataWithBounds = [{year: data[0].year - 1, count: 0}].concat(data);
        // '-1' due to prepended point on dataWithBounds
        var i = bisect(dataWithBounds, x0, 1) - 1;
        // bisect can return one point beyond the range
        if (i >= data.length) {
          i = data.length - 1;
        }
        selectedData = data[i]
        focus
          .attr("cx", x(selectedData.year))
          .attr("cy", y(selectedData.count))
        focusTextShadow
          .html(selectedData.year + ": " + selectedData.count + " uses")
          .attr("x", x(selectedData.year)+11.5)
          .attr("y", y(selectedData.count))
        focusText
          .html(selectedData.year + ": " + selectedData.count + " uses")
          .attr("x", x(selectedData.year)+11.5)
          .attr("y", y(selectedData.count))
        }
      function mouseout() {
        focus.style("opacity", 0)
        focusText.style("opacity", 0)
        focusTextShadow.style("opacity", 0)
      }
    }
    run();

  }

  /**
   * Add 3d visualization of word and nearest neighbors.  Append to
   * #my_dataviz div.
   *
   * params:
   *    nn_data:
   *        {query: {word, x, y, z}
   *            neighbors [
   *                {word, x, y, z}
   *            ]
   *        }
   *    size: {width: int, height: int}
   *        size of viz in pixels.  this one has no built-in margins,
   *        as there are no ticks, numbers etc outside the bounding box.
   *    cursorStatus: {hovering: boolean, dragging: boolean}
   *        global mouse state vis-a-vis any instance of NN viz.
   *    numBackgroundDots: int
   *        number of random gray background dots rendered
   */
  function add_nns(nn_data, size, cursorStatus, numBackgroundDots) {
    // adapted from https://bl.ocks.org/Niekes/1c15016ae5b5f11508f92852057136b5
    var j = 10, scale = 8, scatter = [], xLine = [], yLine = [],
      zLine = [], beta = 0, alpha = 0, key = function(d){ return d.id; },
      startAngle = Math.PI/4, h=size.height, w = size.width, backgroundDots = [];
    var origin = [w * 0.4, h/2];
    var svg    = d3.select('#my_dataviz').append('svg')
      .attr('class', 'nnsContainer')
      .attr("width", w)
      .attr("height", h)
        .on("mouseover", hoverStart)
        .on("mouseout", hoverEnd)
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

    // center origin at target word or centroid of points
    var center;
    if ($('#nns_origin_at').val() == 'centroid') {
      center = {};
      for (const dim of ['x', 'y', 'z']) {
        sum = nn_data.query[dim];
        for (const nn of nn_data.neighbors) {
          sum += nn[dim];
        }
        center[dim] = sum / (nn_data.neighbors.length + 1);
      }
    } else {
      center = {'x': nn_data.query.x, 'y': nn_data.query.y, 'z': nn_data.query.z};
    }
    for (const dim of ['x', 'y', 'z']) {
      nn_data.query[dim] -= center[dim];
      for (var i=0; i < nn_data.neighbors.length; i++) {
        nn_data.neighbors[i][dim] -= center[dim];
      }
    }

    // scale zoom level for size of viz, and range of data
    var query_magnitude = Math.sqrt(nn_data.query.x ** 2 +
              nn_data.query.y ** 2 + nn_data.query.z ** 2);
    var mag_max = query_magnitude;
    for (var i=0; i < nn_data.neighbors.length; i++) {
      var pt = nn_data.neighbors[i];
      var magnitude = Math.sqrt(pt.x ** 2 + pt.y ** 2 + pt.z ** 2);
      if (magnitude > mag_max) {
        mag_max = magnitude;
      }
    }
    var zoom_scale = d3.scaleLinear().domain([100, 300]).range([50, 150])
    scale = zoom_scale(h) / mag_max;

    // scale dots & labels for size of viz and distance from camera
    var minFontScale = d3.scaleLinear().domain([80, 160]).range([7, 10]);
    minFontScale.clamp(true);
    var maxFontScale = d3.scaleLinear().domain([80, 208]).range([11, 19]);
    maxFontScale.clamp(true);
    var zToFont = d3.scaleLinear().domain([-mag_max, mag_max])
        .range([minFontScale(h), maxFontScale(h)]);
    // 100 is just arbitrary high val, we just need to clamp min size
    var positive = d3.scaleLinear().domain([0.5, 100]).range([0.5, 100])
    positive.clamp(true);
    var fontSize = function(d) {
      return positive(zToFont(d.rotated.z));
    }
    var pointSize = function(d) {
      return fontSize(d) / 3;
    }

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

        var points = svg.selectAll('circle.main').data(data[0], key);

        points
            .enter()
            .append('circle')
            .attr('class', '_3d main')
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

        /* ----------- GRAY BG POINTS ----------- */

        var pointsBG = svg.selectAll('circle.bg').data(data[4], key);

        pointsBG
            .enter()
            .append('circle')
            .attr('class', '_3d bg')
            .attr('opacity', 0)
            .attr('cx', posPointX)
            .attr('cy', posPointY)
            .merge(pointsBG)
            .transition().duration(tt)
            .attr('r', function(d) { return pointSize(d) + "px" })
            .attr('fill', '#4e3864')
            // disappear the points if they're closer than origin
            .attr('opacity', function(d)
                {if (d.rotated.z < 0) {return 0.25} else {return 0}})
            .attr('cx', posPointX)
            .attr('cy', posPointY);

        pointsBG.exit().remove();

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
            .attr("font-size", function(d){ return fontSize(d) + "px"});

        pointText.append("text")
            .attr("dx", function(d) { return pointSize(d) * 1.2 + "px" })
            .attr("dy", function(d) { return pointSize(d) * 1.2 + "px" })
          .text(function(d) {return d.label})
            .attr("font-size", function(d){ return fontSize(d) + "px"});

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
            .attr('opacity', 0.5)
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
            .attr('opacity', 0.5)
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
            .attr('opacity', 0.5)
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
          x: nn_data.query.x,
          y: nn_data.query.y,
          z: nn_data.query.z,
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

        backgroundDots = [];
        function backgroundDotRange() {
          return (Math.random() * mag_max * 2 - mag_max) * 4;
        }
        for (var i=0; i < numBackgroundDots; i++) {
          backgroundDots.push(
            {x: backgroundDotRange(),
              y: backgroundDotRange(),
              z: backgroundDotRange()
            })
        }

        xLine = [[0,0,0], [j,0,0]];
        yLine = [[0,0,0], [0,-j,0]];
        zLine = [[0,0,0], [0,0,j]];

        var data = [
            point3d(scatter),
            yScale3d([xLine]),
            yScale3d([yLine]),
            yScale3d([zLine]),
            point3d(backgroundDots)
        ];

        processData(data, 1000);
        processData(data, 1000);
        // text wasn't appearing until dragged, so added this extra rotate
        point3d.rotateY(startAngle).rotateX(startAngle)(scatter);
    }

    function hoverStart(){
      cursorStatus.hovering = true;
      cursorUpdate(cursorStatus);
    }

    function hoverEnd(){
      cursorStatus.hovering = false;
      cursorUpdate(cursorStatus);
    }

    function dragStart(){
        mx = d3.event.x;
        my = d3.event.y;
        cursorStatus.dragging = true;
      cursorUpdate(cursorStatus);
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
            point3d.rotateY(beta + startAngle).rotateX(alpha - startAngle)(backgroundDots)
        ];
        processData(data, 0);
    }

    function dragEnd(){
        mouseX = d3.event.x - mx + mouseX;
        mouseY = d3.event.y - my + mouseY;
        cursorStatus.dragging = false;
      cursorUpdate(cursorStatus);
    }

    init();
  }
})

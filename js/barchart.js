function make_bar_chart(data) {
  var size = 200;
  var longest_bar = data[0].count;

  const div = d3.create("div")
      .style("font", "10px sans-serif")
      .style("text-align", "right")
      .style("color", "white");

  div.selectAll("div")
    .data(data)
    .join("div")
      .style("background", "steelblue")
      .style("padding", "3px")
      .style("margin", "1px")
      .style("width", d => `${d.count * 300 / longest_bar}px`)
      .text(d => d.artist);

  return div.node();
}

$(document).ready(function() {
  var barch;
  $.getJSON('some_word_freqs.json', function(json) {
    some_freqs = json;

    for (var i=0; i < some_freqs.length; i++) {
      title = document.createElement("p");
      title.innerHTML = some_freqs[i].word;
      document.body.appendChild(title);
      barch = make_bar_chart(some_freqs[i].freqs);
      document.body.appendChild( barch); 
    };
  });
})

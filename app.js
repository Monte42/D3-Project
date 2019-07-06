////////////////////////////
//  collect and format data
///////////////////////////
d3.queue()
  .defer(d3.json, "https://d3js.org/us-10m.v1.json")
  .defer(d3.csv, 'gunControlData2.csv', function(row){
    return {
      state: row.State,
      stateId: +row.ID,
      year: +row.Year,
      population: +row.Population,
      laws: +row.Laws,
      deaths: +row.Deaths,
      rate: +row.Rate,
      violent: +row.Violent,
      murder: +row.Murder,
      rape: +row.Rape,
      robbery: +row.Robbery,
      assault: +row.assault,
      vandalism: +row.Vandalism,
      burglary: +row.Burglary,
      larceny: +row.Larceny,
      gta: +row.GTA,
      totalCrimes: +row.Violent + +row.Murder + +row.Rape + +row.assault + +row.Vandalism + +row.Burglary + +row.Larceny + +row.GTA,
      lawPerCrime: (+row.Violent + +row.Murder + +row.Rape + +row.assault + +row.Vandalism + +row.Burglary + +row.Larceny + +row.GTA) / +row.Laws
    }
  })
  .await(function(err, mapData, projData){
    if (err) throw err;
///////////////////
// global varibles
//////////////////
    var geoData = topojson.feature(mapData, mapData.objects.states).features;
    var minYear = d3.min(projData, d => d.year)
    var height = 400;
    var width = 700;
    var path = d3.geoPath()
    var val = d3.select('#dataSelect').property('value');
    var data = projData.filter(d => d.stateId === +this.id);
    var barPadding = 1;
    var padding = 2;
//// MAP setup
    d3.select('#map')
          .attr('width', width)
          .attr('height', height)
      .append("g")
        .attr("class", "states")
        .attr('transform', 'scale(0.5)')
      .selectAll("path")
      .data(geoData)
      .enter()
      .append("path")
        .classed('state', true)
        .attr('id', d => d.id)
        .attr("d", path)
//// Pie set up
    d3.select('#pie')
          .attr('width', width)
          .attr('height', height)
        .append('g')
          .attr('transform',`translate(${width/2},${height/2})`)
          .classed('chart', true)
//// barGraph set up
    var xScale = d3.scaleLinear()
                   .domain([0,d3.max(data, d => d[val])])
                   .range([padding, width/2 - padding])

    var histogram = d3.histogram()
                      .domain(xScale.domain())
                      .thresholds(xScale.ticks())
                      .value(d => d[val])

    var bins = histogram(data)

    var yScale = d3.scaleLinear()
                   .domain([0, d3.max(bins, d => d.length)])
                   .range([height, 0])

    d3.select('#bar')
          .attr('width', width)
          .attr('height', height)
      .selectAll('.bar')
      .data(bins)
      .enter()
      .append('g')
        .classed('bar', true);
      .append('rect')
        .attr('x',d => xScale(d.x0))
        .attr('y',d => yScale(d.length)/10)
        .attr('height',d => height - yScale(d.length)/10)
        .attr('width',d => (xScale(d.x1)-xScale(d.x0)-barPadding*5)/2)
        .attr('fill','green')
//// Reconstructing the orignial graphs
    buildMap(minYear,d3.select('#dataSelect').property('value'))

    d3.select('#yearSelect')
        .property('min', minYear)
        .property('max', d3.max(projData, d => d.year))
        .property('val', minYear)
        .on('input', function(){
          year = +d3.event.target.value
          var val = d3.select('#dataSelect').property('value')
          buildMap(year,val)
        })

    d3.select('#dataSelect')
      .on('change',d => buildMap(+d3.select('#yearSelect').property('value'), d3.event.target.value))

    d3.selectAll('.state')
      .on('click', function(){

        bars
         .exit()
         .remove()

        var g = bars
                  .enter()
                  .append('g')
                    .classed('bar', true);

        g.append('rect')

        g.merge(bars)
            .attr('x',d => xScale(d.x0))
            .attr('y',d => yScale(d.length)/10)
            .attr('height',d => height - yScale(d.length)/10)
            .attr('width',d => (xScale(d.x1)-xScale(d.x0)-barPadding*5)/2)
            .attr('fill','green')
      })


    function buildMap(year,val){
      var currentYear = projData.filter(d => d.year === year)

      currentYear.forEach(row => {
        var states = geoData.filter(d => +d.id === row.stateId);
        states.forEach(state => state.properties = row)
      })

      var mapScale = d3.scaleLinear()
                       .domain(d3.extent(currentYear, d => d[val]))
                       .range(['green','red'])

      d3.selectAll('.state')
        .transition()
        .duration(750)
        .ease(d3.easeBackIn)
        .attr('fill', d => mapScale(d.properties[val]));

      var arcs = d3.pie()
                   .value(d => d[val])
                   .sort(function(a,b){
                     if (a[val]<b[val]) return -1;
                     else if (a[val]>b[val]) return 1;
                   })
                   (currentYear);

      var colorScale = d3.scaleOrdinal()
                         .domain(currentYear)
                         .range(d3.schemeCategory20);
      var path = d3.arc()
                   .outerRadius(height/2)
                   .innerRadius(0)
                   .padAngle(0.02)
                   .cornerRadius(20)

      var pUpdate = d3.select('.chart')
                      .selectAll('.arc')
                      .data(arcs)
      pUpdate
        .exit()
        .remove()

      pUpdate
        .enter()
        .append('path')
          .classed('arc', true)
        .merge(pUpdate)
          .transition()
          .duration(750)
          .ease(d3.easeBackIn)
          .attr('fill', d => colorScale(d.data[val]))
          .attr('stroke', 'black')
          .attr('d', path)
    }
  })

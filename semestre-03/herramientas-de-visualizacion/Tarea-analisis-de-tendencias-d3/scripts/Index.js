function load_graph_expected_production() {
    const graph = d3.select("#graph-expected-production")
    const tooltip = d3.select("#tooltip")
    const power_station = d3.select("#power-station")
    const monitored_cap = d3.select("#monitored-cap")
    const btnAnimation = d3.select("#btnAnimation")

    const margins = { left: 75, top: 40, right: 10, bottom: 50 }
    const totalWidth = +graph.style("width").slice(0, -2)
    const totalHeight = (totalWidth * 9) / 16
    const width = totalWidth - margins.left - margins.right
    const height = totalHeight - margins.top - margins.bottom

    const svg = graph
        .append("svg")
        .attr("width", totalWidth)
        .attr("height", totalHeight)
        .attr("class", "fig")

    const g = svg
        .append("g")
        .attr("transform", `translate(${margins.left}, ${margins.top})`)

    const clip = g
        .append("clipPath")
        .attr("id", "clip")
        .append("rect")
        .attr("width", width)
        .attr("height", height)

    const year = g
        .append("text")
        .attr("x", ancho / 2)
        .attr("y", alto / 2)
        .attr("class", "year")

    const month = g
        .append("text")
        .attr("x", ancho / 2)
        .attr("y", alto / 2)
        .attr("class", "month")

    g.append("rect")
        .attr("x", "0")
        .attr("y", "0")
        .attr("width", ancho)
        .attr("height", alto)
        .attr("class", "grupo")

    const x = d3.scaleLog().range([0, ancho])
    const y = d3.scaleLinear().range([alto, 0])
    const A = d3.scaleLinear().range([20, 70600])
    const continent = d3.scaleOrdinal().range(d3.schemeSet2)

    const xAxis = d3.axisBottom(x).tickSize(-alto)
    const yAxis = d3.axisLeft(y).tickSize(-ancho)

    var iy, miny, maxy
    var animando = false
    var intervalo
    var pais
}

function init() {
    load_graph_expected_production()
}

init()
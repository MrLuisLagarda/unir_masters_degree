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
    .attr("x", width / 2)
    .attr("y", height / 2)
    .attr("class", "year")

g.append("rect")
    .attr("x", "0")
    .attr("y", "0")
    .attr("width", width)
    .attr("height", height)
    .attr("class", "grupo")

const x = d3.scaleLinear().range([0, width])
const y = d3.scaleLinear().range([height, 0])
const A = d3.scaleLinear().range([20, 70600])
const continent = d3.scaleOrdinal().range(d3.schemeSet2)

const xAxis = d3.axisBottom(x).tickSize(-height)
const yAxis = d3.axisLeft(y).tickSize(-width)

var parseTime = d3.timeParse('%d/%M/%Y')

var iy, miny, maxy
var animating = false
var interval
var v_power_station

const load = async () => {
    data = await d3.csv(
        "https://raw.githubusercontent.com/MrLuisLagarda/unir_masters_degree/main/semestre-03/herramientas-de-visualizacion/Tarea-analisis-de-tendencias-d3/data/PowerGeneration.csv",
        //d3.autoType
        function(d) {
            return {
                dates: d.dates,
                power_station: d.power_station,
                monitored_cap: d.monitored_cap,
                expected: d.expected,
                actual: d.actual
            }
        }
    )
    data = d3.filter(data, (d) => d.actual != null && d.expected != null)

    x.domain(d3.extent(data, (d) => d.actual))
    y.domain(d3.extent(data, (d) => d.expected))
    A.domain(d3.extent(data, (d) => d.monitored_cap))
    continent.domain(Array.from(new Set(data.map((d) => d.power_station))))

    console.log(data)
    miny = d3.min(data, (d) => moment(d.dates, 'M/D/yyyy'))
    maxy = d3.max(data, (d) => moment(d.dates, 'M/D/yyyy'))
    iy = moment(miny).format('M/D/yyyy')
    console.log(iy)
    g.append("g")
        .attr("transform", `translate(0, ${height})`)
        .attr("class", "ejes")
        .call(xAxis)
    g.append("g").attr("class", "ejes").call(yAxis)

    g.append("text")
        .attr("x", (width / 2)-75)
        .attr("y", height + 40)
        .attr("text-widthr", "middle")
        .attr("class", "labels")
        .text("Actual Energy Generated (MU)")

    g.append("g")
        .attr("transform", `translate(-40, ${(height / 2)+135})`)
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("text-widthr", "middle")
        .attr("class", "labels")
        .text("Expected Energy To Generate (MU)")

    render(data)
}

const render = (data) => {
    console.log(iy)
    const newData = d3.filter(data, (d) => d.dates == iy)

    const circle = g.selectAll("circle").data(newData, (d) => d.power_station)
    
    circle
        .enter()
        .append("circle")
        .attr("fill", "#00FF0088")
        .attr("stroke", "#00000088")
        .attr("clip-path", "url(#clip)")
        .attr("cx", (d) => x(d.actual))
        .attr("cy", (d) => y(d.expected))
        .attr("r", 0)
        .on("click", (_, d) => showTooltip(d))
        // .on("mouseout", () => hideTooltip())
        .merge(circle)
        .transition()
        .duration(250)
        .attr("cx", (d) => x(d.actual))
        .attr("cy", (d) => y(d.expected))
        .attr("r", (d) => Math.sqrt((A(d.monitored_cap) /2 )/ Math.PI))
        .attr("fill", (d) => continent(d.power_station) + "88")

    circle
        .exit()
        .transition()
        .duration(250)
        .attr("r", 0)
        .attr("fill", "#ff000088")
        .remove()

    year.text(moment(iy).format('DD/MMM/yyyy'))

    d = newData.filter((d) => d.power_station == v_power_station)[0]
    if (d != null) {
        tooltip.style("left", x(d.actual) + "px").style("top", y(d.expected) + "px")
        power_station.text(d.power_station)
        monitored_cap.text(d.monitored_cap)
    }
}

const showTooltip = (d) => {
    v_power_station = d.power_station

    tooltip
        .style("left", x(d.actual) + "px")
        .style("top", y(d.expected) + "px")
        .style("display", "block")
    power_station.text(d.power_station)
    monitored_cap.text(d.monitored_cap)
}

const hideTooltip = () => {
    tooltip.style("display", "none")
}

const delta = (d) => {
    //iy += d
    iy = moment(iy, 'M/D/yyyy').add(d, 'd').format('M/D/yyyy')
    if (moment(iy, 'M/D/yyyy') > maxy) {
        clearInterval(interval)
        animating = false
        btnAnimation
            .classed("btn-success", true)
            .classed("btn-danger", false)
            .html("<i class='fas fa-play'></i>")
        iy = moment(maxy).format('M/D/yyyy')
    }
    else if (moment(iy, 'M/D/yyyy') < miny) {
        iy = moment(miny).format('M/D/yyyy')
    }

    render(data)
}

const toggleAnimation = () => {
    animating = !animating
    if (animating) {
        btnAnimation
            .classed("btn-success", false)
            .classed("btn-danger", true)
            .html("<i class='fas fa-pause'></i>")

        interval = setInterval(() => delta(1), 50)
    } else {
        btnAnimation
            .classed("btn-success", true)
            .classed("btn-danger", false)
            .html("<i class='fas fa-play'></i>")

        clearInterval(interval)
    }
}



function init() {
    load()
}

init()

const luis_graph = d3.select("#graph-expected-production")
const luis_tooltip = d3.select("#luis-tooltip")
const luis_power_station = d3.select("#luis-power-station")
const luis_monitored_cap = d3.select("#luis-monitored-cap")
const luis_btnAnimation = d3.select("#luis-btnAnimation")

const luis_margins = { left: 75, top: 40, right: 10, bottom: 50 }
const luis_totalWidth = +luis_graph.style("width").slice(0, -2)
const luis_totalHeight = (luis_totalWidth * 9) / 16
const luis_width = luis_totalWidth - luis_margins.left - luis_margins.right
const luis_height = luis_totalHeight - luis_margins.top - luis_margins.bottom

const luis_svg = luis_graph
    .append("svg")
    .attr("width", luis_totalWidth)
    .attr("height", luis_totalHeight)
    .attr("class", "bg-figure")

const luis_g = luis_svg
    .append("g")
    .attr("transform", `translate(${luis_margins.left}, ${luis_margins.top})`)

const luis_clip = luis_g
    .append("clipPath")
    .attr("id", "clip")
    .append("rect")
    .attr("width", luis_width)
    .attr("height", luis_height)

const luis_year = luis_g
    .append("text")
    .attr("x", luis_width / 2)
    .attr("y", luis_height / 2)
    .attr("class", "bg-date-text")

luis_g.append("rect")
    .attr("x", "0")
    .attr("y", "0")
    .attr("width", luis_width)
    .attr("height", luis_height)
    .attr("class", "grp")

const luis_x = d3.scaleLinear().range([0, luis_width])
const luis_y = d3.scaleLinear().range([luis_height, 0])
const luis_A = d3.scaleLinear().range([20, 70600])
const luis_continent = d3.scaleOrdinal().range(d3.schemeSet2)

const luis_xAxis = d3.axisBottom(luis_x).tickSize(-luis_height)
const luis_yAxis = d3.axisLeft(luis_y).tickSize(-luis_width)

var luis_parseTime = d3.timeParse('%d/%M/%Y')

var luis_iy, luis_miny, luis_maxy
var luis_animating = false
var luis_interval
var luis_v_power_station

const luis_load = async () => {
    luis_data = await d3.csv(
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
    luis_data = d3.filter(luis_data, (d) => d.actual != null && d.expected != null)

    luis_x.domain(d3.extent(luis_data, (d) => d.actual))
    luis_y.domain(d3.extent(luis_data, (d) => d.expected))
    luis_A.domain(d3.extent(luis_data, (d) => d.monitored_cap))
    luis_continent.domain(Array.from(new Set(luis_data.map((d) => d.power_station))))

    luis_miny = d3.min(luis_data, (d) => moment(d.dates, 'M/D/yyyy'))
    luis_maxy = d3.max(luis_data, (d) => moment(d.dates, 'M/D/yyyy'))
    luis_iy = moment(luis_miny).format('M/D/yyyy')
    
    luis_g.append("g")
        .attr("transform", `translate(0, ${luis_height})`)
        .attr("class", "axis")
        .call(luis_xAxis)
    luis_g.append("g").attr("class", "axis").call(luis_yAxis)

    luis_g.append("text")
        .attr("x", (luis_width / 2)-75)
        .attr("y", luis_height + 40)
        .attr("text-widthr", "middle")
        .attr("class", "labels")
        .text("Energía Generada (MU)")

    luis_g.append("g")
        .attr("transform", `translate(-40, ${(luis_height / 2)+135})`)
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("text-widthr", "middle")
        .attr("class", "labels")
        .text("Energía que se Planeó Generar (MU)")

    luis_render(luis_data)
}

const luis_render = (luis_data) => {
    
    const luis_newData = d3.filter(luis_data, (d) => d.dates == luis_iy)

    const luis_circle = luis_g.selectAll("circle").data(luis_newData, (d) => d.power_station)
    
    luis_circle
        .enter()
        .append("circle")
        .attr("fill", "#00FF0088")
        .attr("stroke", "#00000088")
        .attr("clip-path", "url(#clip)")
        .attr("cx", (d) => luis_x(d.actual))
        .attr("cy", (d) => luis_y(d.expected))
        .attr("r", 0)
        .on("click", (_, d) => luis_showTooltip(d))
        .merge(luis_circle)
        .transition()
        .duration(250)
        .attr("cx", (d) => luis_x(d.actual))
        .attr("cy", (d) => luis_y(d.expected))
        .attr("r", (d) => Math.sqrt((luis_A(d.monitored_cap) /2 )/ Math.PI))
        .attr("fill", (d) => luis_continent(d.power_station) + "88")

    luis_circle
        .exit()
        .transition()
        .duration(250)
        .attr("r", 0)
        .attr("fill", "#ff000088")
        .remove()

    luis_year.text(moment(luis_iy).format('DD/MMM/yyyy'))

    luis_d = luis_newData.filter((d) => d.power_station == luis_v_power_station)[0]
    if (luis_d != null) {
        luis_tooltip.style("left", x(d.actual) + "px").style("top", y(d.expected) + "px")
        luis_power_station.text(d.power_station)
        luis_monitored_cap.text(d.monitored_cap)
    }
}

const luis_showTooltip = (d) => {
    luis_v_power_station = d.power_station

    luis_tooltip
        .style("left", luis_x(d.actual) + "px")
        .style("top", luis_y(d.expected) + "px")
        .style("display", "block")
    luis_power_station.text(d.power_station)
    luis_monitored_cap.text(d.monitored_cap)
}

const luis_hideTooltip = () => {
    luis_tooltip.style("display", "none")
}

const luis_delta = (d) => {
    luis_iy = moment(luis_iy, 'M/D/yyyy').add(d, 'd').format('M/D/yyyy')
    if (moment(luis_iy, 'M/D/yyyy') > luis_maxy) {
        clearInterval(luis_interval)
        luis_animating = false
        luis_btnAnimation
            .classed("btn-success", true)
            .classed("btn-danger", false)
            .html("<i class='fas fa-play'></i>")
        luis_iy = moment(luis_maxy).format('M/D/yyyy')
    }
    else if (moment(luis_iy, 'M/D/yyyy') < luis_miny) {
        luis_iy = moment(luis_miny).format('M/D/yyyy')
    }

    luis_render(luis_data)
}

const luis_toggleAnimation = () => {
    luis_animating = !luis_animating
    if (luis_animating) {
        luis_btnAnimation
            .classed("btn-success", false)
            .classed("btn-danger", true)
            .html("<i class='fas fa-pause'></i>")

        luis_interval = setInterval(() => luis_delta(1), 50)
    } else {
        luis_btnAnimation
            .classed("btn-success", true)
            .classed("btn-danger", false)
            .html("<i class='fas fa-play'></i>")

        clearInterval(luis_interval)
    }
}

function luis_init() {
    luis_load()
}

luis_init()
/******************************************************************* 
 * 
 *  Luis
 * 
 ******************************************************************/

//Variable global para descargar la data una sola vez
var global_data = null;

//Variables  estaticas en codigo html
const luis_graph = d3.select("#graph-expected-production")
const luis_tooltip = d3.select("#luis-tooltip")                 
const luis_power_station = d3.select("#luis-power-station")     
const luis_monitored_cap = d3.select("#luis-monitored-cap")   
const luis_btnAnimation = d3.select("#luis-btnAnimation")

//Variables para definir las dimensiones de la grafica
const luis_margins = { left: 75, top: 50, right: 10, bottom: 50 }
const luis_totalWidth = +luis_graph.style("width").slice(0, -2)
const luis_totalHeight = (luis_totalWidth * 9) / 16
const luis_width = luis_totalWidth - luis_margins.left - luis_margins.right
const luis_height = luis_totalHeight - luis_margins.top - luis_margins.bottom

//Creacion del SVG
const luis_svg = luis_graph
    .append("svg")
    .attr("width", luis_totalWidth)
    .attr("height", luis_totalHeight)
    .attr("class", "bg-figure")

//Creando grupo
const luis_group = luis_svg
    .append("g")
    .attr("transform", `translate(${luis_margins.left}, ${luis_margins.top})`)

//Mascara para elementos que salgan del rectangulo
const luis_clip = luis_group
    .append("clipPath")
    .attr("id", "clip")
    .append("rect")
    .attr("width", luis_width)
    .attr("height", luis_height)

//Texto con la fecha de fondo
const luis_date = luis_group
    .append("text")
    .attr("x", luis_width / 2)
    .attr("y", luis_height / 2)
    .attr("class", "bg-date-text")

//Rectangulo
luis_group.append("rect")
    .attr("x", "0")
    .attr("y", "0")
    .attr("width", luis_width)
    .attr("height", luis_height)
    .attr("class", "grp")

//Definiendo rangos y colores
const luis_x = d3.scaleLinear().range([0, luis_width])
const luis_y = d3.scaleLinear().range([luis_height, 0])
const luis_A = d3.scaleLinear().range([20, 22000])
const luis_continent = d3.scaleOrdinal().range(d3.schemeSet2)
const luis_xAxis = d3.axisBottom(luis_x).tickSize(-luis_height)
const luis_yAxis = d3.axisLeft(luis_y).tickSize(-luis_width)
//Variables para la transicion de la animacion. Definen la fecha actual, la minima y maxima
var luis_iy, luis_miny, luis_maxy
var luis_animating = false
var luis_interval
var luis_v_power_station

//Carga de la data para la grafica y renderizado de la misma
const luis_load = async () => {
    luis_data = global_data;//await d3.csv("./data/PowerGeneration.csv", d3.autoType)
    
    //Ignorando registros donde ambos valores sean nulos
    luis_data = d3.filter(luis_data, (d) => d.actual != null && d.expected != null)

    //Asignando variables a los ejes y al radio del circulo
    luis_x.domain(d3.extent(luis_data, (d) => d.actual))
    luis_y.domain(d3.extent(luis_data, (d) => d.expected))
    luis_A.domain(d3.extent(luis_data, (d) => d.monitored_cap))
    luis_continent.domain(Array.from(new Set(luis_data.map((d) => d.power_station))))

    //Definiendo valores minimos y maximos. la fecha que incrementa iniciara en el valor minimo
    luis_miny = d3.min(luis_data, (d) => moment(d.dates, 'M/D/yyyy'))
    luis_maxy = d3.max(luis_data, (d) => moment(d.dates, 'M/D/yyyy'))
    luis_iy = moment(luis_miny).format('M/D/yyyy')
    
    //Añadiendo ejes y textos a la grafica
    luis_group.append("g")
        .attr("transform", `translate(0, ${luis_height})`)
        .attr("class", "luis_axis")
        .call(luis_xAxis)
    luis_group.append("g").attr("class", "luis_axis").call(luis_yAxis)

    luis_group.append("text")
        .attr("x", (luis_width / 2)-75)
        .attr("y", luis_height + 40)
        .attr("text-widthr", "middle")
        .attr("class", "labels")
        .text("Energía Generada (MU)")

    luis_group.append("text")
        .attr("x", (luis_width / 2)-260)
        .attr("y", -20)
        .attr("text-widthr", "middle")
        .attr("class", "labels")
        .text("Energía Planeada VS Generada en el Paso del Tiempo")

    luis_group.append("g")
        .attr("transform", `translate(-40, ${(luis_height / 2)+135})`)
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("text-widthr", "middle")
        .attr("class", "labels")
        .text("Energía que se Planeó Generar (MU)")

    luis_render(luis_data)
}

//Renderizado de las figuras(circulos). filtra la data que se tiene en base a la fecha actual (luis_iy)
const luis_render = (luis_data) => {
    
    const luis_newData = d3.filter(luis_data, (d) => d.dates == luis_iy)
    const luis_circle = luis_group.selectAll("circle").data(luis_newData, (d) => d.power_station)
    
    //Despliege del circulo comenzando con radio 0, con una animacion simple para que llege a su radio real
    //Se dividio entre 2 la formula del radio ya que los circulos llegaban a ser muy grandes
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

    //Despliegue de la fecha actual. Se utiliza moment.js para facilitar el manejo de fechas
    luis_date.text(moment(luis_iy).format('DD/MMM/yyyy'))

    //Si se tiene alguna planta de energia ya seleccionada, se escriben los valores correspondientes
    //en los label. Simula una actualizacion de valores con forme avanza la animacion
    luis_d = luis_newData.filter((d) => d.power_station == luis_v_power_station)[0]
    if (luis_d != null) {
        luis_tooltip.style("left", x(d.actual) + "px").style("top", y(d.expected) + "px")
        luis_power_station.text(d.power_station)
        luis_monitored_cap.text(d.monitored_cap)
    }
}

//Constante para mostrar el tooltip al dar click
const luis_showTooltip = (d) => {
    luis_v_power_station = d.power_station
    luis_tooltip
        .style("left", luis_x(d.actual) + "px")
        .style("top", luis_y(d.expected) + "px")
        .style("display", "block")
    luis_power_station.text(d.power_station)
    luis_monitored_cap.text(d.monitored_cap)
}

//Constante para ocultar el tooltip al dar click dentro del div de tooltip
const luis_hideTooltip = () => {
    luis_tooltip.style("display", "none")
}

//constante para la animacion. Hace un incremento de 'd' dias hasta llegar al valor maximo o minimo.
//la variable de entrada puede ser positiva o negativa
const luis_delta = (d) => {
    luis_iy = moment(luis_iy, 'M/D/yyyy').add(d, 'd').format('M/D/yyyy')
    if (moment(luis_iy, 'M/D/yyyy') > luis_maxy) {
        clearInterval(luis_interval)
        luis_animating = false
        luis_btnAnimation
            .classed("btn-primary", true)
            .classed("btn-danger", false)
            .html("<i class='fas fa-play'></i>")
        luis_iy = moment(luis_maxy).format('M/D/yyyy')
    }
    else if (moment(luis_iy, 'M/D/yyyy') < luis_miny) {
        luis_iy = moment(luis_miny).format('M/D/yyyy')
    }
    luis_render(luis_data)
}

//Constante para determinar si se reproduce o detiene la animacion
const luis_toggleAnimation = () => {
    luis_animating = !luis_animating
    if (luis_animating) {
        luis_btnAnimation
            .classed("btn-primary", false)
            .classed("btn-danger", true)
            .html("<i class='fas fa-pause'></i>")
        luis_interval = setInterval(() => luis_delta(1), 50)
    } else {
        luis_btnAnimation
            .classed("btn-primary", true)
            .classed("btn-danger", false)
            .html("<i class='fas fa-play'></i>")
        clearInterval(luis_interval)
    }
}

/******************************************************************* 
 * 
 *  Roberto
 * 
 ******************************************************************/
// Selectores
const roberto_graf = d3.select("#graf")
const roberto_margins = { top: 90, right: 10, bottom: 100, left: 150 }
const roberto_anchoTotal = +roberto_graf.style("width").slice(0, -2)
const roberto_altoTotal = (roberto_anchoTotal * 9) / 16
const roberto_ancho = roberto_anchoTotal - roberto_margins.left - roberto_margins.right
const roberto_alto = roberto_altoTotal - roberto_margins.top - roberto_margins.bottom

// Variables de graficación
const roberto_svg = roberto_graf
  .append("svg")
  .attr("width", roberto_anchoTotal)
  .attr("height", roberto_altoTotal)
  .attr("class", "fig")
const roberto_g = roberto_svg
  .append("g")
  .attr("transform", `translate(${roberto_margins.left}, ${roberto_margins.top})`)

roberto_g.append("rect")
.attr("width", roberto_ancho)
.attr("height", roberto_alto)
.attr("class", "bg")

const roberto_x = d3.scaleLinear().range([0, roberto_ancho])
const roberto_y = d3.scaleLinear().range([roberto_alto, 0])

const roberto_xAxis = d3.axisBottom(roberto_x).ticks(5).tickSize(-roberto_alto)
const roberto_yAxis = d3.axisLeft(roberto_y).tickSize(-roberto_ancho)

const roberto_load = async () => {
  var data = global_data;//await d3.csv("./data/PowerGeneration.csv", d3.autoType)
  
  roberto_x.domain([0, d3.max(data, (d) => d.total_cap_under_maintenance) * 1.1])
  roberto_y.domain([0, d3.max(data, (d) => d.planned_maintenance) * 1.1])
  roberto_g.append("text")
  .attr("text-anchor", "end")
  .attr("transform", "rotate(-90)")
  .attr("y", -120)
  .attr("x", -190)
  .text("Planned Maintanence")

roberto_g.append("text")
  .attr("text-anchor", "end")
  .attr("x", 600)
  .attr("y", 600)
  .text("Total Cap Under Maintenace");  
  roberto_g.append("g")
    .attr("transform", `translate(0, ${roberto_alto})`)
    .attr("class", "axis")
    .call(roberto_xAxis)
  roberto_g.append("g").attr("class", "axis").call(roberto_yAxis)

  roberto_g.append("text")
    .attr("x", roberto_ancho / 2)
    .attr("y", -10)
    .attr("class", "titulo")
    .attr("text-anchor", "middle")
    .text("Total Cap. Under Maintenace (MW) vs. Planned Maintanence (MW)")

  roberto_render(data)
}
var color = d3.scaleOrdinal()
.domain(["TotalCapUnderMaintenace", "PlannedMaintanence" ])
.range([ "#F8766D", "#00BA38"])

function updatePlot() {

  // Get the value of the button
  xlim = this.value

  // Update X axis
  x.domain([3,xlim])
  xAxis.transition().duration(1000).call(d3.axisBottom(x))

  // Update chart
  roberto_g.selectAll("circle")
     .data(data)
     .transition()
     .duration(1000)
     .attr("cx", (d) => x(d.total_cap_under_maintenance))
     .attr("cy", (d) => y(d.planned_maintenance))
}

// Add an event listener to the button created in the html part
d3.select("#buttonXlim").on("input", updatePlot )

const roberto_render = (data) => {
  roberto_g.selectAll("circle")
    .data(data)
    .enter()
    .append("circle")
    .attr("cx", (d) => roberto_x(d.total_cap_under_maintenance))
    .attr("cy", (d) => roberto_y(d.planned_maintenance))
    .attr("r", 5)
    .attr("fill", "#00c")
    
}



























/******************************************************************* 
 * 
 *  Luis - Generalizado de data para solo descargarla una vez
 * 
 ******************************************************************/

//Funcion de inicializacion. En este caso solo hay una funcion que correr
const global_init = async() => {
    global_data = await d3.csv("./data/PowerGeneration.csv", d3.autoType)
    luis_load()
    roberto_load()
}

global_init()
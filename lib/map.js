// Code for drawing map
var height = 700,
    width  = 1000,
    centered = null,
    w_split = 500,
    h_split = 350;

var margin = {
	top: 50,
	right: 50,
	bottom: 50,
	left: 50
};

var countryCanvas = d3.select("div#div_map").append("svg")
	.attr("width", width + margin.left + margin.right)
	.attr("height", height /*+ margin.top + margin.bottom*/);

var countrySvg = countryCanvas.append("g");

var mercator = d3.geo.mercator()
	.translate([width/2, height/1.5])
	.scale(155);
var countryPath = d3.geo.path().projection(mercator);

// path for split zoom
var split_merc = d3.geo.mercator()
	.translate([w_split/2, h_split/ 1.5])
	.scale(100);
var split_path = d3.geo.path().projection(split_merc);

var countryColor;
var tip;
function draw_map() {
	var country_data = countries;

	set_shade_scale(countries);
	var a3;

	var name, exposure, country; 
	tip = d3.tip().attr("class", "d3-tip s" ).html(function(d) {
				country = countries_by_a3[d.id];
				if (country) {
					name = country.name;
					exposure = (graph_type === "combo")? country.cp : country.value;
					if (exposure < 0)
						exposure = 0;
					return "<h2>" + name + "</h2>" + "<p>Exposure: " + numeral(exposure).format('$0,0') + "</p>";
				}
				else return "<h2>No Country Data</h2>";
			});

	tip.direction('s');

	d3.json("data/countries.topo.json", function(error, data) {

		var worldMap = topojson.feature(data,data.objects.countries).features;
		countrySvg.call(tip)
			.selectAll(".country").data(worldMap).enter()
			.append("path")
			.attr("class", function(d){ return "country " + d.id; })
			.attr("d", countryPath)
			.attr("fill", function(d) {
				var v = 0;
				if(view_type === "combo")
					v = (countries_by_a3[d.id])? countries_by_a3[d.id].cp : 0;
				else
					v = (countries_by_a3[d.id] && countries_by_a3[d.id].value > 0)? countries_by_a3[d.id].value : 0;

				if (v !== 0) {
					return countryColor(v);
				} else {
					return "#C0C0C0";  // grey indicates no data
				}
			})
			.on("mouseover", tip.show)
			.on("mouseout", tip.hide)
			.on("click", function(d) {
				var country = countries_by_a3[d.id];
				var exposure = (graph_type === "combo") ? country.cp : country.value;
				if (exposure > 0) {
					set_ctry(d.id);
					add_cps(d.id);
					upd_charts(-1);
					clicked(d);
					$("#lblWarn").hide();
				}
			});
	});
}

var set_shade_scale = function(cd){
	cd = countries.filter(function(d){
		if( view_type === "combo" ){
			return d.value.cp > 0;
		}else{
			return d.value.value > 0;
		}
	});

	countryColor = d3.scale.linear()
									.domain([
										d3.min(cd, function(d) { 
										if(view_type === "combo")
											return d.value.cp;
										else
											return d.value.value; 
										}),
										d3.max(cd, function(d) { 
										if(view_type === "combo")
											return d.value.cp;
										else
											return d.value.value; 
										})
									])
									.range(["lightcyan", "navy"]);
};

var shade_map = function(){
	set_shade_scale(countries);
	d3.selectAll("path.country")
		.transition()
		.duration(750)
		.attr("fill", function(d){
			var v = 0;
				if(view_type === "combo")
					v = (countries_by_a3[d.id])? countries_by_a3[d.id].cp : 0;
				else
					v = (countries_by_a3[d.id] && countries_by_a3[d.id].value > 0)? countries_by_a3[d.id].value : 0;

				if (v !== 0) {
					return countryColor(v);
				} else {
					return "#C0C0C0";  // grey indicates no data
				}
			});
};

var ctry_selected = "";

function add_cps(ctry){
	var cps = counterparties.filter(function(d){
		if(graph_type === "combo"){
			return d.value.Country === country[ctry].A2;
		}else{
			var ctry_2 = country[ctry].A2;
			return d.value.country[ctry_2] !== undefined;
		}
	});
	$("#cp_sel").val(-1);
	$("#cp_sel").chosen().trigger("chosen:updated");

	if(ctry_selected != ctry){
		for(var i in cps){
			var c = cps[i];
			$('#cp_sel option[value="' + c.key + '"]').attr('selected', 'selected');
		}
		$("#cp_sel").chosen().trigger("chosen:updated");
		ctry_selected = ctry;
	}else{
		ctry_selected = "";
		$("#ddlCountries").val("");
	}
}

function chgWidth(w){
	d3.select(".left")
		.transition()
		.duration(1000)
		.style("width", w + "px");
	d3.select(".right")
		.transition()
		.duration(1000)
		.style("left", w + "px");
}

function clicked(d) {
  var x, y, k, w, s;

  if (d && centered !== d) {
	$("#ddlCountries").val(countries_by_a3[d.id].name);
	var cpty = counterparties.filter(function(cp){
		if(graph_type === "combo"){
			return country[cp.value.Country].A3 === d.id; }else{
			var ctry_2 = country[d.id].A2;
			return cp.value.country[ctry_2] !== undefined;
		}
	});

	d3.selectAll("#div_parallel svg g g").remove();
	displayGraph(cpty);
	d3.select("#div_tab_header table").remove();
	d3.select("#div_tab_body table").remove();
	displayTable(cpty);


    w = (width - margin.left) / 2;

    chgWidth(w);
    var centroid = countryPath.centroid(d);
    x = centroid[0];
    y = centroid[1] + 50;
    k = 1.5;
    centered = d;
  } else {
    $("#ddlCountries").val("");
    w = width;
    chgWidth(w);
    x = width / 2;
    y = height / 2;
    k = 1;
    centered = null;
  }

  countrySvg.selectAll("path")
	.style("fill", function(d) {
		if (centered && d === centered) {
			return "orange";
		}});

  countrySvg.transition()
	.duration(750)
	.attr("transform", "translate(" + w / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")")
	.style("stroke-width", 1 / k + "px");
}

// Draw Legend
var legend_data = ["navy","lightcyan","grey"];

var legend = countrySvg.selectAll("g.legend")
	.data(legend_data)
	.enter().append("g")
	.attr("class", "legend");

var symbol_height = 20, symbol_width = 20;

var legend_text = ["Maximum exposure value", "Minimum exposure value", "No data"];

legend.append("rect")
	.attr("x", 20)
	.attr("y", function(d, i) { return height - (i * symbol_height) - (2 * symbol_height); })
	.attr("width", symbol_width)
	.attr("height", symbol_height)
	.style("fill", function(d) { return d; });

legend.append("text")
	.attr("x", 50)
	.attr("y", function(d, i) { return height - (i * symbol_height) - symbol_height - 4; })
	.text(function(d, i) { return legend_text[i]; });


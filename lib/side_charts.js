var chart = {
	w: 400,
	h: 690,
	mh: 25,
	mw: 100
};

var invDivisions;
var yFields = [
	"RepoExposure",
	"GrossOTCPosExposure",
	"FuturesExposure",
	"Loan_Net"
];

var tt; // tool tip

var create_charts = function(a,b,c){
	invDivisions = b;
	for( var i in yFields ){
		add_chart(a, yFields[i]);
	}

	tt = d3.tip().attr("class", "d3-tip n")
			.html(function(d){
				
				var f = d3.select(this).attr("field");
				var v = d.value[f];
				return "<span>" + numeral(v).format('$0,0') + "</span>";
			})
			.offset([-6, 0])
			;
	tt.direction('n');

	counterparties.sort(function(a, b){
		if(a.value.CounterpartyName < b.value.CounterpartyName)
			return -1;
		else if(a.value.CounterpartyName > b.value.CounterpartyName)
			return 1;
		else
			return 0;
	});

    d3.select("#ctry_sel")
    	.on("change", function(a,b,c){
    		var cp = $(this).val();
    		upd_charts(cp);
    	})
    	.selectAll("option")
    	.data(countries.filter(function(d){
    		return d.key.length === 3;
    	}))
    	.enter()
    		.append("option")
    			.attr("value", function(d){
    				return d.key;
    			})
    			.text(function(d){
    				return d.value.name;
    			})

    d3.select("#cp_sel")
    	.on("change", function(a,b,c){
    		var cp = $(this).val();
    		upd_charts(cp);
    	})
    	.selectAll("option")
    	.data(counterparties)
    	.enter()
    		.append("option")
    			.attr("value", function(d){
    				return d.key;
    			})
    			.text(function(d){
    				return d.value.CounterpartyName;
    			})


    var new_select = function(o){
		var val = $(o).val();
		upd_charts(val);    	
    }
	$("#cp_sel").chosen({
			width: "100%"
		})
		.change(function(){
			new_select(this);
		});

	$("#ctry_sel").chosen()
		.change(function(){
			new_select(this);
		});


    d3.selectAll("#charts svg .tick text")
    	.style("font-size", "x-small");

}

// scales
var yScale = d3.scale.linear()
	.range([chart.h / yFields.length - chart.mh, chart.mh]);
var yAxis = d3.svg.axis()
	.scale(yScale)
	.orient("left");
var xScale = d3.scale.ordinal()
	.rangeRoundBands([chart.mw, chart.w], 0);

var add_chart = function(d, yField){
	var svg = d3.select(".charts")
				.append("svg")
				.attr({
		            width: chart.w,
		            height: (chart.h / yFields.length)
		        })
		        .attr("class", yField + " detail_chart")
		        ;

	var xAxis = d3.svg.axis()
		.scale(xScale)
		.orient("bottom");

	invDivisions.sort(function(a,b){
		if(a < b)
			return -1;
		else if(b < a)
			return 1;
		else
			return 0;
	})

	xScale.domain(invDivisions);
	yScale.domain([0, 100]);

	var yClass = "y" + yField;
	svg.append("g")
		.attr("class", "x axis")
        .attr("transform", "translate(0," + ((chart.h/yFields.length)-chart.mh) + ")")
        .call(xAxis);

    svg.append("g")
        .attr("class", "y axis " + yClass)
        .attr("transform", "translate(" + (chart.mw) + ",0)")
        .call(yAxis);

    svg.append("text")
        .attr("transform","translate(" + chart.mw + ",10)")
        .attr("class", "detailTitle")
        .text(exposure_fields[yField]);

    svg.append("text")
        .attr("transform","translate(" + (chart.w / 2) + "," + (chart.h / (yFields.length * 2)) + ")")
        .attr("class", "not_sel")
        .text("No Country Selected");

    svg.append("text")
        .attr("transform","translate(" + (chart.w / 3) + "," + (chart.h / (yFields.length * 2)) + ")")
        .attr("class", "no_exp")
        .text("No " + yField + " for this Counterparty")
        .style("opacity", 0);




};

// update charts with cp data
var a = 1;
var graph_type = "combo";
var set_graph_type = function(gt){
	graph_type = gt;
};

var curr_selection = -1;
var ctry;
var set_ctry = function(c){
	ctry = country[c].A2;
};
var upd_charts = function(idx){
	var data;
	var invdiv = {};
	if(idx === curr_selection)
		idx = -1;


	var idxs = (idx === -1)? $("#cp_sel").val() : [ idx ];
	
	for(var i in idxs){
		if(invdiv === undefined){
			invdiv = counterparty[idxs[i]].inv_group;
		}
		else{
			var grp = {};
			if(graph_type === "map_only"){
				grp = counterparty[idxs[i]].country[ctry].inv_group;
			}else{
				grp = counterparty[idxs[i]].inv_group;
			}
			for(var g in invDivisions){
				if(invdiv[invDivisions[g]] === undefined){
					invdiv[invDivisions[g]] = {};	
				}
				if(i == 0){
					for(var e in grp[Object.keys(grp)[0]]){
						invdiv[invDivisions[g]][e] = 0;
					}
				}
			}
			for(var g in grp){
				for(var e in grp[g]){
					if(e != "inv_group"){
						var val = grp[g][e];
						if(invdiv[g][e] === undefined)
							invdiv[g][e] = 0;
						invdiv[g][e] += val;
					}
				}
				
			}

		}
	}
	
	curr_selection = idx;
	 
	for(var i in yFields){
		var fld = yFields[i];
		var vals = [];
		vals.push(0);

		// get values
		for(var div in invDivisions){
			if(invdiv[invDivisions[div]] !== undefined){
				vals.push(invdiv[invDivisions[div]][fld]);
			}

		}
		var svg = d3.select("." + fld);
		var min_max = [0,0];
		min_max[1] = d3.max(vals);

		svg.select(".not_sel")
			.text(function(){
				return "No Country Selected";
			})
			.style("opacity", function(){
				return ($.isEmptyObject(invdiv))? 1 : 0;
			});

		svg.select(".no_exp")
			.transition()
			.duration(750)
			.style("opacity", function(){
				return(min_max[0] == 0 && min_max[1] == 0 && data != undefined)? 1 : 0;
			});


		yScale.domain(d3.extent(min_max));

		var dfg = d3.entries(invdiv);
		var data_for_graphs = [];
		for(var a in dfg){
			data_for_graphs.push(dfg[a]);
		}
		data_for_graphs.sort(function(a,b){
			if(a.key < b.key)
				return -1;
			else if(a.key > b.key)
				return 1;
			else 
				return 0;
		});

		d3.select(".y" + fld)
			.call(yAxis);
	    
	    svg.call(tt);



	    svg.selectAll(".bar")
	        .data(data_for_graphs)
	        .enter()
	            .append("rect")
	            .attr("class", "bar")
	            .attr("field", fld)
	            .attr("x", function(d){
	            	var val = xScale(d.key);
	            	var aaa = this;
	                return xScale(d.key) + 1;
	            })
	            .attr("width", chart.w / invDivisions.length - 20)
	            .style("fill", "steelblue")
	           	.on("mouseover", tt.show)
	            .on("mouseout", tt.hide);


	    var bars = svg.selectAll(".bar")
	    	.data(data_for_graphs)
	        .transition()
	        .duration(750)
	            .attr("y", function(d){
	            	var val = (invdiv[d.key] === undefined)? 0 : invdiv[d.key][fld];
	                return yScale(val);	         
	            })
	            .attr("height", function(d){
	            	var val = (invdiv[d.key] === undefined)? 0 : invdiv[d.key][fld];
	            	val = (val < 0)? 0 : val;

	                return  (chart.h / yFields.length) - chart.mh - yScale(val) ;
	            })

	            ;
	    
	    //if(data_for_graphs.length === 0){
	    	bars = svg.selectAll(".bar").data(data_for_graphs);
	    	bars

	    		.exit()
	    		.transition()

	    		.duration(750)
	    		.style("opacity", 0)
	    		.remove();
	    //}

	    d3.selectAll("#charts svg .tick text")
	    	.style("font-size", "x-small");
	}

}

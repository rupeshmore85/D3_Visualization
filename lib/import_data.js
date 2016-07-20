/*
	Imports the data
*/
var counterparty = {};
var counterparties;
var country = {};
var countries_dd = [], country_dd = {};
var counterparty = {};
var counterparties;

var country = {};
var countries_by_a3 = {};

var invdiv = {};
var invdivs = [];

var exposure_fields = {
	"RepoExposure" : "Repo Exposure",
	"GrossOTCPosExposure" : "Gross Positive OTC Exposure",
	"FuturesExposure" : "Futures Exposure",
	"Loan_Net" : "Net Loan Exposure"
};

// import the counterparties
d3.csv("data/cp_data.csv", function(error, data){


	for(var i in data){
		var cp = data[i];
		var cp_id = parse_int(cp.CounterpartyId);
		cp.EBT = parse_float(cp.EBT, null);
		cp.MktCapCur = parse_float(cp.MktCapCur, null);
		cp.MktCapPrev = parse_float(cp.MktCapPrev, null);
		cp.CounterpartyId = parse_int(cp.CounterpartyId, null);
		counterparty[cp_id] = cp;
	}

	d3.csv("data/exp_data.csv", function(error, data){
		for(var i in data){
			var exposure = data[i];
			var cp_id = parse_int(exposure.CounterpartyId, null);
			var cp = counterparty[cp_id];

			// check for blank rows
			if(exposure !== undefined && cp !== undefined)
				add_exposure_vals(cp, exposure);
		}
		for(var c in counterparty){
			var v = 0;
			for(var e in counterparty[c].exposure){
				if(e != "inv_group")
					v += counterparty[c].exposure[e];
			}
			if( v <= 0){
				delete counterparty[c];
			}else{

				for(var ct in counterparty[c].country){
					v = 0;
					for(var e in counterparty[c].country[ct]){
						if(e != "inv_group"){
							if(counterparty[c].country[ct][e] < 0)
								counterparty[c].country[ct][e] = 0;
							v += counterparty[c].country[ct][e];
						}
					}
					if( v === 0 )
						delete counterparty[c].country[ct];
				}
				

			}
		}
		counterparties = d3.entries(counterparty);

		// Need countries by Alpha-3 because topojson only has ISO Alpha-3 country codes

		d3.csv("data/countries.csv", function(error, data){
			for(var i in data){
				var ctry = data[i];
				if(country[ctry.A2] !== undefined){
					var v = country[ctry.A2].value;
					var id = country[ctry.A2].inv_group;
					var a3 = ctry.A3;
					var nme = ctry.COUNTRY;
					var ctry_cp = country[ctry.A2].cp;
					country[ctry.A2] = { A3 : a3, value : v, inv_group : id, name : nme, cp : ctry_cp };
					country[ctry.A3] = { A2 : ctry.A2, value : v, inv_group : id, name: nme, cp : ctry_cp };
					countries_by_a3[ctry.A3] = country[ctry.A2];
				}else{
					countries_by_a3[ctry.A3] = { A2 : null, value : 0, inv_group : 0, name : ctry.COUNTRY, cp : 0 };
				}
			}

			countries = d3.entries(country);
			countries_dd = countries.filter(function(d){ 
				return d.key.length === 3 && d.value.name != undefined; 
			}).
			map(function(d){ return { label : d.value.name, value : d.key }; } );

			countries_dd.sort(function(a,b){
				if(a.label < b.label)
					return -1;
				else if(b.label < a.label)
					return 1;
				else
					return 0;
			});

			$("#ddlCountries").autocomplete({ 
					source: countries_dd,
					select: function(event, ui){
						$(this).val(ui.item.label);
						//$("#lblWarn").hide();
						return false;
					}
				})
				.on("autocompleteselect",function(event, ui){
					if(ui.item.label != ""){

						var ctry_sel = countries.filter(function(d){
							return d.key === ui.item.value;
						});
						var dd = d3.select("." + ctry_sel[0].key).datum();
						var c = country[dd.id];
						if( (graph_type === "combo" && c.cp > 0) ||
							(graph_type != "combo" && c.value > 0) ){
							
							set_ctry(dd.id);
							add_cps(dd.id);
							upd_charts(-1);
							clicked(dd);

							$("#lblWarn").hide();
						}else{
							$("#lblWarn").show();
						}
					}else{
						$("#lblWarn").show();
					}
			});

			create_charts(counterparties, invdivs);
			displayGraph(counterparties);
			displayTable(counterparties);
			draw_map();
		});
	});

});

var get_empty_exp = function(){
	return {
			RepoExposure : 0,
			GrossOTCPosExposure: 0,
			FuturesExposure: 0,
			Loan_Net : 0/*,
			cleared_otc_collat: 0*/
		};
};

var add_exposure_vals = function(cp, exposure){

	if(cp.exposure === undefined){
		cp.exposure = get_empty_exp();
		cp.country = {};
		cp.inv_group = {};
	}

	var k, i, val;

	var keys = ["GrossOTCPosExposure", "FuturesExposure", "Loan_Net","RepoExposure"];

if (cp.CounterpartyId ===8)
	var aaa = 1;

	for(i in keys){
		k = keys[i];
		val = parse_float(exposure[k], 0);
		
		if(fld == "RepoExposure")
			val = ( val >= 0 )? val : 0;
		
		cp.exposure[k] += val;
	}

	// get total exposure
	keys = Object.keys(cp.exposure);
	keys = keys.filter(function(d){
		return d != "inv_group";
	});
	var total_exposure = 0;
	for(k in keys){
		total_exposure += parse_float(exposure[keys[k]],0);
	}

	// add investment division information
	var inv_grp = exposure.InvestmentGroup;
	if(cp.inv_group[inv_grp] === undefined){
		cp.inv_group[inv_grp] = get_empty_exp();
	}

	var fld;
	for(i in keys){
		fld = keys[i];
		val = parse_float(exposure[fld], 0);
		
		if(fld == "RepoExposure")
			val = ( val >= 0 )? val : 0;

		cp.inv_group[inv_grp][fld] += val;
	}

	if(invdivs.indexOf(inv_grp) < 0)
		invdivs.push(inv_grp);

	/*
		add country information
	*/
	// add ctry to cp
	var ctry = exposure.CountryOfExposure;
	
	if(cp.country[ctry] === undefined){
		cp.country[ctry] = get_empty_exp();
		cp.country[ctry].inv_group = {};
		cp.country[ctry].inv_group[inv_grp] = get_empty_exp();
	}
	for(var e in cp.exposure){
		if(e != "inv_group")
			cp.country[ctry][e] += +exposure[e];
	}

	if(cp.country[ctry].inv_group[inv_grp] === undefined){
		cp.country[ctry].inv_group[inv_grp] = get_empty_exp();
	}

	for(i in keys){
		fld = keys[i];
		if(fld != "inv_group"){
			val = parse_float(exposure[fld], 0);
			if(fld == "RepoExposure")
				val = ( val >= 0 )? val : 0;
			cp.country[ctry].inv_group[inv_grp][fld] += val;
		}
	}

	// add to country object
	if(country[ctry] === undefined){
		country[ctry] = {};
		country[ctry].value = total_exposure;
		country[ctry].inv_group = {};
		country[ctry].cp = 0;
	}else{
		country[ctry].value += total_exposure;
	}

	// add cp to country
	
	var cp_ctry = cp.Country;
	if(country[cp_ctry] === undefined){
		country[cp_ctry] = {};
		country[cp_ctry].value = 0;
		country[cp_ctry].inv_group = {};
		country[cp_ctry].cp = total_exposure;
	}else{
		country[cp_ctry].cp += total_exposure;
	}

	// add inv group to ctry obj
	if(country[ctry].inv_group[inv_grp] === undefined){
		country[ctry].inv_group[inv_grp] = get_empty_exp();
	}
	for(i in keys){
		fld = keys[i];
		val = parse_float(exposure[fld], 0);
		val = ( val >= 0 )? val : 0;
		country[ctry].inv_group[inv_grp][fld] += val;
	}
	if(cp.CounterpartyId === 3 && ctry === "NO")
		var a = 2;
};

// some exposures are only required if they are positive
var get_exposure = function(v, p){

};

var parse_int = function(s, def){
	var ret = parseInt(s, 10);
	return (isNaN(ret))? def : ret;
};
var parse_float = function(s, def){
	var ret = parseFloat(s, 10);
	return (isNaN(ret))? def : ret;
};



// The dimensions for SVG drawing
var m = [30, 10, 10, 10],
    w = 580 - m[1] - m[3],
    h = 250 - m[0] - m[2];

// Set the x-axis of the entire drawing. Initialize variables y-axis and dragging to be empty.
var x = d3.scale.ordinal().rangePoints([0, w], 1),
    y = {},
    dragging = {};

var line = d3.svg.line().interpolate("linear"),
    axis = d3.svg.axis().orient("left"),
    background,dimensions,
    foreground;

var svg = d3.select("div#div_parallel").append("svg:svg")
            .attr("width", w + m[1] + m[3])
            .attr("height", h + m[0] + m[2])
            .append("svg:g")
            .attr("transform", "translate(" + m[3] + "," + m[0] + ")");

var data =  new Array();
var tableData = new Array();
var min,max;

var defaultCounterParties;

 // Assign Color Scale 
  var color1 = d3.scale.category20();
  var color2 = d3.scale.category20c();



function displayGraph(cpty){

   defaultCounterParties = cpty;

   data = []; // make sure data is empty
   var c = ctry;
   for(var i=0;i<cpty.length;i++) {
      var obj = new Object();
      obj = (graph_type === "combo")? cpty[i].value.exposure : cpty[i].value.country[ctry];
      data[i] ={
        CounterpartyId :  cpty[i].value.CounterpartyId,
        // CountryOfExposure :  counterparties[i].CountryOfExposure,
        "Futures (k)" :  obj.FuturesExposure/1000,
        "Gross OTC Positive (k) " : obj.GrossOTCPosExposure/1000,
        "Loan Net (k)" : obj.Loan_Net/1000,
        "Repo (k)" : obj.RepoExposure/1000//,
        //"Cleared OTC Collat (k)" :  counterparties[i].value.exposure.cleared_otc_collat/1000
   
      }
  }

  min = d3.min(data, function(d){ return d.CounterpartyId});
  max = d3.max(data, function(d){ return d.CounterpartyId});

  // Assigning Color domain
  color1.domain([min, 20]);
  color2.domain([21, max]);

  // Extract the list of dimensions and create a scale for each. 
  // Variable dimesnions stores the first row of keys.
  // Exclude the CounterpartyId and CountryOfExposure columns
  x.domain(dimensions = d3.keys(data[0]).filter(function(d) {
              return d != "CounterpartyId"
              && (y[d] =  d3.scale.linear()
                            .domain([
                                d3.min(data, function(p) { 
                                  if(cpty.length === 1 && +p[d] > 0)
                                      return 0;
                                  else
                                    return +p[d]; 
                                })
                                , 
                                d3.max(data, function(p) { 
                                  if(cpty.length === 1 && +p[d] < 0)
                                      return 0;
                                  else
                                      return +p[d]; 
                                })
                            ])
                            .range([h, 0]));
  }));

  // Add grey background lines for context.
  background = svg.append("svg:g")
                  .attr("class", "background")
                  .selectAll("path")
                  .data(data)
                  .enter().append("svg:path")
                  .attr("d", path);

  // Add different colors for distinct Counterparties foreground lines for focus.
  foreground = svg.append("svg:g")
                  .attr("class", "foreground")
                  .selectAll("path")
                  .data(data)
                  .enter().append("svg:path")
                  .attr("d", path)
                  .style("stroke", function (d) {
                                    if (d.CounterpartyId <= 20)
                                      {return color1(d.CounterpartyId)}
                                    else 
                                      {return color2(d.CounterpartyId)};
                  })
               /*   .on("hover", function(d){

                        alert("clicked");
                       filterTable(d.CounterpartyId);
                  })*/
                  .style("stroke-width","1.5");

  // Add a group element for each dimension.
  var g =  svg.selectAll(".dimension")
              .data(dimensions)
              .enter().append("svg:g")
              .attr("class", "dimension")
              .attr("transform", function(d) { return "translate(" + x(d) + ")"; })
              .call(d3.behavior.drag()
              .on("dragstart", function(d) {
                      dragging[d] = this.__origin__ = x(d);
                      background.attr("visibility", "hidden");
              })
              .on("drag", function(d) {
                      dragging[d] = Math.min(w, Math.max(0, this.__origin__ += d3.event.dx));
                      foreground.attr("d", path);
                      dimensions.sort(function(a, b) { return position(a) - position(b); });
                      x.domain(dimensions);
                      g.attr("transform", function(d) { return "translate(" + position(d) + ")"; });

              })
              .on("dragend", function(d) {

                      parallel_cord_reset();
                      current_selection = -1;
                   //   alert("d: "+d+" path: "+d3.select("path").id+" Dragging"+dragging[d]+" this.origin "+this.__origin__);
                      delete this.__origin__;
                      delete dragging[d];
                      transition(d3.select(this)).attr("transform", "translate(" + x(d) + ")");
                      transition(foreground).attr("d", path);
                      background.attr("d", path)
                                .transition()
                                .delay(500)
                                .duration(0)
                                .attr("visibility", null);
                      if(extents.length != 0){
                        findSelectedCounterParties();
                        filterTable();
                      }else{
                        d3.selectAll("table").remove();
                        displayTable(defaultCounterParties);
                        add_cps_for_ctry(country[ctry].A3);
                        upd_charts(-1);
                      }

              }));

    // g.append("div");

    // Add an axis and title.
     g.append("svg:g")
      .attr("class", "axis")
      .each(function(d) { d3.select(this).call(axis.scale(y[d])); })
      .append("svg:text")
      .attr("class", "axisTitle")
      .attr("text-anchor", "middle")
      .attr("y", -9)
      .text(String);

    // Add and store a brush for each axis.

     g.append("svg:g")
      .attr("class", "brush")
      .each(function(d) { d3.select(this).call(y[d].brush = d3.svg.brush().y(y[d]).on("brush", brush)); })
      .selectAll("rect")
      .attr("x", -8)
      .attr("width", 16);


}

function highlight_CounterParty(x){


d3.selectAll(".foreground path").style("stroke",  function (d) {
                                   if (d.CounterpartyId == x)
                                     {
                                       if (d.CounterpartyId <= 20)
                                             {return color1(d.CounterpartyId)}
                                       else 
                                             {return color2(d.CounterpartyId)};
                                     }
                                   else 
                                     {
                                         return "none"};
                 });


}


function parallel_cord_reset() {

  d3.selectAll(".foreground path").style("stroke",  function (d) { if (d.CounterpartyId <= 20)
                                                      {return color1(d.CounterpartyId);}
                                                    else 
                                                      {return color2(d.CounterpartyId);}
                                                  });

}

var tbody;
var header;

// Array to hold 6 sort indicator default values.
// First column CounterPartyId is not sorted, hence 0
var sortInd=[0,1,1,1,1,1]; 

function displayTable(cpty){
    // Initializing tableHeader

    var tabHeader = d3.select("div#div_tab_header")
                    .append("table")
                    .style("border-collapse", "collapse");
                  //  .style("border", "1px black solid");
        thead = tabHeader.append("thead");

    // Initializing tableBody

    var table = d3.select("div#div_tab_body")
                  .append("table")
                  .style("border-collapse", "collapse")
                  .style("border", "1px black solid");
        
        tbody = table.append("tbody");
      
     
    // Table Header columns

    header = ["CounterpartyId","Counterparty Name","Counterparty Rating","EBT","Market Cap Cur","Market Cap Prev"];     

    // Fetch Table Data
    tableData = [];     
    for(var i=0;i<cpty.length;i++) {
      tableData[i] = {
      "CounterpartyId": cpty[i].value.CounterpartyId,
      "Counterparty Name" :  cpty[i].value.CounterpartyName,
      "Counterparty Rating" : cpty[i].value.CounterpartyRating,
      "EBT" : numeral(cpty[i].value.EBT).format("$0,0"),
      "Market Cap Cur" : numeral(cpty[i].value.MktCapCur).format("$0,0"),
      "Market Cap Prev" : numeral(cpty[i].value.MktCapPrev).format("$0,0")
      }
    }

      // Display Table Header

      var head = thead.selectAll("th")
                     .data(header)
                     .enter()
                     .append("th")
                     .on("click",function(d,i){ 
                                   if(i != 0 ){           
                                       sortTable(d,i);
                                   
                                            if(sortInd[i]==1)
                                              {
                                                d3.select(this)
                                                  .style("cursor", "n-resize");
                                              }
                                            else{
                                                d3.select(this)
                                                  .style("cursor", "s-resize");
                                                }
                                            }
                      })
                     .text(function(column) {return column; })
                     .attr("class",function(d,i){return "col"+i;});

      populateTableData(tableData);

}

  function position(d) {
    var v = dragging[d];
    return v == null ? x(d) : v;
  }

  // Function to transition operators smoothly over time
  function transition(g) {
    return g.transition().duration(500);
  }

  // Returns the path for a given data point.
  function path(d) {
    return line(dimensions.map(function(p) { 
        return [position(p), y[p](d[p])]; 
    }));
  }


  var current_selection = -1;
  function populateTableData(tableData) {

     // Display Table rows

     var rows = tbody.selectAll("tr")
                     .data(tableData)
                     .enter()
                     .append("tr")
                     .on("mouseover", function(d){ 
                          if(current_selection === -1){
                            d3.select(this).style("background-color", function (d) {
                                                      if (d.CounterpartyId <= 20){
                                                          return color1(d.CounterpartyId);
                                                      }
                                                      else {
                                                          return color2(d.CounterpartyId);
                                                      }
                            });
                            highlight_CounterParty(d.CounterpartyId);
                          }
                     })
                     .on("mouseout", function(){
                          if(current_selection === -1){
                            d3.select(this).style("background-color", "transparent");
                            parallel_cord_reset();
                          }
                     })
                     .on("click", function(d) { 
                        if(current_selection !== d.CounterpartyId){
                            d3.selectAll("#div_tab_body table tbody tr")
                                .style("background-color", "transparent");

                            d3.select(this).style("background-color", function (d) {
                                                      if (d.CounterpartyId <= 20){
                                                          return color1(d.CounterpartyId);
                                                      }
                                                      else {
                                                          return color2(d.CounterpartyId);
                                                      }
                            });
                            highlight_CounterParty(d.CounterpartyId);
                            current_selection = d.CounterpartyId;
                        }else{
                            d3.select(this).style("background-color", "transparent");
                            parallel_cord_reset();
                            current_selection = -1;
                        }

                        upd_charts(d.CounterpartyId); 
                      });

     // Display Table cells

     var cells = rows.selectAll("td")
                     .data(function(row) {
                          return d3.range(Object.keys(row).length).map(function(column, i) {
                                      return row[Object.keys(row)[i]];
                            });
                      })
                     .enter()
                     .append("td")
                     .text(function(d) { return d; })
                     .attr("class",function(d,i){return "col"+i;})
                     .style("text-align",function(d,i) { if (i == 3 || i == 4 || i == 5) 
                                                            { return "right"; } 
                                                        else 
                                                            { return "left"; }}
                            );

  }

  var selectedTableData;

  function filterTable() {

    tbody.selectAll("tr").remove();

    selectedTableData = new Array();

    // Fetch Selected Table Data within the brush
    for(var i=0;i<commonCounterParties.length;i++) {
      for(var j=0;j<defaultCounterParties.length;j++) {
        if(commonCounterParties[i]
               == defaultCounterParties[j].value.CounterpartyId)
          {
              selectedTableData[i] = {
              "CounterpartyId": defaultCounterParties[j].value.CounterpartyId,
              "Counterparty Name" :  defaultCounterParties[j].value.CounterpartyName,
              "Counterparty Rating" : defaultCounterParties[j].value.CounterpartyRating,
              "EBT" : numeral(defaultCounterParties[j].value.EBT).format("$0,0"),
              "Market Cap Cur" : numeral(defaultCounterParties[j].value.MktCapCur).format("$0,0"),
              "Market Cap Prev" : numeral(defaultCounterParties[j].value.MktCapPrev).format("$0,0")
              }
             
          }
        }
      }

     populateTableData(selectedTableData);
     
  }


  // Ratings in Order from highest to lowest acc to S&P standards

  var ratingsOrder = ["AAA", "AA+", "AA", "AA-", "A+", "A", "A-", 
                      "BBB+", "BBB", "BBB-", "BB+", "BB", "BB-", "B+", "B", "B-", 
                      "CCC+", "CCC", "CCC-", "CC+", "CC", "CC-", "C+", "C", "C-", 
                      "D"];

  /**
   *  This function sorts table in ascending or descending
   *  order on Table header click 
   */ 

  function sortTable(d,i){



    // For CounterParty Name
    if(i == 1){
            if(sortInd[i]==1){
                    sortInd[i]=-1;  // toggle sort Indicator
                    tbody.selectAll("tr").sort(function(a, b) {
                      return d3.ascending(a[header[i]], b[header[i]]);  //sort asc on counter Party name
                  });
                }
            else{
                  sortInd[i]=1; //toggle sort Ind
                  tbody.selectAll("tr").sort(function(a, b) {
                    return d3.descending(a[header[i]], b[header[i]]); //sort desc on counter Party name
                });
              } 
            }
    // For CounterParty Rating
    else if(i==2){
            if(sortInd[i]==1){
                  sortInd[i]=-1;  // toggle sort Indicator
                  tbody.selectAll("tr").sort(function(a, b) {
                  if(a[header[i]] == b[header[i]]){
                    return d3.ascending(a[header[1]], b[header[1]]);  //sort asc according to CP name when Rating is common
                  }
                else{
                    //sort asc meaning sorted by highest credit rating 
                    return d3.ascending(ratingsOrder.indexOf(a[header[i]]), ratingsOrder.indexOf(b[header[i]]));  
                  }
                });
            }
            else{
                sortInd[i]=1; //toggle sort Ind
                tbody.selectAll("tr").sort(function(a, b) {
                if(a[header[i]] == b[header[i]]){
                    return d3.descending(a[header[1]], b[header[1]]);  //sort desc according to CP name when Rating is common
                  }
                else{
                    //sort desc meaning sorted by lowest credit rating 
                    return d3.descending(ratingsOrder.indexOf(a[header[i]]), ratingsOrder.indexOf(b[header[i]]));
                  }
              });
            }
        }
    else{
        // For Dollar Amount rest of columns
        if(sortInd[i]==1){
            sortInd[i]=-1;  // toggle sort Indicator
                tbody.selectAll("tr").sort(function(a, b) {
                if(a[header[i]] == b[header[i]]){
                    return d3.ascending(a[header[1]], b[header[1]]);  //sort asc according to CP name when Amt columns are common
                  }
                else{
                    return d3.ascending(convertToFloat(a[header[i]]),convertToFloat(b[header[i]]) );  //sort asc per selected column
                  }
              });
          }else{
                sortInd[i]=1; //toggle sort Ind
                tbody.selectAll("tr").sort(function(a, b) {
                if(a[header[i]] == b[header[i]]){
                    return d3.descending(a[header[1]], b[header[1]]);  //sort desc according to CP name when Amt columns are common
                  }
                else{
                    return d3.descending(convertToFloat(a[header[i]]), convertToFloat(b[header[i]]));  //sort desc per selected column
                  }
            });
          }
        }
  };

  /** This function converts the EBT,Market Cap Cur 
   *  and Market Cap Prev columns converted above 
   *  while loading back to Float value by removing 
   *  dollar and comma and checking if negative
   */
  function convertToFloat(num){

        return parseFloat(num.replace(",", "").replace("$", ""));

    }

  var extents;
  var actives;

  // Handles a brush event, toggling the display of foreground lines.
  function brush() {
        actives = dimensions.filter(function(p) { return !y[p].brush.empty(); });
        extents = actives.map(function(p) { return y[p].brush.extent(); });
        foreground.style("display", function(d) {
                  return actives.every(function(p, i) {
                  return extents[i][0] <= d[p] && d[p] <= extents[i][1];
                  }) ? null : "none";
              });
    }

  
 /* var selectedCounterParties, cpIndex, commonBrushCounterParties;

  function findSelectedCounterParties(){
 
    cpIndex =0 ;
    selectedCounterParties= new Array();

    for(var i=0;i<data.length;i++) {

      for (var j=0;j<actives.length;j++) {
          
        if(data[i][actives[j]] >= extents[j][0] && 
           data[i][actives[j]] <= extents[j][1])
           {
              if(selectedCounterParties[j] ==  undefined){
                selectedCounterParties[j] = new Array();
              }
              selectedCounterParties[j][cpIndex++] = data[i].CounterpartyId ;
           }
      }
    }

/*  for (i=0; i<selectedCounterParties.length;i++) {

      commonBrushCounterParties = selectedCounterParties[].filter(function(n) {
                                      return (selectedCounterParties[i].indexOf(n) != -1)
      });

      
     } */
 /* }

*/


/**
* This function finds the selected counterparties
* for the given cord
*/

var selectedCounterParties;
function findCounterParties(j){
 
   var cpIndex =0 ;

    selectedCounterParties= new Array();

    for(var i=0;i<data.length;i++) {

      if(data[i][actives[j]] >= extents[j][0] && 
             data[i][actives[j]] <= extents[j][1])
             {
             selectedCounterParties[cpIndex++] = data[i].CounterpartyId ;

             }
   }

    return selectedCounterParties;
}

var selectedPathForCord;
var commonCounterParties;

function findSelectedCounterParties(){


 selectedPathForCord = new Array(); // this is 2D array to hold selected counterPartyIds for selected cords 
 commonCounterParties = new Array(); // this holds common counterpartyids amonng all selected cords

 var commonIndex = 0;

 //find selected counterparty ids for all the parallel cords
 for(var i = 0; i< actives.length ; i++){
   selectedPathForCord[i]=findCounterParties(i);
 }

 //find cord index having the least items selected
 var  minIndex = findSmallestBrush();


 //find common counterparties
   for(var j = 0; j< selectedPathForCord[minIndex].length; j++){

       if( isCommonCounterParty(selectedPathForCord[minIndex][j]) == true){

           commonCounterParties[commonIndex++]=selectedPathForCord[minIndex][j];
       }
   }

    // update side charts
    $("#cp_sel").val(-1);
    $("#cp_sel").chosen().trigger("chosen:updated");

    for(var i in commonCounterParties){
        var c = commonCounterParties[i];
        $('#cp_sel option[value="' + c + '"]').attr('selected', 'selected');
    }
    $("#cp_sel").chosen().trigger("chosen:updated");

    upd_charts(-1);

 
}

function findSmallestBrush(){

 var min = selectedPathForCord[0].length ;

 var minIndex = 0;

 for(var i = 0; i< selectedPathForCord.length ; i ++){    

       if(selectedPathForCord[i].length < min){

           min = selectedPathForCord[i].length ;
           minIndex = i;
       }
 }

return minIndex; 
}

/**
* this function returns true if the counterparty is common for
* all the selected brushes
*/
function isCommonCounterParty(counterpartyId){

 var counter = 0;

 for(var i = 0; i< selectedPathForCord.length ; i ++){

   for(var j = 0; j< selectedPathForCord[i].length; j++){

       if( selectedPathForCord[i][j] == counterpartyId){

           counter++;
           break;
       }
   }
 }

 return (counter == selectedPathForCord.length ? true :false);
}

function add_cps_for_ctry(ctry){
  var cps = counterparties.filter(function(d){
    if(graph_type === "combo"){
      return d.value.Country === country[ctry].A2;
    }else{
      var ctry_2 = country[ctry].A2;
        return d.value.country[ctry_2] != undefined;
    }
  });
  $("#cp_sel").val(-1);
  $("#cp_sel").chosen().trigger("chosen:updated");

  for(var i in cps){
      var c = cps[i];
      $('#cp_sel option[value="' + c.key + '"]').attr('selected', 'selected');
  }
  $("#cp_sel").chosen().trigger("chosen:updated");
  ctry_selected = ctry;
  
}
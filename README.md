#Credit Risk Counterparty Dashboard

##Overview

###Data
All the data is contained in the `data` folder. `countries.csv` and `countries.geo.json` are publicly available. `countries.topo.json` was created from `countries.geo.json` using [topojson](https://www.npmjs.org/package/topojson).

`cp_data.csv` and `exp_data.csv` are proprietary data provided by Shawn. These are the data our project visualizes.

The country and topo data is used to draw the map. The proprietary data is used to color the countries and to draw the charts.

###Libraries and Javascript Code
`d3-tip.js` is used to draw the tooltips that show up on the map when you hover over a country.

`import_data.js` both imports the data and draws the visualizations.

`side_charts.js` contains the code for drawing the side charts.

`load_parallel_data.js` loads the data needed for the parallel lines chart.

`map.js` draws and updates the map.

`d3.js` drives most of the visualization. With some additional support from
jQuery to add some UI elements.

###Dashboard
`dashboard.html` is the page that loads and calls all of our javascript. On the
GitHub Pages branch we've renamed this to `index.html` so that it works with GitHub
Pages, but the content is the same.

##Links
The webpage can be found [here](http://jeffreyrogers.github.io/cs171-final-project/).

The video can be found [here](https://vimeo.com/93557553).

The process book can be found [here](https://github.com/jeffreyrogers/cs171-final-project/blob/master/process_book.pdf).


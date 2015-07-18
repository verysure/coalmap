// var apikey = 'AyxJQCb3jgWo5pWvz122yF2SdWCcHGxviGgfa4Eo';
// Global varibles
var map;
var plantcounts = {green:0, yellow:0, red:0};
var plant_data = [];


// initialize map when loaded
google.load('visualization', '1', {packages: ['corechart', 'line']});
google.maps.event.addDomListener(window, 'load', initMap);
// Initialize the map on load
function initMap() {
    $(document).ready(function() {
        // Initialize the map
        map = new google.maps.Map(document.getElementById('map-canvas'), {
            center:  {lat: 39.5, lng: -98.35},
            scrollwheel: false,
            zoom: 4,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        });
        // First render
        updateMapGraph();
    });
}

// updateMapGraph on form submit
function updateMapGraph() {
    // clear counts
    plantcounts=  {green:0, yellow:0, red:0};

    // addCoalPlants, check if there are plant_data
    if (plant_data.length === 0) {
        parseJSON("/coalmap/data/alldata_records_unformatted.json", function() {
            addCoalPlants(getFormData());
            drawTimeLine(getFormData());
            drawScatteredChart(getFormData());
        });
    } else {
        addCoalPlants(getFormData());
        drawTimeLine(getFormData());
        drawScatteredChart(getFormData());
    }
}


function addCoalPlants(fdata) {
    for (var i = 0; i< plant_data.length; i++) {
        // calculations for the coal and pv marginal cost
        var coal_mc = coalMarginalCost(plant_data[i], fdata);
        var pv_lcoe = pvLCOE(plant_data[i], fdata);
        var title = plant_data[i]['Plant Name'] + ' ('+ plant_data[i]['Utility Name'] + ')';
        var icon = planticon(coal_mc, pv_lcoe, plant_data[i]["CO2"]/20000000);

        var markerwindow = createMarker({
            title: title,
            position: {
                lat: plant_data[i]['Latitude'],
                lng: plant_data[i]["Longitude"]
            },
            icon: icon,
            info: renderInfo({
                title: title,
                coal_mc: coal_mc.toFixed(2),
                pv_lcoe: pv_lcoe.toFixed(2),
                co2: (plant_data[i]["CO2"]/1000000).toFixed(1),
                address: plant_data[i]['Street Address'] + ", "+ plant_data[i]['City'] +", " + plant_data[i]['State'] +  ", "+plant_data[i]['Zip'],
                utility: plant_data[i]['Utility Name']
            }),
        });
        // remove and add markers
        if (plant_data[i].marker != undefined) {
            plant_data[i].marker.setMap(null);
        }
        plant_data[i].marker = markerwindow.marker;
        plant_data[i].infowindow = markerwindow.infowindow;

        // Update plant counts
        $('#'+icon.fillColor+'span').text(++plantcounts[icon.fillColor]);
    }
}



//----------- Supplementary ----------------------

// Calculation functions
function coalMarginalCost(data, fdata) {
    return data["Marginal cost"]+fdata.carbontax*data["CO2"]/data["Net Generation (Megawatthours)"];
}
function pvLCOE(data, fdata) {
    return data['PV LCOE']*fdata.solarprice*Math.pow((1-fdata.solarred/100),(fdata.solaryear-2015));
}

function getFormData() {
    // get the form data from the html
    var getF = function (id) {
        var val = parseFloat($('#'+id).get(0).value);
        return (isNaN(val) ? $('#'+id).get(0).value : val);
    };
    return {
        carbontax  : getF('carbontax'),
        solarprice : getF('solarprice'),
        solaryear  : getF('solaryear'),
        solarred   : getF('solarred'),
        chartvar   : getF('chartvar'),
    }
}

function renderInfo(info) {
    return "\
        <h1 style='font-size:15px;'>"+info.title+"</h1>\
        <div id='bodyContent'>\
            Current Marginal Cost ($/MWh): "+info.coal_mc+"<br>\
            Renewable Energy LCOE ($/MWh): "+info.pv_lcoe+"<br>\
            CO2 emissions (Mt/yr): "+info.co2+"<br>\
            Address: "+info.address+"<br>\
            Utility: "+info.utility+"\
        </div>";
}

function createMarker(mdata) {
    // add marker
    var marker = new google.maps.Marker({
        title: mdata.title,
        position: mdata.position,
        icon: mdata.icon,
        map: map
    });

    // add info to marker
    var infoopen = false;
    var infowindow = new google.maps.InfoWindow({content: mdata.info});
    google.maps.event.addListener(marker, 'click', function() {
        // first clear windows
        for (var i = 0; i < plant_data.length; i++) {
            plant_data[i].infowindow.close(map, plant_data[i].marker);
        }
        // check if window open or cloase
        if (infoopen) {
            infowindow.close(map,marker);
            infoopen = false;
        } else {
            infowindow.open(map,marker);
            infoopen = true;
        }
    });

    return {marker:marker, infowindow:infowindow};
}

function planticon(coal_mc, renew_mc, scale) {
    var renew_ratio = renew_mc / coal_mc;
    var plant = {
        // path: 'M 0,0 100,0 100,100 200,150 200,200 0,200 0,150 z',
        path: google.maps.SymbolPath.CIRCLE,
        scale: 0.07 * scale + 0.05,
        scale: 6*scale + 4,
        fillOpacity: 1,
        strokeColor: 'transparent',
        fillColor: ''
    };

    if (renew_ratio <= 1) {
        plant['fillColor'] = 'green';
    } else if (renew_ratio <= 1.2) {
        plant['fillColor'] = 'yellow';
    } else {
        plant['fillColor'] = 'red';
    }
    return plant;
}


//---------Utility functions-----------------
function parseJSON(json_url, callback) {
    $.ajax({
        type: "GET",
        url: json_url,
        dataType: "json",
        success: function(data) {
            plant_data = data;
            callback();
        }
    });
}

function outputUpdate(target, value) {
    $(target).text(value);
}


function scrollTo(obj) {
   // animate
   $('html, body').animate({
       scrollTop: $($(obj).attr('href')).offset().top
     }, 300);
}






// functions for charts

// Testing for charts
// google.load('visualization', '1', {packages: ['corechart', 'line']});
// google.setOnLoadCallback(drawTimeLine);

function drawTimeLine(formdata) {
    var data = new google.visualization.DataTable();
    data.addColumn('number', 'test');
    data.addColumn('number', 'Plants to Shutdown (%)');

    // Calculate and add data
    data.addRows(calculateChartData(formdata));

    // Styling axis
    var textStyle = {
        fontSize: 20,
        italic: false,
        fontName: 'Arial',
    };
    var titleTextStyle = {
        fontSize: 30,
        italic: false,
        fontName: 'Arial',
        bold: true,
    };

    var options = {
        hAxis: {
            title: $('#chartvar [value="'+formdata.chartvar+'"]').get(0).text,
            textStyle: textStyle,
            titleTextStyle: titleTextStyle
        },
        vAxis: {
            title: 'Plants to Shutdown (%)',
            textStyle: textStyle,
            titleTextStyle: titleTextStyle
        },
        backgroundColor: 'white',
        lineWidth: 5,
        legend: 'none',
    };

    var chart = new google.visualization.LineChart(document.getElementById('chart_div'));
    chart.draw(data, options);
}


// Calculates x vs total plants to shutdown
function calculateChartData(formdata) {
    // first determine the x axis and get the x range
    var x_id = formdata.chartvar;
    var x_min = parseFloat($('#' + x_id).get(0).min);
    var x_max = parseFloat($('#' + x_id).get(0).max);
    var x_step = parseFloat($('#' + x_id).get(0).step);
    var total_plants = plant_data.length;


    // count the plants vs x changes
    var x_plants = [];
    for (var x = x_min; x <= x_max; x += x_step) {
        // changes x variable
        formdata[x_id] = x;

        // counts how mant better pvLcoe plants, returns percentages
        var plants = plant_data.map(function(obj){
            return pvLCOE(obj, formdata) <= coalMarginalCost(obj, formdata);
        }).reduce(function(a,b){return a+b;})/total_plants * 100;

        // add this to the data points
        x_plants.push([x, parseFloat(plants.toFixed(2))]);
    }

    return x_plants;
}



// Draw Scattered Chart
function drawScatteredChart(formdata) {
    var data = new google.visualization.DataTable();
    // use MWH?
    data.addColumn('number', 'plantsize');
    data.addColumn('number', 'Coal Operational Cost');
    data.addColumn('number', 'Solar LCOE');

    // Calculate and add data
    var size_cost = plant_data.map(function (plant) {
        return [
            plant["Net Generation (Megawatthours)"]/1e6,
            coalMarginalCost(plant, formdata),
            pvLCOE(plant, formdata)
        ];
    });
    data.addRows(size_cost);

    // Styling axis
    var textStyle = {
        fontSize: 20,
        italic: false,
        fontName: 'Arial',
    };
    var titleTextStyle = {
        fontSize: 30,
        italic: false,
        fontName: 'Arial',
        bold: true,
    };

    var options = {
        hAxis: {
            title: 'Plant Size (by net TWh/yr)',
            textStyle: textStyle,
            titleTextStyle: titleTextStyle
        },
        vAxis: {
            title: 'Cost ($/MWh)',
            textStyle: textStyle,
            titleTextStyle: titleTextStyle
        },
        backgroundColor: 'white',
        // legend: 'none',
    };

    var chart = new google.visualization.ScatterChart(document.getElementById('scattered_chart'));
    chart.draw(data, options);
}

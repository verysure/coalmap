// var apikey = 'AyxJQCb3jgWo5pWvz122yF2SdWCcHGxviGgfa4Eo';
// Global varibles
var map;
var plantcounts = {green:0, yellow:0, red:0, grey: 0, black: 0};
var map_legend;
var plant_data = [];
// New plant_data fields:
// coalmc, co2_ng; pvlcoe; windlcoe; marker; window


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
        map_legend = document.getElementById('map-legend');
        map.controls[google.maps.ControlPosition.LEFT_BOTTOM].push(map_legend);

        // First render
        updateMapGraph();
    });
}

// updateMapGraph on form submit
function updateMapGraph() {
    // clear counts
    plantcounts = {green:0, yellow:0, red:0, grey: 0, black: 0}

    // addCoalPlants, check if there are plant_data
    if (plant_data.length === 0) {
        // parseJSON("/coalmap/data/alldata_records_unformatted.json", function() {
        parseJSON("data/alldata_records.json", function() {
            addCoalPlants(getFormData());
            drawTimeLine(getFormData());
            // drawScatteredChart(getFormData());
        });
    } else {
        addCoalPlants(getFormData());
        drawTimeLine(getFormData());
        // drawScatteredChart(getFormData());
    }
}


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

function addCoalPlants(fdata) {

    // add each coalplants
    for (var i = 0; i< plant_data.length; i++) {
        var icon = planticon(plant_data[i], fdata);

        if (plant_data[i].marker === undefined) {
            var title = plant_data[i]['Plant Name'] + ' ('+ plant_data[i]['Utility Name'] + ')';
            var markerwindow = createMarker({
                title: title,
                position: {
                    lat: plant_data[i]['Latitude'],
                    lng: plant_data[i]["Longitude"]
                },
                icon: icon,
                info: renderInfo(plant_data[i], fdata)
            });
            // remove and add markers
            if (plant_data[i].marker != undefined) {
                plant_data[i].marker.setMap(null);
            }
            plant_data[i].marker = markerwindow.marker;
            plant_data[i].marker.setMap(map);
            plant_data[i].infowindow = markerwindow.infowindow;
        } else {
            plant_data[i].marker.setIcon(icon);
            plant_data[i].infowindow.setContent(renderInfo(plant_data[i], fdata));
        }


        // Update plant counts
        plantcounts[icon.fillColor]++;
    }

    // render the plantcounts to the legend
    renderLegend(fdata);

}



//----------- Supplementary ----------------------

// Calculation functions
function coalMarginalCost(data, fdata) {
    return data["Marginal cost"]+fdata.carbontax*data["CO2"]/data["Net Generation (Megawatthours)"];
}
function pvLCOE(data, fdata) {
    return data['PV_LCOE_custom_'+fdata.solaritc+'ITC']*Math.pow((1-fdata.solarred/100),(fdata.passedyear-2015));
}
function windLCOE(data, fdata) {
    return data['Wind_LCOE_0ITC_'+fdata.winditc+'PTC']*Math.pow((1-fdata.windred/100),(fdata.passedyear-2015));
}


function getFormData() {
    // get the form data from the html
    var getF = function (id) {
        var val = parseFloat($('#'+id).get(0).value);
        return (isNaN(val) ? $('#'+id).get(0).value : val);
    };
    return {
        carbontax  : getF('carbontax'),
        windred    : getF('windred'),
        passedyear : getF('passedyear'),
        solarred   : getF('solarred'),
        chartvar   : getF('chartvar'),
        solaritc   : $('#solaritc').get(0).value,
        winditc    : $('#winditc').get(0).value,
        windcheck  : $('#windcheck').get(0).checked,
        solarcheck : $('#solarcheck').get(0).checked,
    }
}

function renderInfo(plant, fdata) {
    return "<div class='marker-info'>\
        <h1 style='font-size:15px;'>"+plant['Plant Name'] + ' ('+ plant['Utility Name'] + ')'+"</h1>\
        Coal Average Operating Cost ($/MWh): "+coalMarginalCost(plant, fdata).toFixed(2)+"<br>\
        Solar LCOE ($/MWh): "+pvLCOE(plant, fdata).toFixed(2)+"<br>\
        Wind LCOE ($/MWh): "+windLCOE(plant, fdata).toFixed(2)+"<br>\
        Nameplate Capacity (MW): "+plant["Nameplate Capacity (MW)"].toFixed(2)+"<br>\
        CO2 Emissions (Mt/yr): "+(plant["CO2"]/1000000).toFixed(2)+"<br>\
        Retirement Year: "+ (plant["RetireYear"] === null ? 'Not Scheduled' : plant["RetireYear"].toFixed(0)) +"<br>\
        Address: "+plant['Street Address'] + ", "+ plant['City'] +", " + plant['State'] +  ", "+plant['Zip']+"<br>\
        Utility: "+plant['Utility Name']+"\
        </div>";
}
function renderLegend(fdata) {
    var iconsize = 10;
    var legend_text = "";
    var color_text = [
        {c: 'yellow', t: 'Solar PV'},
        {c: 'green', t: 'Wind'},
        {c: 'red', t: 'Coal'},
        {c: 'grey', t: 'Retiring'},
        {c: 'black', t: 'Retired'}
    ];

    // create legend
    legend_text += "<table>";
    for (var i = 0; i<color_text.length; i++) {
        if ((color_text[i].c === 'yellow' && !fdata.solarcheck) || (color_text[i].c === 'green' && !fdata.windcheck)) {
            legend_text += "<tr><td><strike>"+plantcounts[color_text[i].c]+"</strike></td><td>"+circleIconText(color_text[i].c, iconsize)+"</td><td>: <strike>"+color_text[i].t+"</strike></td></tr>";
        } else {
            legend_text += "<tr><td>"+plantcounts[color_text[i].c]+"</td><td>"+circleIconText(color_text[i].c, iconsize)+"</td><td>: "+color_text[i].t+"</td></tr>";
        }
    }
    legend_text += "</table>";

    // render legend
    $('#legend-text').html(legend_text);
}
function circleIconText(color, size) {
    return "<svg xmlns='http://www.w3.org/2000/svg' class='inline-icon' style='width:"+2*size+"px; height:"+2*size+"px;'>\
            <circle cx='"+size+"' cy='"+size+"' r='"+size+"' fill='"+color+"' />\
        </svg>";
}



function createMarker(mdata) {
    // add marker
    var marker = new google.maps.Marker({
        title: mdata.title,
        position: mdata.position,
        icon: mdata.icon,
        // map: map
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

// function planticon(coal_mc, pv_lcoe, wind_lcoe, scale) {
function planticon(plant_d, fdata) {
    // calculate the plant_d
    var scale = plant_d["Nameplate Capacity (MW)"]/3600;
    var coal_mc = coalMarginalCost(plant_d, fdata);
    var pv_lcoe = pvLCOE(plant_d, fdata);
    var wind_lcoe = windLCOE(plant_d, fdata);

    // create plant icon
    var plant = {
        path: google.maps.SymbolPath.CIRCLE,
        // scale: 0.07 * scale + 0.05,
        scale: 6*scale + 4,
        fillOpacity: 1,
        strokeColor: 'transparent',
        fillColor: ''
    };

    // new color scheme by ranking
    min_val = coal_mc;
    plant['fillColor'] = 'red'

    if (wind_lcoe < min_val && fdata.windcheck) {
        min_val = wind_lcoe;
        plant['fillColor'] = 'green';
    }
    if (pv_lcoe <= min_val && fdata.solarcheck) {
        plant['fillColor'] = 'yellow';
    }

    if (plant_d['RetireType'] === 'Full') {
        if (plant_d['RetireYear'] <= fdata.passedyear) {
            plant['fillColor'] = 'black';
        } else {
            plant['fillColor'] = 'grey';
        }
    }


    // Return the Plant
    return plant;
}


//---------Utility functions-----------------








// functions for charts

// Testing for charts
// google.load('visualization', '1', {packages: ['corechart', 'line']});
// google.setOnLoadCallback(drawTimeLine);
var chart_data;
var chart_options;
var chart;

function drawTimeLine(formdata) {
    var data = new google.visualization.DataTable();
    data.addColumn('number', 'test');
    data.addColumn('number', 'Coal Plants to Shutdown (%)');

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
            title: 'Coal Plants to Shutdown (%)',
            textStyle: textStyle,
            titleTextStyle: titleTextStyle
        },
        backgroundColor: 'white',
        lineWidth: 5,
        legend: 'none',
    };

    chart = new google.visualization.LineChart(document.getElementById('chart_div'));
    chart_data = data;
    chart_options = options;
    // chart.draw(data, options);
    drawChart();
}
function drawChart() {
    chart.draw(chart_data, chart_options);
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
            return (coalMarginalCost(obj, formdata) < pvLCOE(obj, formdata)) && (coalMarginalCost(obj, formdata) < windLCOE(obj, formdata));
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
    // var coal_mc_avg = 0;
    // var pv_avg = 0;
    var size_cost = plant_data.map(function (plant) {
        // coal_mc_avg += coalMarginalCost(plant, formdata);
        // pv_avg += pvLCOE(plant, formdata);
        return [
            plant["Nameplate Capacity (MW)"],
            coalMarginalCost(plant, formdata),
            pvLCOE(plant, formdata)
        ];
    });
    // coal_mc_avg = coal_mc_avg / plant_data.length;
    // pv_avg = pv_avg / plant_data.length;
    // console.log(Math.max(coal_mc_avg, pv_avg));
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
            title: 'Plant Size (Capacity (MW))',
            textStyle: textStyle,
            titleTextStyle: titleTextStyle
        },
        vAxis: {
            title: 'Cost ($/MWh)',
            textStyle: textStyle,
            titleTextStyle: titleTextStyle,
            viewWindow: {
                min: 0,
                max: 200
            }
        },
        backgroundColor: 'white',
    };

    var chart = new google.visualization.ScatterChart(document.getElementById('scattered_chart'));
    chart.draw(data, options);
}



// Other js modification of the website


function outputUpdate(target, value) {
    $(target).text(value);
}

function pvSystemPrice(){
    var redval = parseFloat($('#solarred')[0].value);
    var years = parseFloat($('#passedyear')[0].value);
    return (1.9*Math.pow(1-redval*0.01, years-2015)).toFixed(2);
}
function windSystemPrice(){
    var redval = parseFloat($('#windred')[0].value);
    var years = parseFloat($('#passedyear')[0].value);
    return (1.9*Math.pow(1-redval*0.01, years-2015)).toFixed(2);
}

function scrollTo(obj) {
    // animate
    $('html, body').animate({
       scrollTop: $($(obj).attr('href')).offset().top
    }, 300);
}

$(function () {
    // Add affix
    $('#map-side').affix({
        offset: {
            // top: $('#map-side').offset().top - $('#navbar').height()
            top: 0
        }
    });
    // Add affix style to head
    $('head').append('<style type="text/css">#map-side.affix {top: '+$('#navbar').height()+'px;}</style>');

    // fix the sidebar size when affix
    $('#map-side').width($('.col-xs-3').width());
    $(window).on('resize', function(){
        $('#map-side').width($('.col-xs-3').width());
        drawChart();
    });

    // Page-gap
    $('.page-gap').height($('#navbar').height());

    // register event
    $('#pvsystemprice').text(pvSystemPrice());
    $('#passedyear, #solarred').on('input', function(){
        $('#pvsystemprice').text(pvSystemPrice());
    });
    $('#windsystemprice').text(windSystemPrice());
    $('#passedyear, #windred').on('input', function(){
        $('#windsystemprice').text(windSystemPrice());
    });

    // register select on change
    $('#chartvar, .input').change(updateMapGraph);

    $('#windcheck').change(function () {
        $('#')
    });

});

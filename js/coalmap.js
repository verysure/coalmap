// var apikey = 'AyxJQCb3jgWo5pWvz122yF2SdWCcHGxviGgfa4Eo';
var map;
var markers = [];
var plantcounts = {green:0, yellow:0, red:0};
var raw_plant_data = [];


// initialize map when loaded
google.maps.event.addDomListener(window, 'load', initMap);



// Initialize the map on load
function initMap() {

    // initialize();
    $(document).ready(function() {
        // Initialize the map
        map = new google.maps.Map(
            document.getElementById('map-canvas'),
            {
                center:  {lat: 39.5, lng: -98.35},
                zoom: 4,
                mapTypeId: google.maps.MapTypeId.ROADMAP
            }
        );

        // First render
        updateMap();

    });
}

// updateMap on form submit
function updateMap() {
    // clear map
    for (var i = 0; i<markers.length; i++) {
        markers[i]['marker'].setMap(null);
    }
    markers = [];
    plantcounts=  {green:0, yellow:0, red:0};

    // addCoalPlants, check if there are raw_plant_data
    if (raw_plant_data.length) {
        parseJson("/coalmap/data/alldata_records_unformatted.json", function() {
            addCoalPlants(getFormData());
        });
    } else {
        addCoalPlants(getFormData());
    }
    
}




// Supplementary functions for rendering maps

function getFormData() {
    var getF = function (id) { return parseFloat($('#'+id).text()); };
    return {
        carbontax  : getF('carbontax'),
        solarprice : getF('solarprice'),
        solaryear  : getF('solaryear'),
        solarred   : getF('solarred'),
    }
}


function parseJson(json_url, callback) {
    $.ajax({
        type: "GET",
        url: json_url,
        dataType: "json",
        success: function(data) {
            raw_plant_data = data;
            callback();
        }
    });
}




function addCoalPlants(fdata) {
    $.ajax({
        type: "GET",
        url: "/coalmap/data/alldata_records_unformatted.json",
        dataType: "json",
        success: function(data) {
            for (var i = 0; i< data.length; i++) {
            // for (var i = 0; i< 20; i++) {
                addCoalPlant(
                    data[i]['Plant Name'] + ' ('+ data[i]['Utility Name'] + ')',
                    {lat: (data[i]['Latitude']), lng: (data[i]["Longitude"])},
                    (data[i]["Marginal cost"] + fdata.carbontax*data[i]["CO2"]/data[i]["Net Generation (Megawatthours)"]),
                    data[i]['PV LCOE']*fdata.solarprice*Math.pow((1-fdata.solarred/100),(fdata.solaryear-2015)),
                    data[i]["CO2"],
                    "Address: " + data[i]['Street Address'] + ", "+ data[i]['City'] +", " + data[i]['State'] +  ", "+data[i]['Zip']+"<br>CO2 emissions (Mt/yr): "+ (data[i]["CO2"]/1000000).toFixed(1)
                );
            }
        }
    });
}




function initialize() {
    var mapCanvas = document.getElementById('map-canvas');
    var mapOptions = {
        center:  {lat: 39.5, lng: -98.35},
        zoom: 4,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    }
    map = new google.maps.Map(mapCanvas, mapOptions);
}





function addCoalPlant(name, position, coal_mc, pv_lcoe, co2, plantinfo) {

    // First get the msg and then we can add the marker onto the map
    addMarker(name, position, coal_mc, pv_lcoe, co2, plantinfo);

}


function updatePlantCounts() {
    $('#greenspan').text(plantcounts['green']);
    $('#yellowspan').text(plantcounts['yellow']);
    $('#redspan').text(plantcounts['red']);
}


function addMarker(name, position, coal_mc, renew_mc, co2, plantinfo) {
    coal_mc = typeof coal_mc !== 'undefined' ? coal_mc : 1;
    renew_mc = typeof renew_mc !== 'undefined' ? renew_mc : 0;


    var infoopen = false;
    var icon = planticon(coal_mc, renew_mc, co2/20000000);
    plantcounts[icon['fillColor']] += 1;

    updatePlantCounts();



    var marker = new google.maps.Marker({
        title: name,
        position: position,
        icon: icon,
    });

    var infowindow = new google.maps.InfoWindow({
        content: infostring({
            title: name,
            coal_mc: coal_mc,
            renew_mc: renew_mc,
            info: plantinfo,
        }),
    });

    google.maps.event.addListener(marker, 'click', function() {
        clearInfos();
        if (infoopen) {
            infowindow.close(map,marker);
            infoopen = false;
        } else {
            infowindow.open(map,marker);
            infoopen = true;
        }
    });

    marker.setMap(map);
    markers.push({marker:marker, infowindow:infowindow});
}

function clearInfos() {
    for (var i = 0; i < markers.length; i++) {
        markers[i]['infowindow'].close(map, markers[i]['marker']);
    }
}



function planticon(coal_mc, renew_mc, scale) {
    var renew_ratio = renew_mc / coal_mc;

    var plant = {
        path: 'M 15,0 85,0 100,150 200,150 200,300 0,300 0,150 z',
        scale: 0.07 * scale + 0.05,
        fillOpacity:1,
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
    return plant

}



function infostring(infos) {

    return  '<h1 style="font-size:15px;">' + infos['title'] + '</h1>' +
                '<div id="bodyContent">' +
                    'Current Marginal Cost ($/MWh): ' + infos['coal_mc'].toFixed(3)+ '<br>'+
                    'Renewable Energy LCOE: ' + infos['renew_mc'].toFixed(3)+ '<br>'+
                    infos['info']+ ''+
                '</div>';
}












function outputUpdate(target, value) {
    $(target).text(value);
}






// scroll
function scrollTo(obj) {

   // animate
   $('html, body').animate({
       scrollTop: $($(obj).attr('href')).offset().top
     }, 300);

}

// initialize map when loaded
var apikey = 'AyxJQCb3jgWo5pWvz122yF2SdWCcHGxviGgfa4Eo';
var map;
var markers = [];
google.maps.event.addDomListener(window, 'load', renderMap);



// general functions
function renderMap() {

    initialize();
    parseAdd(1);


}







function updateMap(formdata) {
    formdata = typeof formdata !== 'undefined' ? formdata : {"carbontax": 1, "solarprice": 1};


    for (var i = 0; i<markers.length; i++) {
        markers[i].setMap(null);
    }
    markers = [];

    parseAdd(parseFloat(formdata.carbontax.value));
}








// Supporting functions

function parseAdd(value) {
    $.ajax({
        type: "GET",
        url: "/coalmap/data/test.json",
        dataType: "json",
        success: function(data) {

            for (var i = 0; i< data.length; i++) {
                addCoalPlant(
                    data[i]['name'],
                    {lat: parseFloat(data[i]['lat']), lng: parseFloat(data[i]['lng'])},
                    parseFloat(data[i]['coal_mc'])*value
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



function addCoalPlant(name, position, coal_mc) {

    // First get the msg and then we can add the marker onto the map
    $.ajax({
        type: 'GET',
        url: 'https://developer.nrel.gov/api/pvwatts/v5.json?api_key=' + apikey + '&lat=' + position['lat'].toString() +'&lon='+ position['lng'].toString() + '&system_capacity=20000&azimuth=180&tilt=40&array_type=4&module_type=0&losses=10',
        dataType: "jsonp",
        crossDomain: true,
        success: function (msg) {
            // After getting the value of output per year, we can finally addMarker
            renew_mc = msg['outputs']['ac_annual'];
            addMarker(name, position, coal_mc, renew_mc);
        },
        error: function (request, status, error) {
            console.log(error);
        }
    });
}


function addMarker(name, position, coal_mc, renew_mc) {
    coal_mc = typeof coal_mc !== 'undefined' ? coal_mc : 1;
    renew_mc = typeof renew_mc !== 'undefined' ? renew_mc : 0;

    var infoopen = false;
    var marker = new google.maps.Marker({
        title: name,
        position: position,
        // map: map,
        icon: {
            // size: new google.maps.Size(30, 30),
            scaledSize: new google.maps.Size(10, 20),
            url: planticon(coal_mc, renew_mc),
        }
    });

    var infowindow = new google.maps.InfoWindow({
        content: infostring({
            title: name,
            coal_mc: coal_mc,
            renew_mc: renew_mc,
            info: "testing...",
        }),
    });

    google.maps.event.addListener(marker, 'click', function() {
        if (infoopen) {
            infowindow.close(map,marker);
            infoopen = false;
        } else {
            infowindow.open(map,marker);
            infoopen = true;
        }
    });

    marker.setMap(map);
    markers.push(marker);
}



function planticon(coal_mc, renew_mc) {
    var iconstring = "";
    var iconpath = "/coalmap/js/markers/";
    var renew_ratio = renew_mc / coal_mc;

    if (renew_ratio >= 1) {
        iconstring = "green.png";
    } else if (renew_ratio >= 0.9) {
        iconstring = "yellow.png";
    } else {
        iconstring = "red.png"
    }
    return iconpath + iconstring;
}



function infostring(infos) {

    return  '<h1 style="font-size:15px;">' + infos['title'] + '</h1>' +
                '<div id="bodyContent">' +
                    'Current Marginal Cost: ' + infos['coal_mc']+ '<br>'+
                    'Renewable Energy LCOE: ' + infos['renew_mc']+ '<br>'+
                    'Power plant Info: ' + infos['info']+ ''+
                '</div>';
}





$(document).ready(function() {
    // $.ajax({
    //         type: 'GET',
    //         url: 'https://developer.nrel.gov/api/pvwatts/v5.json?api_key=' + apikey + '&lat=40&lon=-105&system_capacity=20000&azimuth=180&tilt=40&array_type=4&module_type=0&losses=10',
    //         dataType: "jsonp",
    //         crossDomain: true,
    //         success: function (msg) {
    //             console.log(msg);
    //         },
    //         error: function (request, status, error) {
    //             alert(error);
    //         }
    // });
});

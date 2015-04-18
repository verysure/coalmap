// initialize map when loaded
google.maps.event.addDomListener(window, 'load', renderMap);

function renderMap() {

    var map = initialize();

    addCoalPlant(map, 'Alabama Power Co.', {lat: 33.150917, lng: -87.499806}, 100, 50);
    addCoalPlant(map, 'Tennessee Valley Authority', {lat: 34.2457755, lng:-88.4037623}, 100, 200);


}



// Supporting functions

function initialize() {
    var mapCanvas = document.getElementById('map-canvas');
    var mapOptions = {
        center:  {lat: 39.5, lng: -98.35},
        zoom: 4,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    }
    var map = new google.maps.Map(mapCanvas, mapOptions);


    return map;
}


function addCoalPlant(map, name, position, coal_mc, renew_mc) {
    coal_mc = typeof coal_mc !== 'undefined' ? coal_mc : 1;
    renew_mc = typeof renew_mc !== 'undefined' ? renew_mc : 0;

    var infoopen = false;
    var marker = new google.maps.Marker({
        title: name,
        position: position,
        map: map,
        icon: {
            // size: new google.maps.Size(30, 30),
            scaledSize: new google.maps.Size(20, 20),
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

    return marker;
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

// initialize map when loaded
var apikey = 'AyxJQCb3jgWo5pWvz122yF2SdWCcHGxviGgfa4Eo';
var map;
var markers = [];
var plantcounts = {green:0, yellow:0, red:0};
google.maps.event.addDomListener(window, 'load', renderMap);



// general functions
function renderMap() {

    initialize();
    parseAdd([
        parseFloat($('#carbontax').text()),
        parseFloat($('#solarprice').text()),
        parseFloat($('#solaryear').text()),
        parseFloat($('#solarred').text()),
    ]);


    // render google graphs
    // carbon tax


}







function updateMap() {


    for (var i = 0; i<markers.length; i++) {
        markers[i]['marker'].setMap(null);
    }
    markers = [];
    plantcounts=  {green:0, yellow:0, red:0};

    parseAdd([
        parseFloat($('#carbontax').text()),
        parseFloat($('#solarprice').text()),
        parseFloat($('#solaryear').text()),
        parseFloat($('#solarred').text()),
        ]);
}








// Supporting functions

function parseAdd(values) {
    $.ajax({
        type: "GET",
        url: "/coalmap/data/alldata_records_unformatted.json",
        dataType: "json",
        success: function(data) {

            for (var i = 0; i< data.length; i++) {
            // for (var i = 0; i< 20; i++) {
                addCoalPlant(
                    data[i]['Utility Name'],
                    {lat: (data[i]['Latitude']), lng: (data[i]["Longitude"])},
                    (data[i]["Marginal cost"] + values[0]*data[i]["CO2"]/data[i]["Net Generation (Megawatthours)"]),
                    data[i]['PV LCOE']*values[1]*Math.pow((1-values[3]/100),(values[2]-2015)),
                    data[i]["CO2"],
                    "Address: " + data[i]['Street Address'] + ", " + data[i]['State'] + "<br>CO2 emission (ton/yr): "+data[i]["CO2"]
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

    var co2ratio = co2/20000000;

    var infoopen = false;
    var iconurl = planticon(coal_mc, renew_mc);

    if (iconurl[20] === 'g') {
        plantcounts['green'] += 1;
    } else if (iconurl[20] === 'y') {
        plantcounts['yellow'] += 1;
    } else {
        plantcounts['red'] += 1;
    }
    updatePlantCounts();



    var marker = new google.maps.Marker({
        title: name,
        position: position,
        // map: map,
        icon: {
            // size: new google.maps.Size(30, 30),
            scaledSize: new google.maps.Size(15*co2ratio + 5, 30*co2ratio+10),
            url: iconurl,
        }
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



function planticon(coal_mc, renew_mc) {
    var iconstring = "";
    var iconpath = "/coalmap/js/markers/";
    var renew_ratio = renew_mc / coal_mc;

    if (renew_ratio <= 1) {
        iconstring = "green.png";
    } else if (renew_ratio <= 1.2) {
        iconstring = "yellow.png";
    } else {
        iconstring = "red.png"
    }
    return iconpath + iconstring;
}



function infostring(infos) {

    return  '<h1 style="font-size:15px;">' + infos['title'] + '</h1>' +
                '<div id="bodyContent">' +
                    'Current Marginal Cost ($/MWh): ' + infos['coal_mc']+ '<br>'+
                    'Renewable Energy LCOE: ' + infos['renew_mc']+ '<br>'+
                    infos['info']+ ''+
                '</div>';
}





$(document).ready(function() {

});






function outputUpdate(target, value) {
    $(target).text(value);
}






// scroll
function scrollTo(obj) {

   // animate
   $('html, body').animate({
       scrollTop: $(obj.attr('href')).offset().top
     }, 300);

}

//
// $("#nav ul li a[href^='#']").on('click', function(e) {
//
//    // prevent default anchor click behavior
//    e.preventDefault();
//
//    // store hash
//    var hash = this.hash;
//
//    // animate
//    $('html, body').animate({
//        scrollTop: $(hash).offset().top
//      }, 300, function(){
//
//        // when done, add hash to url
//        // (default click behaviour)
//        window.location.hash = hash;
//      });
//
// });

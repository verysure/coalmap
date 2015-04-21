// var apikey = 'AyxJQCb3jgWo5pWvz122yF2SdWCcHGxviGgfa4Eo';
// Global varibles
var map;
var markers = [];
var plantcounts = {green:0, yellow:0, red:0};
var plant_data = [];


// initialize map when loaded
google.maps.event.addDomListener(window, 'load', initMap);



// Initialize the map on load
function initMap() {
    
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

    // addCoalPlants, check if there are plant_data
    if (plant_data.length === 0) {
        parseJSON("/coalmap/data/alldata_records_unformatted.json", function() {
            addCoalPlants(getFormData());
        });
    } else {
        addCoalPlants(getFormData());
    }
}




// Supplementary functions for rendering maps
function getFormData() {
    // get the form data from the html
    var getF = function (id) { return parseFloat($('#'+id).text()); };
    return {
        carbontax  : getF('carbontax'),
        solarprice : getF('solarprice'),
        solaryear  : getF('solaryear'),
        solarred   : getF('solarred'),
    }
}

function addCoalPlants(fdata) {
    for (var i = 0; i< plant_data.length; i++) {
        // calculations for the coal and pv marginal cost
        var coal_mc = plant_data[i]["Marginal cost"] + fdata.carbontax*plant_data[i]["CO2"]/plant_data[i]["Net Generation (Megawatthours)"];
        var pv_lcoe = plant_data[i]['PV LCOE']*fdata.solarprice*Math.pow((1-fdata.solarred/100),(fdata.solaryear-2015));
        var title = plant_data[i]['Plant Name'] + ' ('+ plant_data[i]['Utility Name'] + ')';
        var icon = planticon(coal_mc, pv_lcoe, plant_data[i]["CO2"]/20000000);
        
        // add
        var mw = createMarker({
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
                address: plant_data[i]['Street Address'] + ", "+ plant_data[i]['City'] +", " + plant_data[i]['State'] +  ", "+plant_data[i]['Zip']
            }),
        });
        plant_data[i].marker = mw.marker;
        plant_data[i].infowindow = mw.infowindow;
        
        // Update plant counts
        $('#'+icon.fillColor+'span').text(++plantcounts[icon.fillColor]);
    }
}

function renderInfo(info) {
    return "\
        <h1 style='font-size:15px;'>"+info.title+"</h1>\
        <div id='bodyContent'>\
            Current Marginal Cost ($/MWh): "+info.coal_mc+"<br>\
            Renewable Energy LCOE ($/MWh): "+info.pv_lcoe+"<br>\
            CO2 emissions (Mt/yr): "+info.co2+"<br>\
            Address: "+info.address+"\
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


function addMarker(mdata) {

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
        for (var i = 0; i < markers.length; i++) {
            markers[i]['infowindow'].close(map, markers[i]['marker']);
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

    markers.push({marker:marker, infowindow:infowindow});
}






function planticon(coal_mc, renew_mc, scale) {
    var renew_ratio = renew_mc / coal_mc;
    var plant = {
        path: 'M 15,0 85,0 100,150 200,150 200,300 0,300 0,150 z',
        scale: 0.07 * scale + 0.05,
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







// utility functions
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

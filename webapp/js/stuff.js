var map;
var ajaxRequest;
var plotlist;
var plotlayers=[];
var geojsonLayer = new L.GeoJSON();
var url = "http://lima.schaaltreinen.nl/nbiservice"; 
var clickcnt;
var m1, m2;
var nbi_id;
var bingLayer, osmLayer;
var attrControl;
var osmUrl='http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
var osmAttrib='Map data © OpenStreetMap contributors'
var t; 

function msg(h, t) {
    // displays an info message. if the time is 0, you will have to provide a close button that calls msgClose() yourself.
    clearTimeout(t);
    $('#msgBox').html(h).fadeIn();
    $('#msgBox').css("display", "block");
    if(t!=0) t = setTimeout("msgClose()", t * 1000);
}

function msgClose() {
    $('#msgBox').fadeOut();
}

function zoomtoBridge(data,latlon) {
    geojsonLayer.addGeoJSON(data);
    map.panTo(new L.LatLng(latlon[1],latlon[0]));
}

function getNBI() {
    $.getJSON(
        url,
        function(data) {
			var latlon = (data.geometry.coordinates);
            nbi_id = data.properties.nbi_id;
            //msg(data.properties.nbi_id, 1);
            zoomtoBridge(data,latlon);
        }
    );
};

function initmap() {
    map = new L.Map('map');
    bingLayer = new L.TileLayer.Bing(
		"AncYMYJDvHMmYPXT7mJcpCeYxGEVcJFj_StK8PO3ih8WgjvfHzuvnyjc_iRFXqN2",
		"Aerial"
    );
    osmLayer = new L.TileLayer(osmUrl, {attribution: osmAttrib});
    map.setView(new L.LatLng(40.0, -90.0),17);
    map.addLayer(osmLayer);
    
//	var baseLayers = {
//		"Bing Aerial": bingLayer,
//		"OpenStreetMap": osmLayer/
//	};

//    layersControl = new L.Control.Layers(baseLayers);
//    map.addControl(layersControl);
    
    map.addLayer(geojsonLayer);
    getNBI();
    if (!$.cookie('beenhere')) showAbout();
    $.cookie('beenhere', 'true', { expires: 7 });
    $.cookie('activelayer', 'osmLayer');
};

function toggleLayers() {
	map.attributionControl.removeAttribution();
	activeLayer = $.cookie('activelayer');
	if (activeLayer == "osmLayer") {
		map.removeLayer(osmLayer);
		map.addLayer(bingLayer);
		$.cookie('activelayer', 'bingLayer');	
	} else {
		map.removeLayer(bingLayer);
		map.addLayer(osmLayer);
		$.cookie('activelayer', 'osmLayer');
		map.attributionControl.addAttribution(osmAttrib);
	}
}

function startSelect() {
    $("#map").addClass("xhair");
    msg("Click on the map to set the start of the bridge", 3);
    map.on('click', function(e) {
		msg("Now click on the map to set the end of the bridge", 3);
		m1 = new L.CircleMarker(e.latlng);
		map.addLayer(m1)
		map.on('click', function(e) {
			m2 = new L.CircleMarker(e.latlng);
			map.addLayer(m2)
			stopSelect()
        });
    });
}

function stopSelect() {
    $("#map").removeClass("xhair");
    savedMsg();
    clickcnt=0;
	t = setTimeout("getNBI()", 1000);
}

function nextUp() {
    t = setTimeout("getNBI()", 1000);    
	savedMsg();
}

function savedMsg() {
//    msg('Saved! thx', 0.8);
    msg('This is alpha and nothing is saved yet!', 1);
}

function openInJOSM() {
    if (map.getZoom() < 16){
        msg("zoom in a little so we don't have to load a huge area from the API.", 3);
        return false;
    };
    bounds = map.getBounds();
    sw = bounds.getSouthWest();
    ne = bounds.getNorthEast();
    var JOSMurl = "http://127.0.0.1:8111/load_and_zoom?left=" + sw.lng + "&right=" + ne.lng + "&top=" + ne.lat + "&bottom=" + sw.lat
    // Use the .ajax JQ method to load the JOSM link unobtrusively and alert when the JOSM plugin is not running.
    $.ajax({
        url: JOSMurl,
        complete: function(t) {
            if (t.status!=200) msg("JOSM remote control did not respond ("+t.status+"). Do you have JOSM running?", 2);
            else {
				msg("Loading data in JOSM - we're moving on to the next one here",2);
				t = setTimeout("getNBI()",5000);
			}
        }
    })
}

function josmCallback(data) {
    alert(data);
}

function showAbout() {
	msg("You can help sort out the ~40,000 potential locations of missing US bridges in OpenStreetMap that were identified matching National Bridge Inventory data with OSM. The matching was done using a simple proximity method, so there's lots of false positives among the candidates.<p>So how does it work?<p>Simple: the map is centered on the location of a bridge according to the National Bridge Inventory for which we could not find a way with the 'bridge'tag in OSM. For now, we are considering only bridges that have some kind of road on and/or under them.<p>If you <strong>do not see a missing bridge in OSM</strong>, click 'NO, MOVE ON'.<p>If you <strong>do see a potential missing bridge</strong>, you can do two things:<ol><li>If you're not an experienced OSM contributor, or you don't want to spend too much time, click <strong>YES, SELECT POINTS</strong>. You can then identify the approximate start and end of the bridge by clicking on the map.<li>If you're comfortable editing in JOSM, you can load the current view's data in JOSM by clicking <strong>YES, MAP IN JOSM</strong>. You have to be zoomed in to at least level 16 to do this.</ol><p><strong>Where does this data go?</strong> Every 'NO' as well as all the proposed start and end points will be saved in a separate database. After three 'NO's, the candidate will be discarded. We will have to come up with a way to handle the candidate points.<p><strong>What's next?</strong> This thing really needs an aerial layer. Help is welcome. Also, if this thing is deemed useful, I will actually implement the logic and database to save contributions.<p><em>A thing by <a href='mailto:m@rtijn.org'>Martijn van Exel</a></em><p><div class=\"button\" onClick=\"msgClose()\">OK</div>",0);
}

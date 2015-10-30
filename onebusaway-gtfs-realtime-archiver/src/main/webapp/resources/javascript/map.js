var map = L.map('map').setView([51.505, -0.09], 13);
L.control.scale({metric: false}).addTo(map);

// Using transitime tile layer
L.tileLayer('http://api.tiles.mapbox.com/v4/transitime.j1g5bb0j/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoidHJhbnNpdGltZSIsImEiOiJiYnNWMnBvIn0.5qdbXMUT1-d90cv1PAIWOQ', {
 attribution: '&copy; <a href="http://openstreetmap.org">OpenStreetMap</a> &amp; <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
 maxZoom: 19
}).addTo(map);

var vehicleGroup = L.layerGroup().addTo(map);
var routeGroup = L.layerGroup().addTo(map);
var animationGroup = L.layerGroup().addTo(map);

/* For drawing the route and stops, taken from transitTime avlMap.jsp */
var routeOptions = {
	color: '#00ee00',
	weight: 4,
	opacity: 0.4,
	lineJoin: 'round',
	clickable: false
};
				
 var stopOptions = {
    color: '#006600',
    opacity: 0.4,
    radius: 4,
    weight: 2,
    fillColor: '#006600',
    fillOpacity: 0.3,
};
 
var routePolylineOptions = {clickable: false, color: "#00f", opacity: 0.5, weight: 4};

populateSelect("#vehicles", "/vehicleIds");
populateSelect("#agencies", "/agency", function(evt) {
	$("#routes option").remove();
	populateSelect("#routes", "/routes/" + evt.target.value);
});

$("#routes").on("change", function() {
	var agency = $("#agencies")[0].value,
	route = $("#routes")[0].value;
	$.getJSON(contextPath + "/route/" + agency + "/" + route, drawRoute)
		.fail(function() { alert("No data found for this route."); });
});

$("#vehicles").on("change", getVehiclePositions);

function getVehiclePositions() {
	
	var vehicleId = $("#vehicles")[0].value;
	var startTime = $("#startTime")[0].value;
	var endTime = $("#endTime")[0].value;
	
	var path = contextPath + "/vehiclePositions?vehicleId=" + vehicleId;
	
	if (startTime != "")
		path += "&startDate=" + Date.parse(startTime);
	if (endTime != "")
		path += "&endDate=" + Date.parse(endTime);
	
	var xhr = $.getJSON(path, function(data) {
		drawVehiclePositions(data);
		prepareAnimation(data);
		
		/* Datetime inputs will be disabled until there is something to go there. */
		/* Add in some limits. */
		var inputs = $(".datetime")
		if(inputs.attr("disabled") == "disabled") {
			inputs.attr("disabled", null)
			inputs.datetimepicker({
				minDate: new Date(data[0].timestamp),
				maxDate: new Date(data[data.length-1].timestamp),
				onClose: getVehiclePositions
			});
		}
		
	});
}

/* Animation controls */

var busIcon =  L.icon({
    iconUrl:  contextPath + "/resources/images/bus.png", 
    iconSize: [25,25]
});
var animate = avlAnimation(animationGroup, busIcon, $("#playbackTime")[0]);

var playButton = contextPath + "/resources/images/media-playback-start.svg",
pauseButton = contextPath + "/resources/images/media-playback-pause.svg";

function prepareAnimation(avlData) {
	
	// Fade in playback buttons
	$("#playbackContainer").animate({bottom: "5%"});

	// Make sure buttons are in init state.
	$("#playbackPlay").attr("src", playButton);
	$("#playbackRate").text("1X");
	
	animate(avlData);

}

$("#playbackNext").on("click", function() {
	animate.next();
});

$("#playbackPrev").on("click", function() {
	animate.prev()
})

$("#playbackPlay").on("click", function() {
	
	if (!animate.paused()) {
		animate.pause();
		$("#playbackPlay").attr("src", playButton);
	}
	else { // need to start it
		animate.start();
		$("#playbackPlay").attr("src", pauseButton);
	}
	
});

$("#playbackFF").on("click", function() {
	var rate = animate.rate()*2;
	animate.rate(rate);
	$("#playbackRate").text(rate + "X");
});

$("#playbackRew").on("click", function() {
	var rate = animate.rate()/2;
	animate.rate(rate);
	$("#playbackRate").text(rate + "X");
});




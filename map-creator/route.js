async function addMarker(map, lat, lng, title, desc, i) {
    const { AdvancedMarkerElement, PinElement } = await google.maps.importLibrary("marker");
    const { InfoWindow } = await google.maps.importLibrary("maps");
    // const pin = new PinElement({
    //   glyphText: `${i + 1}`,
    //   scale: 1.5,
    // });

    const marker = new AdvancedMarkerElement({
        map,
        position: { lat, lng },
        title: `${i + 1}. ${title} ${desc}`,
        gmpClickable: true,
    });

    const infoWindow = new InfoWindow(); 
    marker.addListener('gmp-click', () => {   
        infoWindow.close();
        const div = document.createElement("div");
        div.className = "map-marker-popup";
        div.innerHTML = title + ": " + desc;
        infoWindow.setContent(div);
        infoWindow.open(marker.map, marker);
    });
}
            
window.initMap = async function () {
    const { Map } = await google.maps.importLibrary("maps");
    const { encoding } = await google.maps.importLibrary("geometry");

    // init map
    const map = new Map(document.getElementById("map"), {
        mapId: "cf5ed18e8db31b4ec2cc4f24",
        center: { lat: 53.3, lng: -7.5 }, // centre of Ireland
        zoom: 7,
        colorScheme: google.maps.ColorScheme.DARK
    });

    const base = window.location.hostname == "127.0.0.1" ? "" : "/Authoring_DFMT";
    const res = await fetch(`${base}/map-creator/data/route.json`); 
    const routeData = await res.json();     

    // polyline: array of lat/lng points
    const encodedPolyline = routeData.routes[0].polyline.encodedPolyline;
    const path = encoding.decodePath(encodedPolyline);

    // drawing route on the map
    const routeLine = new google.maps.Polyline({
        path,
        geodesic: true,
        strokeColor: "#4285F4",
        strokeOpacity: 1.0,
        strokeWeight: 4,
        map,
    });

    // fit the map to the current route's bounds..
    const bounds = new google.maps.LatLngBounds();
    path.forEach(point => bounds.extend(point));
    map.fitBounds(bounds);

    // adding markers for restaurants
    const restaurants = await fetch(`${base}/map-creator/data/coords.json`); 
    const restData = await restaurants.json();
    restData.forEach((restau, i) => addMarker(map, restau.lat, restau.lng, restau.name, restau.desc, i))
}

function handleLocationError(browserHasGeolocation, pos) {
    console.log(
    browserHasGeolocation
        ? "Error: The Geolocation service failed."
        : "Error: Your browser doesn't support geolocation.",
    );
}

window.initWalkingStops = async function () {
    const base = window.location.hostname == "127.0.0.1" ? "" : "/Authoring_DFMT";
    const restaurants = await fetch(`${base}/map-creator/data/coords.json`); 
    const restData = await restaurants.json();
    let walking_stops = document.getElementById("walking-stops");
    let i = 0;
    restData.forEach((restau) => {
        i++;
        let walking_stop =  document.createElement("div");
        walking_stop.classList.add("walking-stop");

        let stop_index = document.createElement("p");
        stop_index.classList.add("stop-index");
        stop_index.innerHTML = `STOP ${i}`;

        let rest_name = document.createElement("h3");
        rest_name.innerHTML = restau.name;

        let stop_details =  document.createElement("div");
        stop_details.classList.add("stop-details");

        let cuisine = document.createElement("span");
        cuisine.innerHTML = restau.dish;
        let dish = document.createElement("span");
        dish.innerHTML = restau.desc;
        
        stop_details.append(cuisine, dish);
        walking_stop.append(stop_index, rest_name, stop_details);

        walking_stops.append(walking_stop);
    }
    )    
}  

initMap();
initWalkingStops();

function getUserLocation() {
        if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
        (position) => {
            const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            };
            console.log(pos);
        },
        () => {
            handleLocationError(true, map.getCenter());
        },
        );
    } else {
        handleLocationError(false, map.getCenter());
    }
}

getUserLocation();
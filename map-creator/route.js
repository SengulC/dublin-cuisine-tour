// initializing and fetching necessary data from json files
const base = window.location.hostname == "127.0.0.1" ? "" : "/Authoring_DFMT";
const coordsJson = await fetch(`${base}/map-creator/data/coords.json`); 
const coordsData = await coordsJson.json();
const routeJson = await fetch(`${base}/map-creator/data/route.json`); 
const routeData = await routeJson.json(); 
const userLocationPromise = getUserLocation();

async function addMarker(map, lat, lng, title, desc, i) {
    const { AdvancedMarkerElement, PinElement } = await google.maps.importLibrary("marker");
    const { InfoWindow } = await google.maps.importLibrary("maps");

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

    // initialize the map
    const map = new Map(document.getElementById("map"), {
        mapId: "cf5ed18e8db31b4ec2cc4f24",
        center: { lat: 53.3, lng: -7.5 }, // centre of Ireland
        zoom: 7,
        colorScheme: google.maps.ColorScheme.DARK
    });
     
    // polyline: array of lat/lng points
    const encodedPolyline = routeData.routes[0].polyline.encodedPolyline;
    const path = encoding.decodePath(encodedPolyline);

    // drawing route on the map
    const _ = new google.maps.Polyline({
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

    // add a marker for each restaurant on path
    coordsData.forEach((restau, i) => addMarker(map, restau.lat, restau.lng, restau.name, restau.desc, i))

    // draw path from user's geoloc to nearest spot
    findNearestStop()
        .then(result => {
            const userToClosestRestaurant = [
                result.nearestStop,
                result.userPos
            ];
            const userPath = new google.maps.Polyline({
                path: userToClosestRestaurant,
                geodesic: true,
                strokeColor: '#FF0000',
                strokeOpacity: 1.0,
                strokeWeight: 2,
            });
            userPath.setMap(map); // NEED TO MAKE IT SO THAT INITMAP IS ENTRY POINT AND CALLS THESE FUNCTIONS AS IT NEEDS THEIR DATA..
        })
        .catch(err => console.error("findNearestStop failed:", err));
}

// function handleLocationError(browserHasGeolocation, pos) {
//     console.log(
//     browserHasGeolocation
//         ? "Error: The Geolocation service failed."
//         : "Error: Your browser doesn't support geolocation.",
//     );
// }

window.initWalkingStops = async function () {
    let walking_stops = document.getElementById("walking-stops");
    let i = 0;
    coordsData.forEach((restau) => {
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

async function getUserLocation() {
    return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
    // if the device deosn't support geoloc, offer north/south start point
        reject(new Error("Geolocation not supported"));
        return;
    }
    navigator.geolocation.getCurrentPosition(
        (position) => resolve({lat: position.coords.latitude, lng: position.coords.longitude}),
        (error) => reject(error),
        { timeout: 30000, maximumAge: 60000, enableHighAccuracy: false } // wait longer before timing out
    );
    });
}

async function findNearestStop() {
    const { spherical } = await google.maps.importLibrary("geometry");
    const userPos = await userLocationPromise;

    let nearestStop = null;
    let minDistance = Infinity;

    coordsData.forEach((entry, i) => {
        let coord = new google.maps.LatLng(entry.lat, entry.lng);
        const distance = spherical.computeDistanceBetween(userPos, coord);
        if (distance < minDistance) {
            minDistance = distance;
            nearestStop = entry;
    }
    });

    return { nearestStop, userPos };
}


initMap();
initWalkingStops();
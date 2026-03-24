const base = window.location.hostname == "127.0.0.1" ? "" : "/Authoring_DFMT";

// find out if currently generating for budget or experience route html page
let script = document.getElementById("module-script").dataset.json 
let tour = JSON.parse(script).tour;

// wait longer before timing out
const options = { timeout: 30000, maximumAge: 60000, enableHighAccuracy: false } 

// initializing and fetching necessary data from json files
const coordsJson = await fetch(`${base}/map-creator/data/${tour}-coords.json`); 
const coordsData = await coordsJson.json();
const routeJson = await fetch(`${base}/map-creator/data/${tour}-route.json`); 
const routeData = await routeJson.json(); 

// const userLocationPromise = getUserLocation();
let map, userPath;

// initialize the global var. map
window.initMap = async function () {
    const { Map } = await google.maps.importLibrary("maps");
    map = new Map(document.getElementById("map"), {
        mapId: "cf5ed18e8db31b4ec2cc4f24",
        center: { lat: 53.3, lng: -7.5 }, // centre of Ireland
        zoom: 7,
        colorScheme: google.maps.ColorScheme.DARK
    });
}

// hlper function to add markers onto global var. map
async function addMarker(map, lat, lng, title, link) {
    const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");
    const { InfoWindow } = await google.maps.importLibrary("maps");

    const marker = new AdvancedMarkerElement({
        map,
        position: { lat, lng },
        title: title,
        gmpClickable: true,
    });

    const infoWindow = new InfoWindow(); 
    marker.addListener('gmp-click', () => {   
        infoWindow.close();
        const div = document.createElement("div");
        div.className = "map-marker-popup";
        div.innerHTML = `Directions: <a href=${link}>${title}</a>`;
        infoWindow.setContent(div);
        infoWindow.open(marker.map, marker);
    });
}
// initialize pre-defined budget/experience route
window.initRoute = async function () {
    const { encoding } = await google.maps.importLibrary("geometry");
     
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
    coordsData.forEach((restau, i) => addMarker(map, restau.lat, restau.lng, restau.name, restau.link))
}

// initialize walking stops HTML for pre-defined route
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

// RENDER THE MAP, PRE-DEFINED ROUTE, AND WALKING STOPS HTML
initMap();
initRoute();
initWalkingStops();

// helper function to find nearest restaurant in route to user's current location
// using the userLocationPromise we launched from the initial call to this script
async function findNearestStop(userPos) {
    const { spherical } = await google.maps.importLibrary("geometry");
    // const userPos = await userLocationPromise;

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

// find nearest stop to user's latest location
async function updateUserLocation(userPos) {
    findNearestStop(userPos)
        .then(result => {
            const userToClosestRestaurant = [
                result.nearestStop,
                result.userPos
            ];
            // update path
            if (userPath) { // if the userPath has already been defined, clear it.
                userPath.setMap(null);   
            }
            userPath = new google.maps.Polyline({
                    path: userToClosestRestaurant,
                    geodesic: true,
                    strokeColor: '#FF0000',
                    strokeOpacity: 1.0,
                    strokeWeight: 2,
            });
            userPath.setMap(map); // renders userPath upon global var. map
        })
        .catch(err => console.error("findNearestStop failed:", err));
}

function success(pos) {
    // upon successful tracking of user's position, call updateUserLocation
    updateUserLocation({lat: pos.coords.latitude, lng: pos.coords.longitude});
}

function error(err) {
    console.error(`ERROR(${err.code}): ${err.message}`);
}

navigator.geolocation.watchPosition(success, error, options);

// helper function to get user's current position 
// async function getUserLocation() {
//     return new Promise((resolve, reject) => {
//     if (!navigator.geolocation) {
//         reject(new Error("Geolocation not supported"));
//         return;
//     }
//     navigator.geolocation.getCurrentPosition(
//         (position) => resolve({lat: position.coords.latitude, lng: position.coords.longitude}),
//         (error) => reject(error),
//         options
//     );
//     });
// }

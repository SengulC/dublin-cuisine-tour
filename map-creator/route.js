// find out if currently generating for budget or experience route html page
const base = window.location.hostname == "127.0.0.1" ? "" : "/dublin-cuisine-tour"; 

let script = document.getElementById("module-script").dataset.json 
let tour = JSON.parse(script).tour;

// wait longer before timing out
const options = { timeout: 30000, maximumAge: 60000, enableHighAccuracy: false } 

// initializing and fetching necessary data from json files
const coordsJson = await fetch(`${base}/map-creator/data/${tour}-coords.json`); 
const coordsData = await coordsJson.json();
const routeJson = await fetch(`${base}/map-creator/data/${tour}-route.json`); 
const routeData = await routeJson.json(); 

let map, userPath, userMarker, userInfoWindow;

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
    const { AdvancedMarkerElement, PinElement } = await google.maps.importLibrary("marker");
    const { InfoWindow } = await google.maps.importLibrary("maps");

    const pinBackground = new PinElement({
        glyphColor: 'white',
        borderColor: '#E0B916',
        background: '#E0B916',
    });

    const marker = new AdvancedMarkerElement({
        map,
        position: { lat, lng },
        title: title,
        gmpClickable: true,
        content: pinBackground.element,
    });

    const infoWindow = new InfoWindow(); 
    marker.addListener('gmp-click', () => {   
        infoWindow.close();
        const div = document.createElement("div");
        div.className = "map-marker-popup";
        div.innerHTML = `Directions: <a target="_blank" href=${link}>${title}</a>`;
        infoWindow.setContent(div);
        infoWindow.open(marker.map, marker);
    });
}

// updating user marker as they move, using global var.s
async function updateUserMarker(map, lat, lng, closestRestaurant) {
    const newPosition = { lat, lng };

    if (userMarker) {
        userMarker.position = newPosition;
        return;
    }

    const { AdvancedMarkerElement, PinElement } = await google.maps.importLibrary("marker");
    const { InfoWindow } = await google.maps.importLibrary("maps");

    const pinBackground = new PinElement({
        glyphColor: 'white',
        borderColor: '#9999',
        background: '#9999',
    });
    userMarker = new AdvancedMarkerElement({
        map,
        position: newPosition,
        title: 'You are here',
        gmpClickable: true,
        content: pinBackground.element,
    });

    userInfoWindow = new InfoWindow();
    userMarker.addListener('gmp-click', () => {
        userInfoWindow.close();
        const div = document.createElement("div");
        div.className = "map-marker-popup";
        div.innerHTML = `You are here. Closest restaurant: <a target="_blank" href="${closestRestaurant.link}">${closestRestaurant.name}</a>`;
        userInfoWindow.setContent(div);
        userInfoWindow.open(userMarker.map, userMarker);
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
        strokeColor: "#E0B916",
        strokeOpacity: 1.0,
        strokeWeight: 4,
        map,
    });

    // fit the map to the current route's bounds..
    const bounds = new google.maps.LatLngBounds();
    path.forEach(point => bounds.extend(point));
    map.fitBounds(bounds);

    // add a marker for each restaurant on path
    coordsData.forEach((restau) => addMarker(map, restau.lat, restau.lng, restau.name, restau.link))
}

// initialize walking stops HTML for pre-defined route
window.initWalkingStops = async function () {
    let walking_stops = document.getElementById("walking-stops");
    let i = 0;
    coordsData.forEach((restau) => {
        i++;
        let walking_stop = document.createElement("div");
        walking_stop.classList.add("walking-stop");

        let stop_index = document.createElement("p");
        stop_index.classList.add("stop-index");
        stop_index.innerHTML = `STOP ${i}`;

        let rest_name = document.createElement("h3");
        rest_name.innerHTML = restau.name;

        let stop_details = document.createElement("div");
        stop_details.classList.add("stop-details");

        let cuisine = document.createElement("span");
        cuisine.innerHTML = restau.desc;
        let location = document.createElement("span");
        location.innerHTML = `${restau.eircode}`;

        let pop_up = document.createElement("div");
        pop_up.classList.add("restaurant-popup");
        let pop_name = document.createElement("h4");
        pop_name.innerHTML = restau.name;
        let pop_dish = document.createElement("p");
        let pop_amenities = document.createElement("p");
        let pop_hours = document.createElement("p");
        let pop_directions = document.createElement("p");
        pop_dish.innerHTML = `<strong>Popular Dish:</strong> ${restau.dish}.`;
        pop_amenities.innerHTML = `<strong>Amenities:</strong> ${restau.amenities}`;
        pop_hours.innerHTML = `<strong>Hours:</strong> ${restau.hours}`;
        pop_directions.innerHTML = `<strong>Directions:</strong> <a target="_blank" href=${restau.link}>${restau.eircode} via Google Maps</a>`;
        
        pop_up.append(pop_name, pop_dish, pop_amenities, pop_hours, pop_directions);
        stop_details.append(cuisine, location);
        walking_stop.append(stop_index, rest_name, stop_details, pop_up);
        walking_stops.append(walking_stop);
        walking_stop.addEventListener("click", () => {
            walking_stop.classList.toggle("active");
        });
    });    
}  

// RENDER THE MAP, PRE-DEFINED ROUTE, AND WALKING STOPS HTML
initMap();
initRoute();
initWalkingStops();

// helper function to find nearest restaurant in route to user's current location
async function findNearestStop(userPos) {
    const { spherical } = await google.maps.importLibrary("geometry");

    let nearestStop = null;
    let minDistance = Infinity;

    coordsData.forEach((entry) => {
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
            if (userPath) {
                userPath.setMap(null);   
            }
            userPath = new google.maps.Polyline({
                path: userToClosestRestaurant,
                geodesic: true,
                strokeColor: '#999999',
                strokeOpacity: 1.0,
                strokeWeight: 2,
            });
            // update global var.s of the user path and marker
            userPath.setMap(map);
            updateUserMarker(map, userPos.lat, userPos.lng, result.nearestStop); 
        })
        .catch(err => console.error("findNearestStop failed:", err));
}

// upon successful tracking of user's position, call updateUserLocation
function success(pos) {
    updateUserLocation({lat: pos.coords.latitude, lng: pos.coords.longitude});
}

function error(err) {
    console.error(`ERROR(${err.code}): ${err.message}`);
}

navigator.geolocation.watchPosition(success, error, options);
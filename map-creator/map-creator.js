// GEN. ROUTE FORM LONG/LAT PAIRS 

import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.local_dev_key;

const restData = JSON.parse(fs.readFileSync("./data/coords.json", "utf-8"));

function toLatLng(coord) {
  // convert lat lang data to google-interpretable object
  return { location: { latLng: { latitude: coord.lat, longitude: coord.lng } } };
}

async function computeRoute() {
  const origin = toLatLng(restData[0]);
  const destination = toLatLng(restData[restData.length - 1]);
  const intermediates = restData.slice(1, -1).map(toLatLng);

  const response = await fetch(
    "https://routes.googleapis.com/directions/v2:computeRoutes",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": API_KEY,
        "X-Goog-FieldMask": "routes.polyline,routes.legs"
      },
      body: JSON.stringify({
        origin,
        destination,
        intermediates,
        travelMode: "WALK"
      })
    }
  );

  const data = await response.json();

  if (data.error) {
    throw new Error(`Routes API error: ${JSON.stringify(data.error)}`);
  }

  fs.writeFileSync("./data/route.json", JSON.stringify(data, null, 2));
  console.log(`Route saved with ${2 + intermediates.length} stops`);
}

computeRoute();
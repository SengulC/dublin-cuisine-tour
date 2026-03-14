// FILE TO POPULATE WITH EIRCODE AND THEN GEOCODE LONG/LAT PAIRS TO GEN. MAP

import fs from 'fs';
import 'dotenv/config';
const API_KEY = process.env.local_dev_key;

const restData = JSON.parse(fs.readFileSync("./data/coords.json", "utf-8"));
let eircodes = [];
restData.filter((entry) => {eircodes.push(entry.eircode)});

async function geocodeEircode(eircode) {
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(eircode)}&region=ie&key=${API_KEY}`
  );
  const data = await response.json();

  if (data.status !== "OK") {
    throw new Error(`Geocoding failed for ${eircode}: ${data.status}`);
  }

  const { lat, lng } = data.results[0].geometry.location;
  return { eircode, lat, lng };
}

async function main() {
  const results = [];

  for (const restaurant of restData) {
    const coords = await geocodeEircode(restaurant.eircode);
    restaurant.lat = coords.lat; restaurant.lng = coords.lng;
    results.push(restaurant)
  }

  fs.writeFileSync("./data/coords.json", JSON.stringify(results, null, 2));
  console.log(`Saved ${results.length} restaurant(s) data to ./data/coords.json`);
}

main();
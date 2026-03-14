// FILE TO POPULATE WITH EIRCODE AND THEN GEOCODE LONG/LAT PAIRS TO GEN. MAP

import fs from 'fs';
import 'dotenv/config';
const API_KEY = process.env.local_dev_key;

const eircodes = [
  "D02 NX03",
  "D02 YP46",
  "D01 DE44"
];

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

  for (const eircode of eircodes) {
    const coords = await geocodeEircode(eircode);
    console.log(`${eircode} is at: ${coords.lat}, ${coords.lng}`);
    results.push(coords);
  }

  fs.writeFileSync("./data/coords.json", JSON.stringify(results, null, 2));
  console.log(`Saved ${results.length} coords to ./data/coords.json`);
}

main();
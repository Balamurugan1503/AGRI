// File: app/api/soil/route.ts

import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");
  const source = searchParams.get("source"); // To select which API to call
  const prop = searchParams.get("prop"); // The property to fetch

  if (!lat || !lon || !source || !prop) {
    return NextResponse.json(
      { error: "lat, lon, source, and prop are required" },
      { status: 400 }
    );
  }

  let apiUrl;
  if (source === 'isric') {
    apiUrl = `https://rest.isric.org/soilgrids/v2.0/properties/query?lon=${lon}&lat=${lat}&property=${prop}&depth=0-5cm&value=mean`;
  } else if (source === 'olm') {
    apiUrl = `https://api.openlandmap.org/query/point?lon=${lon}&lat=${lat}&coll=${prop}`;
  } else {
    return NextResponse.json({ error: "Invalid source" }, { status: 400 });
  }

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`External API failed with status: ${response.status}`);
    }
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return NextResponse.json(
      { error: "Failed to fetch from external soil API.", details: errorMessage },
      { status: 502 } // Bad Gateway
    );
  }
}
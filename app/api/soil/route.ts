// File: app/api/soil/route.ts

import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");
  const source = searchParams.get("source") || "isric";
  const prop = searchParams.get("prop");

  if (!lat || !lon) {
    return NextResponse.json(
      { error: "lat and lon are required" },
      { status: 400 }
    );
  }

  let apiUrl;
  if (source === 'isric') {
    if (prop) {
      apiUrl = `https://rest.isric.org/soilgrids/v2.0/properties/query?lon=${lon}&lat=${lat}&property=${prop}&depth=0-5cm&value=mean`;
    } else {
      apiUrl = `https://rest.isric.org/soilgrids/v2.0/properties/query?lon=${lon}&lat=${lat}&property=phh2o&property=nitrogen&property=clay&property=sand&property=silt&property=soc&depth=0-5cm&value=mean`;
    }
  } else if (source === 'olm') {
    if (!prop) {
      return NextResponse.json(
        { error: "prop is required for openlandmap source" },
        { status: 400 }
      );
    }
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
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const text = searchParams.get("text")
  const targetLang = searchParams.get("targetLang")

  if (!text || !targetLang) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 })
  }

  const apiUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${targetLang}`

  try {
    const response = await fetch(apiUrl)
    if (!response.ok) {
      return NextResponse.json({ error: `External API error ${response.status}` }, { status: 502 })
    }
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching translation API", error)
    return NextResponse.json({ error: "Failed to fetch translation" }, { status: 500 })
  }
}

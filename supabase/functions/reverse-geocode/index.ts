const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type ReverseGeocodeRequest = {
  lat: number
  lon: number
}

function cleanSuburb(suburb: string | undefined): string | undefined {
  if (!suburb) return undefined
  // Remove Ward references (e.g., "Tshwane Ward 77" -> "Tshwane" or skip entirely)
  const wardPattern = /\s*Ward\s*\d+/i
  const cleaned = suburb.replace(wardPattern, '').trim()
  return cleaned.length > 0 ? cleaned : undefined
}

function buildLocationString(address: Record<string, unknown>): string {
  const get = (k: string) => {
    const v = address[k]
    return typeof v === 'string' ? v : undefined
  }

  const road = get('road')
  const houseNumber = get('house_number')
  const rawSuburb = get('suburb') || get('neighbourhood') || get('residential')
  const suburb = cleanSuburb(rawSuburb)

  // Build a clean, Uber-style short address
  // Priority: house_number + road, or just road, then suburb as last resort
  if (road) {
    if (houseNumber) {
      return `${houseNumber} ${road}`
    }
    // Include suburb for context if available (without Ward)
    if (suburb) {
      return `${road}, ${suburb}`
    }
    return road
  }

  // If no street found, use suburb/neighbourhood only (without Ward)
  if (suburb) {
    return suburb
  }

  // Last resort - return empty, let caller handle
  return ''
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body = (await req.json()) as Partial<ReverseGeocodeRequest>
    const lat = typeof body.lat === 'number' ? body.lat : Number(body.lat)
    const lon = typeof body.lon === 'number' ? body.lon : Number(body.lon)

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return new Response(JSON.stringify({ error: 'Invalid lat/lon' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const url = new URL('https://nominatim.openstreetmap.org/reverse')
    url.searchParams.set('format', 'json')
    url.searchParams.set('lat', String(lat))
    url.searchParams.set('lon', String(lon))
    url.searchParams.set('addressdetails', '1')
    url.searchParams.set('zoom', '18')

    const nominatimRes = await fetch(url.toString(), {
      headers: {
        // Nominatim usage policy expects identifying UA; OK server-side.
        'User-Agent': 'NowNowAssist/1.0 (Lovable Cloud)',
        'Accept': 'application/json',
      },
    })

    if (!nominatimRes.ok) {
      return new Response(
        JSON.stringify({ location: 'Current location detected', error: 'Geocoding failed' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const data = (await nominatimRes.json()) as {
      address?: Record<string, unknown>
      display_name?: string
    }

    const location = data.address ? buildLocationString(data.address) : 'Current location detected'

    return new Response(
      JSON.stringify({ location, address: data.address ?? null, display_name: data.display_name ?? null }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('reverse-geocode error:', error)
    return new Response(JSON.stringify({ location: 'Current location detected' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

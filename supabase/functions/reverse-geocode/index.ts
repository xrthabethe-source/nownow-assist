const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type ReverseGeocodeRequest = {
  lat: number
  lon: number
}

function buildLocationString(address: Record<string, unknown>): string {
  const get = (k: string) => {
    const v = address[k]
    return typeof v === 'string' ? v : undefined
  }

  const road = get('road')
  const suburb = get('suburb')
  const neighbourhood = get('neighbourhood')
  const city = get('city')
  const town = get('town')
  const village = get('village')
  const state = get('state')

  // Prefer street names; do NOT include house numbers (per product requirement)
  let base = road ? `Near ${road}` : ''

  if (!base) {
    const fallbackArea = neighbourhood || suburb || city || town || village
    base = fallbackArea ? `Near ${fallbackArea}` : 'Current location detected'
  }

  const area = suburb || neighbourhood || city || town || village || state
  if (area && !base.includes(area)) {
    base += `, ${area}`
  }

  return base
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

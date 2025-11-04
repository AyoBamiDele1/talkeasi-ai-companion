import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get client IP from request headers
    const forwardedFor = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    const clientIp = forwardedFor?.split(',')[0] || realIp || 'unknown';

    console.log('Detecting location for IP:', clientIp);

    // Use ipapi.co for geolocation (free tier: 1000 requests/day)
    const response = await fetch(`https://ipapi.co/${clientIp}/json/`, {
      headers: {
        'User-Agent': 'Supabase Edge Function'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch location data');
    }

    const data = await response.json();

    // Map country code to currency
    let currency = 'USD'; // Default to USD
    if (data.country_code === 'NG') {
      currency = 'NGN';
    } else if (data.country_code === 'GB') {
      currency = 'GBP';
    }

    const locationData = {
      country_code: data.country_code || 'US',
      country_name: data.country_name || 'United States',
      currency: currency,
      city: data.city,
      region: data.region
    };

    console.log('Location detected:', locationData);

    return new Response(
      JSON.stringify(locationData),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=86400' // Cache for 24 hours
        } 
      }
    );

  } catch (error) {
    console.error('Error detecting location:', error);
    
    // Fallback to US/USD on error
    return new Response(
      JSON.stringify({
        country_code: 'US',
        country_name: 'United States',
        currency: 'USD',
        error: error.message
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 // Return 200 with fallback data instead of error
      }
    );
  }
});

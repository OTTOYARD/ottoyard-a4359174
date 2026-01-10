import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const lat = url.searchParams.get('lat');
    const lng = url.searchParams.get('lng');

    if (!lat || !lng) {
      return new Response(
        JSON.stringify({ error: 'Missing lat or lng parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch weather from Open-Meteo API (free, no API key required)
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,visibility,uv_index,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto&forecast_days=7`;

    const response = await fetch(weatherUrl);
    
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }

    const data = await response.json();

    // Get today's date in the location's timezone
    const today = new Date().toLocaleDateString('en-CA', { timeZone: data.timezone });

    // Transform data to our format, filtering daily to only include today and future
    const weatherData = {
      current: {
        temperature: Math.round(data.current.temperature_2m),
        feelsLike: Math.round(data.current.apparent_temperature),
        humidity: data.current.relative_humidity_2m,
        windSpeed: Math.round(data.current.wind_speed_10m),
        weatherCode: data.current.weather_code,
        visibility: Math.round((data.current.visibility || 10000) / 1609.34), // Convert meters to miles
        uvIndex: data.current.uv_index || 0,
        isDay: data.current.is_day === 1,
      },
      daily: data.daily.time
        .map((date: string, index: number) => ({
          date,
          tempHigh: Math.round(data.daily.temperature_2m_max[index]),
          tempLow: Math.round(data.daily.temperature_2m_min[index]),
          weatherCode: data.daily.weather_code[index],
          precipProbability: data.daily.precipitation_probability_max[index] || 0,
          sunrise: data.daily.sunrise[index],
          sunset: data.daily.sunset[index],
        }))
        .filter((day: { date: string }) => day.date >= today),
      evImpact: calculateEvImpact(data.current.temperature_2m, data.current.weather_code),
      timezone: data.timezone,
    };

    return new Response(
      JSON.stringify(weatherData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Weather fetch error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch weather data' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function calculateEvImpact(tempF: number, weatherCode: number): {
  rangeReduction: number;
  chargingEfficiency: number;
  recommendation: string;
  severity: 'low' | 'medium' | 'high';
} {
  let rangeReduction = 0;
  let chargingEfficiency = 100;
  let recommendation = "Optimal conditions for EV operations.";
  let severity: 'low' | 'medium' | 'high' = 'low';

  // Temperature impact on range
  if (tempF < 32) {
    rangeReduction = 25;
    chargingEfficiency = 80;
    recommendation = "Cold weather reduces battery range. Pre-condition vehicles before departure.";
    severity = 'high';
  } else if (tempF < 50) {
    rangeReduction = 15;
    chargingEfficiency = 90;
    recommendation = "Cool weather may reduce range by 10-15%. Plan for slightly longer charging times.";
    severity = 'medium';
  } else if (tempF > 95) {
    rangeReduction = 20;
    chargingEfficiency = 85;
    recommendation = "High heat affects battery performance. Use climate control sparingly.";
    severity = 'high';
  } else if (tempF > 85) {
    rangeReduction = 10;
    chargingEfficiency = 95;
    recommendation = "Warm conditions. Park in shade when possible to maintain battery health.";
    severity = 'medium';
  }

  // Weather condition impact
  if (weatherCode >= 71 && weatherCode <= 77) {
    // Snow
    rangeReduction = Math.max(rangeReduction, 30);
    recommendation = "Snow conditions detected. Reduce speed and increase following distance.";
    severity = 'high';
  } else if (weatherCode >= 61 && weatherCode <= 67) {
    // Rain
    rangeReduction = Math.max(rangeReduction, 10);
    if (severity !== 'high') severity = 'medium';
  }

  return { rangeReduction, chargingEfficiency, recommendation, severity };
}

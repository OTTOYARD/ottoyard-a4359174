// WMO Weather interpretation codes (WW)
// https://open-meteo.com/en/docs

interface WeatherInfo {
  description: string;
  emoji: string;
  emojiNight?: string;
  evImpact: 'low' | 'medium' | 'high';
}

const weatherCodes: Record<number, WeatherInfo> = {
  0: { description: "Clear sky", emoji: "☀️", emojiNight: "🌙", evImpact: "low" },
  1: { description: "Mainly clear", emoji: "🌤️", emojiNight: "🌙", evImpact: "low" },
  2: { description: "Partly cloudy", emoji: "⛅", emojiNight: "☁️", evImpact: "low" },
  3: { description: "Overcast", emoji: "☁️", emojiNight: "☁️", evImpact: "low" },
  45: { description: "Foggy", emoji: "🌫️", emojiNight: "🌫️", evImpact: "medium" },
  48: { description: "Depositing rime fog", emoji: "🌫️", emojiNight: "🌫️", evImpact: "medium" },
  51: { description: "Light drizzle", emoji: "🌧️", emojiNight: "🌧️", evImpact: "low" },
  53: { description: "Moderate drizzle", emoji: "🌧️", emojiNight: "🌧️", evImpact: "low" },
  55: { description: "Dense drizzle", emoji: "🌧️", emojiNight: "🌧️", evImpact: "medium" },
  56: { description: "Freezing drizzle", emoji: "🌨️", emojiNight: "🌨️", evImpact: "high" },
  57: { description: "Dense freezing drizzle", emoji: "🌨️", emojiNight: "🌨️", evImpact: "high" },
  61: { description: "Slight rain", emoji: "🌧️", emojiNight: "🌧️", evImpact: "low" },
  63: { description: "Moderate rain", emoji: "🌧️", emojiNight: "🌧️", evImpact: "medium" },
  65: { description: "Heavy rain", emoji: "🌧️", emojiNight: "🌧️", evImpact: "high" },
  66: { description: "Freezing rain", emoji: "🌨️", emojiNight: "🌨️", evImpact: "high" },
  67: { description: "Heavy freezing rain", emoji: "🌨️", emojiNight: "🌨️", evImpact: "high" },
  71: { description: "Slight snow", emoji: "🌨️", emojiNight: "🌨️", evImpact: "medium" },
  73: { description: "Moderate snow", emoji: "❄️", emojiNight: "❄️", evImpact: "high" },
  75: { description: "Heavy snow", emoji: "❄️", emojiNight: "❄️", evImpact: "high" },
  77: { description: "Snow grains", emoji: "🌨️", emojiNight: "🌨️", evImpact: "medium" },
  80: { description: "Slight rain showers", emoji: "🌦️", emojiNight: "🌧️", evImpact: "low" },
  81: { description: "Moderate rain showers", emoji: "🌦️", emojiNight: "🌧️", evImpact: "medium" },
  82: { description: "Violent rain showers", emoji: "⛈️", emojiNight: "⛈️", evImpact: "high" },
  85: { description: "Slight snow showers", emoji: "🌨️", emojiNight: "🌨️", evImpact: "medium" },
  86: { description: "Heavy snow showers", emoji: "❄️", emojiNight: "❄️", evImpact: "high" },
  95: { description: "Thunderstorm", emoji: "⛈️", emojiNight: "⛈️", evImpact: "high" },
  96: { description: "Thunderstorm with hail", emoji: "⛈️", emojiNight: "⛈️", evImpact: "high" },
  99: { description: "Thunderstorm with heavy hail", emoji: "⛈️", emojiNight: "⛈️", evImpact: "high" },
};

export function getWeatherInfo(code: number, isDay: boolean = true): WeatherInfo {
  const info = weatherCodes[code] || { description: "Unknown", emoji: "❓", evImpact: "low" as const };
  return {
    ...info,
    emoji: isDay ? info.emoji : (info.emojiNight || info.emoji),
  };
}

export function getWeatherEmoji(code: number, isDay: boolean = true): string {
  return getWeatherInfo(code, isDay).emoji;
}

export function getWeatherDescription(code: number): string {
  return getWeatherInfo(code).description;
}

export function getDayName(dateString: string, short: boolean = false): string {
  const date = new Date(dateString);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === today.toDateString()) {
    return "Today";
  }
  if (date.toDateString() === tomorrow.toDateString()) {
    return "Tomorrow";
  }
  
  return date.toLocaleDateString('en-US', { weekday: short ? 'short' : 'long' });
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

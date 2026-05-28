export interface TimeContext {
  weekday: string;
  hour: number;
  minute: number;
  period: "madrugada" | "manhã" | "tarde" | "noite";
  isoDate: string;
  timezone: string;
}

export interface Weather {
  temperature_c: number;
  humidity: number;
  wind_speed_kmh: number;
  description: string;
}

export function getTimeContext(timezone = "America/Sao_Paulo"): TimeContext {
  const now = new Date();
  const fmt = new Intl.DateTimeFormat("pt-BR", {
    timeZone: timezone,
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(now);
  const get = (type: string) =>
    parts.find((p) => p.type === type)?.value ?? "";
  const hour = parseInt(get("hour"), 10);
  return {
    weekday: get("weekday"),
    hour,
    minute: parseInt(get("minute"), 10),
    period: periodOf(hour),
    isoDate: now.toISOString(),
    timezone,
  };
}

function periodOf(hour: number): TimeContext["period"] {
  if (hour < 6) return "madrugada";
  if (hour < 12) return "manhã";
  if (hour < 18) return "tarde";
  return "noite";
}

export async function getWeather(
  lat: number,
  lon: number,
): Promise<Weather> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current: "temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m",
    wind_speed_unit: "kmh",
  });
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
  if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);
  const data = (await res.json()) as {
    current: {
      temperature_2m: number;
      relative_humidity_2m: number;
      weather_code: number;
      wind_speed_10m: number;
    };
  };
  return {
    temperature_c: data.current.temperature_2m,
    humidity: data.current.relative_humidity_2m,
    wind_speed_kmh: data.current.wind_speed_10m,
    description: weatherCodeToDescription(data.current.weather_code),
  };
}

function weatherCodeToDescription(code: number): string {
  if (code === 0) return "céu limpo";
  if (code <= 3) return "parcialmente nublado";
  if (code <= 48) return "nublado ou com neblina";
  if (code <= 57) return "garoa";
  if (code <= 67) return "chuva";
  if (code <= 77) return "neve";
  if (code <= 82) return "pancadas de chuva";
  if (code <= 99) return "tempestade";
  return "desconhecido";
}

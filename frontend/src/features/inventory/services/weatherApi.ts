export interface WeatherData {
  temperature: number;
  windspeed: number;
  weathercode: number;
  time: string;
}

export const weatherApi = {
  getKielceWeather: async (): Promise<WeatherData> => {
    const lat = 50.8703;
    const lon = 20.6278;
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Weather service unavailable');
    }
    
    const data = await response.json();
    return data.current_weather;
  }
};

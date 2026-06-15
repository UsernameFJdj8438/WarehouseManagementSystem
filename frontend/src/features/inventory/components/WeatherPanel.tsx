import React, { useEffect, useState } from 'react';
import { weatherApi, WeatherData } from '../services/weatherApi';
import { Card } from '../../../components/UI/Card';

export const WeatherPanel: React.FC = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const data = await weatherApi.getKielceWeather();
        setWeather(data);
      } catch (err) {
        setError('Failed to load weather');
      } finally {
        setLoading(false);
      }
    };
    fetchWeather();
  }, []);

  const getWeatherDescription = (code: number) => {
    const mapping: { [key: number]: string } = {
      0: 'Clear sky',
      1: 'Mainly clear',
      2: 'Partly cloudy',
      3: 'Overcast',
      45: 'Fog',
      48: 'Depositing rime fog',
      51: 'Light drizzle',
      61: 'Slight rain',
      71: 'Slight snow',
      95: 'Thunderstorm',
    };
    return mapping[code] || 'Cloudy';
  };

  if (loading) return (
    <Card className="animate-pulse flex items-center justify-center p-6">
      <div className="text-gray-400 font-medium">Fetching local conditions</div>
    </Card>
  );

  if (error) return (
    <Card className="border-red-100 bg-red-50 p-6">
      <div className="text-red-600 font-medium">{error}</div>
    </Card>
  );

  return (
    <Card padding="lg" className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-sm transition-colors duration-300">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Kielce, Poland</h3>
          <p className="text-xs text-gray-500 dark:text-slate-400 uppercase tracking-wider font-semibold">Local Facility Conditions</p>
        </div>
        <div className="text-right">
          <div className="text-4xl font-black text-indigo-600">{weather?.temperature}°C</div>
          <div className="text-sm font-medium text-gray-600 dark:text-slate-400">{getWeatherDescription(weather?.weathercode || 0)}</div>
        </div>
      </div>
      
      <div className="mt-8 grid grid-cols-2 gap-4 border-t border-gray-100 dark:border-slate-800 pt-4">
        <div>
          <p className="text-[10px] uppercase text-gray-400 dark:text-slate-500 font-bold">Wind Speed</p>
          <p className="text-lg font-bold text-gray-700 dark:text-slate-300">{weather?.windspeed} km/h</p>
        </div>
      </div>
    </Card>
  );
};

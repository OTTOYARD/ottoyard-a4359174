import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Thermometer, 
  Droplets, 
  Wind, 
  Eye, 
  Sun, 
  Battery, 
  Zap,
  AlertTriangle,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { City } from '@/components/CitySearchBar';
import { WeatherData } from '@/hooks/useWeather';
import { getWeatherEmoji, getWeatherDescription, getDayName, formatDate } from '@/utils/weatherCodes';

interface WeatherDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  city: City;
  weather: WeatherData;
}

export const WeatherDialog: React.FC<WeatherDialogProps> = ({
  open,
  onOpenChange,
  city,
  weather,
}) => {
  const currentEmoji = getWeatherEmoji(weather.current.weatherCode, weather.current.isDay);
  const currentDescription = getWeatherDescription(weather.current.weatherCode);

  const getSeverityColor = (severity: 'low' | 'medium' | 'high') => {
    switch (severity) {
      case 'low': return 'bg-success/10 text-success border-success/20';
      case 'medium': return 'bg-warning/10 text-warning border-warning/20';
      case 'high': return 'bg-destructive/10 text-destructive border-destructive/20';
    }
  };

  const getSeverityIcon = (severity: 'low' | 'medium' | 'high') => {
    switch (severity) {
      case 'low': return <CheckCircle2 className="h-4 w-4" />;
      case 'medium': return <AlertTriangle className="h-4 w-4" />;
      case 'high': return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const tempColor = weather.current.temperature < 50 
    ? 'text-blue-400' 
    : weather.current.temperature > 85 
      ? 'text-orange-400' 
      : 'text-foreground';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <span className="text-4xl">{currentEmoji}</span>
            <div>
              <div className="flex items-center gap-2">
                <span>{city.name}, {city.country}</span>
              </div>
              <p className="text-sm font-normal text-muted-foreground">
                {currentDescription}
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 max-h-[calc(90vh-120px)]">
          <div className="p-6 pt-2 space-y-6">
            {/* Current Conditions */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="col-span-2 sm:col-span-1">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Temperature</p>
                      <p className={`text-5xl font-bold ${tempColor}`}>
                        {weather.current.temperature}°F
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Feels like {weather.current.feelsLike}°F
                      </p>
                    </div>
                    <Thermometer className={`h-12 w-12 ${tempColor} opacity-50`} />
                  </div>
                </CardContent>
              </Card>

              <Card className="col-span-2 sm:col-span-1">
                <CardContent className="pt-6 grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Droplets className="h-5 w-5 text-blue-400" />
                    <div>
                      <p className="text-xs text-muted-foreground">Humidity</p>
                      <p className="font-semibold">{weather.current.humidity}%</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Wind className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Wind</p>
                      <p className="font-semibold">{weather.current.windSpeed} mph</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Eye className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Visibility</p>
                      <p className="font-semibold">{weather.current.visibility} mi</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Sun className="h-5 w-5 text-yellow-400" />
                    <div>
                      <p className="text-xs text-muted-foreground">UV Index</p>
                      <p className="font-semibold">{weather.current.uvIndex}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* EV Fleet Impact */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Battery className="h-5 w-5" />
                  EV Fleet Impact Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Badge 
                    variant="outline" 
                    className={`${getSeverityColor(weather.evImpact.severity)} flex items-center gap-1`}
                  >
                    {getSeverityIcon(weather.evImpact.severity)}
                    {weather.evImpact.severity.toUpperCase()} IMPACT
                  </Badge>
                </div>
                
                <p className="text-sm text-muted-foreground">
                  {weather.evImpact.recommendation}
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2 mb-1">
                      <Battery className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Range Reduction</span>
                    </div>
                    <p className={`text-2xl font-bold ${weather.evImpact.rangeReduction > 15 ? 'text-warning' : 'text-foreground'}`}>
                      -{weather.evImpact.rangeReduction}%
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2 mb-1">
                      <Zap className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Charging Efficiency</span>
                    </div>
                    <p className={`text-2xl font-bold ${weather.evImpact.chargingEfficiency < 90 ? 'text-warning' : 'text-success'}`}>
                      {weather.evImpact.chargingEfficiency}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 7-Day Forecast */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Clock className="h-5 w-5" />
                  7-Day Forecast
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-2">
                  {weather.daily.map((day, index) => {
                    const dayEmoji = getWeatherEmoji(day.weatherCode, true);
                    const isToday = index === 0;
                    
                    return (
                      <div 
                        key={day.date}
                        className={`flex flex-col items-center p-2 rounded-lg ${isToday ? 'bg-primary/10 border border-primary/20' : 'bg-muted/30'}`}
                      >
                        <span className="text-xs font-medium text-muted-foreground">
                          {getDayName(day.date, true)}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {formatDate(day.date)}
                        </span>
                        <span className="text-2xl my-1">{dayEmoji}</span>
                        <span className="text-sm font-semibold">{day.tempHigh}°</span>
                        <span className="text-xs text-muted-foreground">{day.tempLow}°</span>
                        {day.precipProbability > 0 && (
                          <span className="text-[10px] text-blue-400 flex items-center gap-0.5 mt-1">
                            <Droplets className="h-3 w-3" />
                            {day.precipProbability}%
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Fleet Operations Insights */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Zap className="h-5 w-5" />
                  Fleet Operations Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 rounded-lg bg-muted/50 space-y-2">
                  <h4 className="text-sm font-medium">Today's Recommendations</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {weather.current.temperature < 50 && (
                      <li className="flex items-center gap-2">
                        <span className="text-blue-400">•</span>
                        Pre-condition vehicles 15 minutes before departure
                      </li>
                    )}
                    {weather.current.temperature > 85 && (
                      <li className="flex items-center gap-2">
                        <span className="text-orange-400">•</span>
                        Park vehicles in shaded areas when idle
                      </li>
                    )}
                    {weather.daily[0]?.precipProbability > 50 && (
                      <li className="flex items-center gap-2">
                        <span className="text-blue-400">•</span>
                        High precipitation chance - allow extra travel time
                      </li>
                    )}
                    {weather.current.visibility < 5 && (
                      <li className="flex items-center gap-2">
                        <span className="text-warning">•</span>
                        Low visibility - use headlights and reduce speed
                      </li>
                    )}
                    {weather.evImpact.severity === 'low' && (
                      <li className="flex items-center gap-2">
                        <span className="text-success">•</span>
                        Optimal conditions for maximum fleet efficiency
                      </li>
                    )}
                  </ul>
                </div>

                <div className="p-3 rounded-lg bg-muted/50 space-y-2">
                  <h4 className="text-sm font-medium">Charging Schedule Suggestion</h4>
                  <p className="text-sm text-muted-foreground">
                    {weather.evImpact.chargingEfficiency >= 95 
                      ? "Optimal charging conditions. Standard charging schedules recommended."
                      : weather.evImpact.chargingEfficiency >= 85
                        ? "Slightly reduced efficiency. Consider extending charging windows by 10-15%."
                        : "Reduced charging efficiency expected. Extend charging windows by 20-25% and prioritize fast chargers."}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

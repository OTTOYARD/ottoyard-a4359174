import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, MapPin } from 'lucide-react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface City {
  name: string;
  coordinates: [number, number]; // [lng, lat]
  country: string;
}

const cities: City[] = [
  { name: "San Francisco", coordinates: [-122.4194, 37.7749], country: "USA" },
  { name: "Los Angeles", coordinates: [-118.2437, 34.0522], country: "USA" },
  { name: "New York", coordinates: [-74.0060, 40.7128], country: "USA" },
  { name: "Chicago", coordinates: [-87.6298, 41.8781], country: "USA" },
  { name: "Miami", coordinates: [-80.1918, 25.7617], country: "USA" },
  { name: "Seattle", coordinates: [-122.3321, 47.6062], country: "USA" },
  { name: "Denver", coordinates: [-104.9903, 39.7392], country: "USA" },
  { name: "Austin", coordinates: [-97.7431, 30.2672], country: "USA" },
  { name: "London", coordinates: [-0.1276, 51.5074], country: "UK" },
  { name: "Berlin", coordinates: [13.4050, 52.5200], country: "Germany" },
  { name: "Paris", coordinates: [2.3522, 48.8566], country: "France" },
  { name: "Tokyo", coordinates: [139.6917, 35.6895], country: "Japan" },
  { name: "Amsterdam", coordinates: [4.9041, 52.3676], country: "Netherlands" },
  { name: "Barcelona", coordinates: [2.1734, 41.3851], country: "Spain" },
  { name: "Toronto", coordinates: [-79.3832, 43.6532], country: "Canada" },
];

interface CitySearchBarProps {
  onCitySelect: (city: City) => void;
  currentCity: City;
}

const CitySearchBar: React.FC<CitySearchBarProps> = ({ onCitySelect, currentCity }) => {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  return (
    <div className="flex items-center space-x-2 mb-4">
      <MapPin className="h-5 w-5 text-primary flex-shrink-0" />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="justify-between min-w-[200px] bg-background/50 backdrop-blur-sm border-border/50"
          >
            <span className="truncate">
              {currentCity.name}, {currentCity.country}
            </span>
            <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0 bg-background/95 backdrop-blur-md border-border/50" align="start">
          <Command>
            <CommandInput placeholder="Search cities..." />
            <CommandList>
              <CommandEmpty>No cities found.</CommandEmpty>
              <CommandGroup>
                {cities.map((city) => (
                  <CommandItem
                    key={`${city.name}-${city.country}`}
                    value={`${city.name} ${city.country}`}
                    onSelect={() => {
                      onCitySelect(city);
                      setOpen(false);
                    }}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center justify-between w-full">
                      <span>{city.name}</span>
                      <span className="text-sm text-muted-foreground">{city.country}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default CitySearchBar;
export type { City };
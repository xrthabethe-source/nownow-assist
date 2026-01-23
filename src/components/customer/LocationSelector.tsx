import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSavedLocations, useDeleteLocation, SavedLocation } from "@/hooks/useSavedLocations";
import { ChevronDown, Home, Briefcase, MapPin, Star, Trash2 } from "lucide-react";

interface LocationSelectorProps {
  onSelect: (location: SavedLocation) => void;
}

const getLocationIcon = (name: string) => {
  const lower = name.toLowerCase();
  if (lower === "home") return Home;
  if (lower === "work") return Briefcase;
  return MapPin;
};

export function LocationSelector({ onSelect }: LocationSelectorProps) {
  const { data: locations, isLoading } = useSavedLocations();
  const deleteLocation = useDeleteLocation();

  if (isLoading || !locations?.length) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1">
          <MapPin className="h-4 w-4" />
          Saved
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Saved Locations</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {locations.map((location) => {
          const Icon = getLocationIcon(location.name);
          return (
            <DropdownMenuItem
              key={location.id}
              className="flex items-center justify-between cursor-pointer"
              onClick={() => onSelect(location)}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Icon className="h-4 w-4 shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <span className="font-medium truncate">{location.name}</span>
                    {location.is_default && (
                      <Star className="h-3 w-3 text-warning fill-warning" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {location.address}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                className="shrink-0 h-6 w-6 opacity-0 group-hover:opacity-100 hover:bg-destructive/10"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteLocation.mutate(location.id);
                }}
              >
                <Trash2 className="h-3 w-3 text-destructive" />
              </Button>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useSaveLocation } from "@/hooks/useSavedLocations";
import { Home, Briefcase, MapPin, Loader2 } from "lucide-react";

interface SaveLocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  address: string;
  latitude: number;
  longitude: number;
}

const quickNames = [
  { name: "Home", icon: Home },
  { name: "Work", icon: Briefcase },
  { name: "Other", icon: MapPin },
];

export function SaveLocationDialog({
  open,
  onOpenChange,
  address,
  latitude,
  longitude,
}: SaveLocationDialogProps) {
  const [name, setName] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const saveLocation = useSaveLocation();

  const handleSave = async () => {
    if (!name.trim()) return;

    await saveLocation.mutateAsync({
      name: name.trim(),
      address,
      latitude,
      longitude,
      is_default: isDefault,
    });

    setName("");
    setIsDefault(false);
    onOpenChange(false);
  };

  const handleQuickName = (quickName: string) => {
    setName(quickName);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Save Location</DialogTitle>
          <DialogDescription>
            Give this location a name so you can quickly select it next time.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Quick Select</Label>
            <div className="flex gap-2">
              {quickNames.map((quick) => (
                <Button
                  key={quick.name}
                  type="button"
                  variant={name === quick.name ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleQuickName(quick.name)}
                  className="flex-1"
                >
                  <quick.icon className="mr-1 h-4 w-4" />
                  {quick.name}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Location Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Home, Work, Gym"
            />
          </div>

          <div className="space-y-2">
            <Label>Address</Label>
            <p className="text-sm text-muted-foreground rounded-md bg-muted p-3">
              {address}
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="default"
              checked={isDefault}
              onCheckedChange={(checked) => setIsDefault(checked === true)}
            />
            <Label htmlFor="default" className="text-sm font-normal">
              Set as default location
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!name.trim() || saveLocation.isPending}
          >
            {saveLocation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Save Location
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

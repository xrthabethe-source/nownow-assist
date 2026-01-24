import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Car, Pencil } from "lucide-react";
import { useVehicles, Vehicle, VehicleInput } from "@/hooks/useVehicles";

interface VehiclesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const VehiclesDialog = ({ open, onOpenChange }: VehiclesDialogProps) => {
  const { vehicles, loading, addVehicle, updateVehicle, deleteVehicle } = useVehicles();
  const [showForm, setShowForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [formData, setFormData] = useState<VehicleInput>({
    make: "",
    model: "",
    registration_number: "",
    color: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // Reset form when opening add mode
  const handleAddNew = () => {
    setEditingVehicle(null);
    setFormData({ make: "", model: "", registration_number: "", color: "" });
    setShowForm(true);
  };

  // Populate form when editing
  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      make: vehicle.make,
      model: vehicle.model || "",
      registration_number: vehicle.registration_number,
      color: vehicle.color || "",
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.make || !formData.registration_number) return;

    setSubmitting(true);
    
    if (editingVehicle) {
      // Update existing vehicle
      const { error } = await updateVehicle(editingVehicle.id, formData);
      if (!error) {
        setFormData({ make: "", model: "", registration_number: "", color: "" });
        setShowForm(false);
        setEditingVehicle(null);
      }
    } else {
      // Add new vehicle
      const { error } = await addVehicle(formData);
      if (!error) {
        setFormData({ make: "", model: "", registration_number: "", color: "" });
        setShowForm(false);
      }
    }
    
    setSubmitting(false);
  };

  const handleCancel = () => {
    setFormData({ make: "", model: "", registration_number: "", color: "" });
    setShowForm(false);
    setEditingVehicle(null);
  };

  const handleDelete = async (id: string) => {
    await deleteVehicle(id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Car className="h-5 w-5 text-primary" />
            Saved Vehicles
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Existing vehicles */}
          {loading ? (
            <div className="text-center py-4 text-muted-foreground">Loading...</div>
          ) : vehicles.length === 0 && !showForm ? (
            <div className="text-center py-6 text-muted-foreground">
              <Car className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No vehicles saved yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {vehicles.map((vehicle) => (
                <div
                  key={vehicle.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div>
                    <p className="font-medium">
                      {vehicle.make} {vehicle.model}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {vehicle.registration_number}
                      {vehicle.color && ` • ${vehicle.color}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(vehicle)}
                      className="text-muted-foreground hover:text-primary"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(vehicle.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add/Edit vehicle form */}
          {showForm ? (
            <form onSubmit={handleSubmit} className="space-y-4 border-t pt-4">
              <p className="text-sm font-medium text-muted-foreground">
                {editingVehicle ? "Edit Vehicle" : "Add New Vehicle"}
              </p>
              
              <div className="space-y-2">
                <Label htmlFor="make">Make *</Label>
                <Input
                  id="make"
                  placeholder="e.g., Toyota, BMW, VW"
                  value={formData.make}
                  onChange={(e) =>
                    setFormData({ ...formData, make: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="model">Model</Label>
                <Input
                  id="model"
                  placeholder="e.g., Corolla, 3 Series, Golf"
                  value={formData.model}
                  onChange={(e) =>
                    setFormData({ ...formData, model: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="registration">Registration Number *</Label>
                <Input
                  id="registration"
                  placeholder="e.g., CA 123 456"
                  value={formData.registration_number}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      registration_number: e.target.value.toUpperCase(),
                    })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
                <Input
                  id="color"
                  placeholder="e.g., White, Black, Silver"
                  value={formData.color}
                  onChange={(e) =>
                    setFormData({ ...formData, color: e.target.value })
                  }
                />
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={handleCancel}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={submitting || !formData.make || !formData.registration_number}
                >
                  {submitting ? "Saving..." : editingVehicle ? "Update Vehicle" : "Save Vehicle"}
                </Button>
              </div>
            </form>
          ) : (
            <Button
              onClick={handleAddNew}
              className="w-full"
              variant="outline"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Vehicle
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

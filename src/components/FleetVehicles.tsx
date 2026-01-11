import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Car,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Zap,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { OEMVehicleIcon } from '@/components/OEMVehicleIcon';

interface FleetVehicle {
  id: string;
  vehicle_identifier: string;
  vehicle_name: string;
  vehicle_type: string;
  make: string | null;
  model: string | null;
  year: number | null;
  license_plate: string | null;
  status: string;
}

interface VehicleFormData {
  vehicle_name: string;
  vehicle_identifier: string;
  vehicle_type: string;
  make: string;
  model: string;
  year: string;
  license_plate: string;
  status: string;
}

const emptyFormData: VehicleFormData = {
  vehicle_name: '',
  vehicle_identifier: '',
  vehicle_type: 'EV',
  make: '',
  model: '',
  year: '',
  license_plate: '',
  status: 'active',
};

export const FleetVehicles: React.FC = () => {
  const [vehicles, setVehicles] = useState<FleetVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<FleetVehicle | null>(null);
  const [formData, setFormData] = useState<VehicleFormData>(emptyFormData);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_fleet_vehicles')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVehicles(data || []);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      toast.error('Failed to load fleet vehicles');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (vehicle?: FleetVehicle) => {
    if (vehicle) {
      setEditingVehicle(vehicle);
      setFormData({
        vehicle_name: vehicle.vehicle_name,
        vehicle_identifier: vehicle.vehicle_identifier,
        vehicle_type: vehicle.vehicle_type,
        make: vehicle.make || '',
        model: vehicle.model || '',
        year: vehicle.year?.toString() || '',
        license_plate: vehicle.license_plate || '',
        status: vehicle.status,
      });
    } else {
      setEditingVehicle(null);
      setFormData(emptyFormData);
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.vehicle_name.trim() || !formData.vehicle_identifier.trim()) {
      toast.error('Vehicle name and identifier are required');
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please sign in');
        return;
      }

      const vehicleData = {
        user_id: user.id,
        vehicle_name: formData.vehicle_name.trim(),
        vehicle_identifier: formData.vehicle_identifier.trim(),
        vehicle_type: formData.vehicle_type,
        make: formData.make.trim() || null,
        model: formData.model.trim() || null,
        year: formData.year ? parseInt(formData.year) : null,
        license_plate: formData.license_plate.trim() || null,
        status: formData.status,
      };

      if (editingVehicle) {
        const { error } = await supabase
          .from('user_fleet_vehicles')
          .update(vehicleData)
          .eq('id', editingVehicle.id);

        if (error) throw error;
        toast.success('Vehicle updated');
      } else {
        const { error } = await supabase
          .from('user_fleet_vehicles')
          .insert(vehicleData);

        if (error) throw error;
        toast.success('Vehicle added');
      }

      setDialogOpen(false);
      fetchVehicles();
    } catch (error: any) {
      console.error('Error saving vehicle:', error);
      toast.error(error.message || 'Failed to save vehicle');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (vehicleId: string) => {
    try {
      const { error } = await supabase
        .from('user_fleet_vehicles')
        .delete()
        .eq('id', vehicleId);

      if (error) throw error;
      toast.success('Vehicle removed');
      setDeleteConfirmId(null);
      fetchVehicles();
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      toast.error('Failed to remove vehicle');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-success/10 text-success border-success/20">Active</Badge>;
      case 'inactive':
        return <Badge className="bg-muted text-muted-foreground border-muted">Inactive</Badge>;
      case 'maintenance':
        return <Badge className="bg-warning/10 text-warning border-warning/20">Maintenance</Badge>;
      case 'sold':
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20">Sold</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getVehicleIcon = (vehicle: FleetVehicle) => {
    // If make is a known OEM, use the OEM icon
    if (vehicle.make) {
      return <OEMVehicleIcon name={vehicle.make} size="md" />;
    }
    // Fallback to generic icons
    if (vehicle.vehicle_type === 'EV' || vehicle.vehicle_type === 'Electric') {
      return <Zap className="h-4 w-4 text-primary" />;
    }
    return <Car className="h-4 w-4 text-muted-foreground" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {vehicles.length} vehicle{vehicles.length !== 1 ? 's' : ''} registered
        </p>
        <Button variant="outline" size="sm" onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Vehicle
        </Button>
      </div>

      {vehicles.length === 0 ? (
        <div className="text-center py-8 border border-dashed border-border rounded-lg">
          <Car className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No vehicles registered</p>
          <p className="text-sm text-muted-foreground mt-1">
            Add your fleet vehicles to track services and maintenance
          </p>
        </div>
      ) : (
        <ScrollArea className="h-[200px]">
          <div className="space-y-2">
            {vehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border hover:bg-muted/70 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-muted/50 flex items-center justify-center overflow-hidden">
                    {getVehicleIcon(vehicle)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{vehicle.vehicle_name}</p>
                      {getStatusBadge(vehicle.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {[
                        vehicle.make,
                        vehicle.model,
                        vehicle.year,
                        vehicle.license_plate,
                      ].filter(Boolean).join(' • ') || vehicle.vehicle_identifier}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenDialog(vehicle)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  {deleteConfirmId === vehicle.id ? (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(vehicle.id)}
                      >
                        Confirm
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteConfirmId(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteConfirmId(vehicle.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}

      {/* Add/Edit Vehicle Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingVehicle ? 'Edit Vehicle' : 'Add Vehicle'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="vehicle_name">Vehicle Name *</Label>
                <Input
                  id="vehicle_name"
                  placeholder="e.g., Company Tesla #1"
                  value={formData.vehicle_name}
                  onChange={(e) => setFormData({ ...formData, vehicle_name: e.target.value })}
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="vehicle_identifier">Identifier *</Label>
                <Input
                  id="vehicle_identifier"
                  placeholder="License plate, VIN, or internal ID"
                  value={formData.vehicle_identifier}
                  onChange={(e) => setFormData({ ...formData, vehicle_identifier: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="vehicle_type">Type</Label>
                <Select
                  value={formData.vehicle_type}
                  onValueChange={(value) => setFormData({ ...formData, vehicle_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EV">Electric (EV)</SelectItem>
                    <SelectItem value="Hybrid">Hybrid</SelectItem>
                    <SelectItem value="Gas">Gas</SelectItem>
                    <SelectItem value="Diesel">Diesel</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="sold">Sold</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="make">Make</Label>
                <Input
                  id="make"
                  placeholder="e.g., Tesla"
                  value={formData.make}
                  onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="model">Model</Label>
                <Input
                  id="model"
                  placeholder="e.g., Model 3"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="year">Year</Label>
                <Input
                  id="year"
                  type="number"
                  placeholder="e.g., 2024"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="license_plate">License Plate</Label>
                <Input
                  id="license_plate"
                  placeholder="e.g., ABC-1234"
                  value={formData.license_plate}
                  onChange={(e) => setFormData({ ...formData, license_plate: e.target.value })}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              {editingVehicle ? 'Update' : 'Add'} Vehicle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

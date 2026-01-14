import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Settings,
  User,
  Bell,
  Shield,
  Map,
  Database,
  Zap,
  AlertTriangle,
  CreditCard,
  DollarSign,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SettingsDialogProps {
  children: React.ReactNode;
}

const SettingsDialog: React.FC<SettingsDialogProps> = ({ children }) => {
  const [notifications, setNotifications] = useState({
    lowBattery: true,
    maintenance: true,
    routeAlerts: false,
    energyThresholds: true,
  });

  const [preferences, setPreferences] = useState({
    darkMode: true,
    autoRefresh: true,
    soundAlerts: false,
    emailDigest: true,
  });

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Settings className="h-5 w-5 mr-2 text-primary" />
            OTTOYARD Settings
          </DialogTitle>
          <DialogDescription>
            Configure your fleet management preferences and system settings.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="profile" className="h-full">
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 grid-rows-2 md:grid-rows-1 h-auto gap-0.5 md:gap-0">
            <TabsTrigger value="profile" className="text-[10px] md:text-sm">Profile</TabsTrigger>
            <TabsTrigger value="notifications" className="text-[10px] md:text-sm">Alerts</TabsTrigger>
            <TabsTrigger value="fleet" className="text-[10px] md:text-sm">Fleet</TabsTrigger>
            <TabsTrigger value="billing" className="text-[10px] md:text-sm">Billing</TabsTrigger>
            <TabsTrigger value="integrations" className="text-[10px] md:text-sm">Services</TabsTrigger>
            <TabsTrigger value="security" className="text-[10px] md:text-sm">Security</TabsTrigger>
          </TabsList>

          <div className="mt-4 overflow-y-auto max-h-[60vh]">
            <TabsContent value="profile" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    Profile Management
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input id="name" placeholder="John Doe" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" placeholder="john@ottoyard.com" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Input id="role" placeholder="Fleet Manager" />
                  </div>
                  <Separator />
                  <div className="space-y-4">
                    <h4 className="font-medium">Preferences</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="dark-mode">Dark Mode</Label>
                        <Switch
                          id="dark-mode"
                          checked={preferences.darkMode}
                          onCheckedChange={(checked) =>
                            setPreferences({ ...preferences, darkMode: checked })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="auto-refresh">Auto Refresh</Label>
                        <Switch
                          id="auto-refresh"
                          checked={preferences.autoRefresh}
                          onCheckedChange={(checked) =>
                            setPreferences({ ...preferences, autoRefresh: checked })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="sound-alerts">Sound Alerts</Label>
                        <Switch
                          id="sound-alerts"
                          checked={preferences.soundAlerts}
                          onCheckedChange={(checked) =>
                            setPreferences({ ...preferences, soundAlerts: checked })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="email-digest">Email Digest</Label>
                        <Switch
                          id="email-digest"
                          checked={preferences.emailDigest}
                          onCheckedChange={(checked) =>
                            setPreferences({ ...preferences, emailDigest: checked })
                          }
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Bell className="h-4 w-4 mr-2" />
                    Alert Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label>Low Battery Alerts</Label>
                        <p className="text-sm text-muted-foreground">
                          Get notified when vehicles have low battery
                        </p>
                      </div>
                      <Switch
                        checked={notifications.lowBattery}
                        onCheckedChange={(checked) =>
                          setNotifications({ ...notifications, lowBattery: checked })
                        }
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label>Maintenance Reminders</Label>
                        <p className="text-sm text-muted-foreground">
                          Alerts for upcoming maintenance schedules
                        </p>
                      </div>
                      <Switch
                        checked={notifications.maintenance}
                        onCheckedChange={(checked) =>
                          setNotifications({ ...notifications, maintenance: checked })
                        }
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label>Route Alerts</Label>
                        <p className="text-sm text-muted-foreground">
                          Notifications for route deviations and delays
                        </p>
                      </div>
                      <Switch
                        checked={notifications.routeAlerts}
                        onCheckedChange={(checked) =>
                          setNotifications({ ...notifications, routeAlerts: checked })
                        }
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label>Energy Thresholds</Label>
                        <p className="text-sm text-muted-foreground">
                          Alerts when depot energy levels reach thresholds
                        </p>
                      </div>
                      <Switch
                        checked={notifications.energyThresholds}
                        onCheckedChange={(checked) =>
                          setNotifications({ ...notifications, energyThresholds: checked })
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="fleet" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center">
                      <Zap className="h-4 w-4 mr-2" />
                      Fleet Summary
                    </span>
                     <div className="flex space-x-2">
                       <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                         42 Active
                       </Badge>
                       <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                         8 Charging
                       </Badge>
                       <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                         3 Maintenance
                       </Badge>
                     </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="battery-threshold">Low Battery Threshold (%)</Label>
                      <Input id="battery-threshold" type="number" placeholder="20" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maintenance-interval">Maintenance Interval (days)</Label>
                      <Input id="maintenance-interval" type="number" placeholder="30" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="depot-capacity">Default Depot Capacity (kWh)</Label>
                    <Input id="depot-capacity" type="number" placeholder="5000" />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="billing" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Billing & Pricing
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">Monthly Subscription</h4>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                        <div>
                          <p className="font-medium">Stall Reservation</p>
                          <p className="text-sm text-muted-foreground">Per vehicle per month</p>
                        </div>
                        <span className="font-bold text-lg">$2,000</span>
                      </div>
                      <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                        <div>
                          <p className="font-medium">Software Usage</p>
                          <p className="text-sm text-muted-foreground">Per vehicle per month</p>
                        </div>
                        <span className="font-bold text-lg">$400</span>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <h4 className="font-medium">Service Pricing</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex justify-between p-2 bg-muted/50 rounded">
                        <span className="text-sm">Routine Maintenance</span>
                        <span className="text-sm font-medium">$500</span>
                      </div>
                      <div className="flex justify-between p-2 bg-muted/50 rounded">
                        <span className="text-sm">Battery Check</span>
                        <span className="text-sm font-medium">$50</span>
                      </div>
                      <div className="flex justify-between p-2 bg-muted/50 rounded">
                        <span className="text-sm">Safety Check</span>
                        <span className="text-sm font-medium">$100</span>
                      </div>
                      <div className="flex justify-between p-2 bg-muted/50 rounded">
                        <span className="text-sm">Interior Detail</span>
                        <span className="text-sm font-medium">$100</span>
                      </div>
                      <div className="flex justify-between p-2 bg-muted/50 rounded">
                        <span className="text-sm">Exterior Detail</span>
                        <span className="text-sm font-medium">$100</span>
                      </div>
                      <div className="flex justify-between p-2 bg-muted/50 rounded">
                        <span className="text-sm">Full Detail</span>
                        <span className="text-sm font-medium">$150</span>
                      </div>
                      <div className="flex justify-between p-2 bg-muted/50 rounded">
                        <span className="text-sm">Premium Detail</span>
                        <span className="text-sm font-medium">$250</span>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <h4 className="font-medium">Current Usage</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Active Vehicles</span>
                        <span className="font-medium">42</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Monthly Stall Cost</span>
                        <span className="font-medium">$84,000</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Monthly Software Cost</span>
                        <span className="font-medium">$16,800</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total Monthly</span>
                        <span>$100,800</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1">
                      <DollarSign className="h-4 w-4 mr-2" />
                      View Invoice History
                    </Button>
                    <Button className="flex-1">
                      Update Payment Method
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="integrations" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Database className="h-4 w-4 mr-2" />
                    Service Integrations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Map className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium">Mapbox Integration</p>
                          <p className="text-sm text-muted-foreground">Live mapping and route optimization</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                        Connected
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Database className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Supabase Backend</p>
                          <p className="text-sm text-muted-foreground">Data storage and authentication</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                        Setup Required
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Zap className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Energy Grid API</p>
                          <p className="text-sm text-muted-foreground">Real-time energy pricing and grid data</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                        Setup Required
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Shield className="h-4 w-4 mr-2" />
                    Security Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Shield className="h-5 w-5 text-success" />
                        <div>
                          <p className="font-medium">Two-Factor Authentication</p>
                          <p className="text-sm text-muted-foreground">Enhanced account security</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                        Enabled
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <AlertTriangle className="h-5 w-5 text-warning" />
                        <div>
                          <p className="font-medium">Session Timeout</p>
                          <p className="text-sm text-muted-foreground">Auto-logout after inactivity</p>
                        </div>
                      </div>
                      <Input className="w-20" placeholder="30m" />
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-2">
                      <h4 className="font-medium">API Access</h4>
                      <div className="space-y-2">
                        <Label htmlFor="api-key">API Key</Label>
                        <div className="flex space-x-2">
                          <Input 
                            id="api-key" 
                            type="password" 
                            value="oy-*********************" 
                            readOnly 
                            className="flex-1"
                          />
                          <Button variant="outline" size="sm">
                            Regenerate
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsDialog;
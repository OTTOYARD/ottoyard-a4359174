import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type NotificationType = 'low_battery' | 'maintenance_due' | 'charging_complete' | 'job_started' | 'critical_alert';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  vehicleId?: string;
  vehiclePlate?: string;
  depotName?: string;
  timestamp: Date;
  read: boolean;
  severity: 'info' | 'warning' | 'critical';
}

const NOTIFICATION_SOUNDS = {
  info: '/notification-info.mp3',
  warning: '/notification-warning.mp3', 
  critical: '/notification-critical.mp3',
};

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playSound = useCallback((severity: 'info' | 'warning' | 'critical') => {
    if (!soundEnabled) return;
    
    try {
      // Use Web Audio API for more reliable playback
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Different tones for different severities
      switch (severity) {
        case 'critical':
          oscillator.frequency.value = 880; // High A
          oscillator.type = 'square';
          gainNode.gain.value = 0.1;
          break;
        case 'warning':
          oscillator.frequency.value = 660; // E
          oscillator.type = 'triangle';
          gainNode.gain.value = 0.08;
          break;
        default:
          oscillator.frequency.value = 440; // A
          oscillator.type = 'sine';
          gainNode.gain.value = 0.05;
      }
      
      oscillator.start();
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (e) {
      console.log('Audio playback not available');
    }
  }, [soundEnabled]);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: crypto.randomUUID(),
      timestamp: new Date(),
      read: false,
    };
    
    setNotifications(prev => [newNotification, ...prev].slice(0, 50)); // Keep last 50
    setUnreadCount(prev => prev + 1);
    playSound(notification.severity);
  }, [playSound]);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  // Subscribe to real-time events
  useEffect(() => {
    // Subscribe to vehicle status changes (low battery, etc.)
    const vehiclesChannel = supabase
      .channel('vehicles-notifications')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'ottoq_vehicles',
      }, (payload) => {
        const vehicle = payload.new as any;
        const oldVehicle = payload.old as any;
        
        // Low battery alert (SOC dropped below 20%)
        if (vehicle.soc < 0.2 && oldVehicle.soc >= 0.2) {
          addNotification({
            type: 'low_battery',
            title: 'Low Battery Alert',
            message: `Vehicle ${vehicle.plate || vehicle.id.slice(0, 8)} battery at ${Math.round(vehicle.soc * 100)}%`,
            vehicleId: vehicle.id,
            vehiclePlate: vehicle.plate,
            severity: vehicle.soc < 0.1 ? 'critical' : 'warning',
          });
        }
      })
      .subscribe();

    // Subscribe to job state changes
    const jobsChannel = supabase
      .channel('jobs-notifications')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'ottoq_jobs',
      }, (payload) => {
        const job = payload.new as any;
        const oldJob = payload.old as any;
        
        // Charging complete
        if (job.job_type === 'CHARGE' && job.state === 'COMPLETED' && oldJob.state !== 'COMPLETED') {
          addNotification({
            type: 'charging_complete',
            title: 'Charging Complete',
            message: `Vehicle charging session completed at depot`,
            vehicleId: job.vehicle_id,
            severity: 'info',
          });
        }
        
        // Maintenance started
        if (job.job_type === 'MAINTENANCE' && job.state === 'ACTIVE' && oldJob.state !== 'ACTIVE') {
          addNotification({
            type: 'maintenance_due',
            title: 'Maintenance Started',
            message: `Vehicle maintenance session has started`,
            vehicleId: job.vehicle_id,
            severity: 'info',
          });
        }
      })
      .subscribe();

    // Subscribe to resource alerts (stalls going out of service)
    const resourcesChannel = supabase
      .channel('resources-notifications')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'ottoq_resources',
      }, (payload) => {
        const resource = payload.new as any;
        const oldResource = payload.old as any;
        
        // Resource went out of service
        if (resource.status === 'OUT_OF_SERVICE' && oldResource.status !== 'OUT_OF_SERVICE') {
          addNotification({
            type: 'critical_alert',
            title: 'Resource Unavailable',
            message: `${resource.resource_type.replace('_', ' ')} #${resource.index} is now out of service`,
            severity: 'warning',
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(vehiclesChannel);
      supabase.removeChannel(jobsChannel);
      supabase.removeChannel(resourcesChannel);
    };
  }, [addNotification]);

  return {
    notifications,
    unreadCount,
    soundEnabled,
    setSoundEnabled,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotifications,
  };
}

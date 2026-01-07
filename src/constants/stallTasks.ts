// Task definitions for each resource type in depot stalls

export type TaskKey = string;

export interface TaskDefinition {
  key: TaskKey;
  label: string;
  description?: string;
  requiresInput?: boolean;
  inputType?: 'text' | 'select';
  options?: string[];
}

export interface ResourceTaskConfig {
  resourceType: string;
  tasks: TaskDefinition[];
  deploymentTaskKey: string; // The final confirmation task
}

// Maintenance type options (consistent with dashboard)
export const MAINTENANCE_TYPES = [
  'Routine Maintenance',
  'Battery Check',
  'Safety Inspection',
  'Tire Rotation',
  'LIDAR Calibration',
  'Sensor Cleaning',
  'Preventive Maintenance',
  'Brake Inspection',
  'Software Update',
  'Custom'
] as const;

export type MaintenanceType = typeof MAINTENANCE_TYPES[number];

// Movement queue target options
export const MOVEMENT_TARGETS = [
  { value: 'CHARGE_STALL', label: 'Charging Stall' },
  { value: 'CLEAN_DETAIL_STALL', label: 'Cleaning Stall' },
  { value: 'MAINTENANCE_BAY', label: 'Maintenance Bay' },
  { value: 'STAGING_STALL', label: 'Staging Area' }
] as const;

// Task configurations by resource type
export const STALL_TASK_CONFIGS: Record<string, ResourceTaskConfig> = {
  CHARGE_STALL: {
    resourceType: 'CHARGE_STALL',
    deploymentTaskKey: 'confirm_deployment',
    tasks: [
      { key: 'charging_initiated', label: 'Charging Initiated', description: 'Vehicle connected and charging started' },
      { key: 'charging_completed', label: 'Charging Completed', description: 'Battery reached target SOC' },
      { key: 'interior_clear', label: 'Interior Clear', description: 'No items left in vehicle interior' },
      { key: 'exterior_clear', label: 'Exterior Clear', description: 'No obstructions around vehicle' },
      { key: 'confirm_deployment', label: 'Confirm Deployment', description: 'Ready to return to service' }
    ]
  },
  CLEAN_DETAIL_STALL: {
    resourceType: 'CLEAN_DETAIL_STALL',
    deploymentTaskKey: 'confirm_deployment',
    tasks: [
      { key: 'interior_cleaned', label: 'Interior Cleaned', description: 'All interior surfaces cleaned' },
      { key: 'exterior_cleaned', label: 'Exterior Cleaned', description: 'Exterior wash completed' },
      { key: 'sensors_clear', label: 'Sensors Clear', description: 'All sensors cleaned and unobstructed' },
      { key: 'confirm_deployment', label: 'Confirm for Redeployment', description: 'Ready to return to service' }
    ]
  },
  MAINTENANCE_BAY: {
    resourceType: 'MAINTENANCE_BAY',
    deploymentTaskKey: 'confirm_deployment',
    tasks: [
      { key: 'received_in_bay', label: 'Received in Bay', description: 'Vehicle checked into maintenance bay' },
      { 
        key: 'maintenance_type', 
        label: 'Maintenance Type', 
        description: 'Select type of maintenance',
        requiresInput: true,
        inputType: 'select',
        options: [...MAINTENANCE_TYPES]
      },
      { 
        key: 'custom_task', 
        label: 'Custom Task Details', 
        description: 'Describe custom maintenance work',
        requiresInput: true,
        inputType: 'text'
      },
      { key: 'maintenance_completed', label: 'Maintenance Completed', description: 'All maintenance work finished' },
      { key: 'confirm_deployment', label: 'Confirm Redeployment', description: 'Ready to return to service' }
    ]
  },
  STAGING_STALL: {
    resourceType: 'STAGING_STALL',
    deploymentTaskKey: 'confirm_exit',
    tasks: [
      { key: 'vehicle_parked', label: 'Vehicle Parked', description: 'Vehicle secured in staging area' },
      { key: 'confirm_exit', label: 'Confirm Exit', description: 'Release vehicle from staging' }
    ]
  }
};

// Helper to get task config for a resource type
export function getTaskConfigForResource(resourceType: string): ResourceTaskConfig | null {
  return STALL_TASK_CONFIGS[resourceType] || null;
}

// Helper to check if all required tasks are complete (excluding deployment task)
export function areAllTasksComplete(
  resourceType: string, 
  completedTasks: Set<string>
): boolean {
  const config = getTaskConfigForResource(resourceType);
  if (!config) return false;
  
  // Filter out deployment task and optional input tasks (except maintenance_type which is required)
  const requiredTasks = config.tasks.filter(t => 
    t.key !== config.deploymentTaskKey && (!t.requiresInput || t.key === 'maintenance_type')
  );
  return requiredTasks.every(task => completedTasks.has(task.key));
}

// Staging stall configuration (stored info as requested)
export const STAGING_STALL_CONFIG = {
  minCount: 10,
  maxCount: 20,
  defaultCount: 15,
  description: 'Passive parking spots for vehicle staging, not included in active service stall counts'
};

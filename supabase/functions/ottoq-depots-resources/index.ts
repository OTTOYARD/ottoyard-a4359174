// OTTOQ: Depot Resources Grid
// Returns the full grid with live status + mock occupancy for demo purposes

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Mock occupation pattern per depot (for demo purposes)
const MOCK_OCCUPATION = {
  CHARGE_STALL: 3,
  CLEAN_DETAIL_STALL: 2,
  MAINTENANCE_BAY: 1,
  STAGING_STALL: 2,
};

// Vehicle names for mock data
const MOCK_VEHICLES = [
  { ref: 'AV-001', oem: 'Waymo' },
  { ref: 'AV-002', oem: 'Zoox' },
  { ref: 'AV-003', oem: 'Cruise' },
  { ref: 'AV-004', oem: 'Motional' },
  { ref: 'AV-005', oem: 'Nuro' },
  { ref: 'AV-006', oem: 'Aurora' },
  { ref: 'AV-007', oem: 'Waymo' },
  { ref: 'AV-008', oem: 'Zoox' },
];

// Map resource type to job type
function resourceTypeToJobType(resourceType: string): string {
  switch (resourceType) {
    case 'CHARGE_STALL':
      return 'CHARGE';
    case 'CLEAN_DETAIL_STALL':
      return 'DETAILING';
    case 'MAINTENANCE_BAY':
      return 'MAINTENANCE';
    case 'STAGING_STALL':
      return 'DOWNTIME_PARK';
    default:
      return 'CHARGE';
  }
}

// Generate job label based on type
function getJobLabel(jobType: string, index: number): string {
  switch (jobType) {
    case 'CHARGE':
      return 'Charging';
    case 'DETAILING':
      return index % 2 === 0 ? 'Exterior Wash' : 'Interior Detail';
    case 'MAINTENANCE':
      return 'Diagnostic Check';
    case 'DOWNTIME_PARK':
      return 'Parked';
    default:
      return 'Active';
  }
}

// Generate deterministic mock data for consistent display
function generateMockOccupancy(resources: any[], depotId: string): Map<string, any> {
  const mockJobs = new Map();
  
  // Group resources by type
  const grouped: { [key: string]: any[] } = {};
  resources.forEach((r) => {
    if (!grouped[r.resource_type]) {
      grouped[r.resource_type] = [];
    }
    grouped[r.resource_type].push(r);
  });

  let vehicleIndex = 0;
  
  for (const [type, count] of Object.entries(MOCK_OCCUPATION)) {
    const typeResources = grouped[type] || [];
    for (let i = 0; i < count && i < typeResources.length; i++) {
      const resource = typeResources[i];
      const vehicle = MOCK_VEHICLES[vehicleIndex % MOCK_VEHICLES.length];
      const jobType = resourceTypeToJobType(type);
      
      // Use deterministic ID based on depot and resource
      const mockJobId = `mock-${depotId.substring(0, 8)}-${resource.id.substring(0, 8)}`;
      const mockVehicleId = `mock-v-${vehicleIndex.toString().padStart(3, '0')}`;
      
      // Calculate varied ETA based on index (20-60 min remaining)
      const etaSeconds = 1200 + (vehicleIndex * 300) + Math.floor(Math.random() * 600);
      
      mockJobs.set(resource.id, {
        id: mockJobId,
        vehicle_id: mockVehicleId,
        vehicle_ref: vehicle.ref,
        oem: vehicle.oem,
        job_type: jobType,
        job_label: getJobLabel(jobType, i),
        state: 'ACTIVE',
        started_at: new Date(Date.now() - (30 + vehicleIndex * 5) * 60000).toISOString(),
        eta_seconds: etaSeconds,
        metadata_jsonb: { mock: true },
      });
      
      vehicleIndex++;
    }
  }
  
  return mockJobs;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const depot_id = pathParts[pathParts.length - 1];

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Handle POST request for reset
    if (req.method === 'POST') {
      const body = await req.json().catch(() => ({}));
      const targetDepotId = body.depot_id || depot_id;
      
      if (body.reset && targetDepotId && targetDepotId !== 'ottoq-depots-resources') {
        // Reset: clear all task confirmations for this depot
        const { data: activeJobs } = await supabase
          .from('ottoq_jobs')
          .select('id')
          .eq('depot_id', targetDepotId)
          .eq('state', 'ACTIVE');
        
        if (activeJobs && activeJobs.length > 0) {
          const jobIds = activeJobs.map(j => j.id);
          await supabase
            .from('ottoq_task_confirmations')
            .delete()
            .in('job_id', jobIds);
        }
        
        // Also clear any mock task confirmations
        await supabase
          .from('ottoq_task_confirmations')
          .delete()
          .like('job_id', 'mock-%');
        
        return new Response(JSON.stringify({ success: true, message: 'Depot reset to defaults' }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    if (!depot_id || depot_id === 'ottoq-depots-resources') {
      return new Response(JSON.stringify({ error: 'depot_id required in path' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get depot info
    const { data: depot, error: depotError } = await supabase
      .from('ottoq_depots')
      .select('*, ottoq_cities(name)')
      .eq('id', depot_id)
      .single();

    if (depotError || !depot) {
      return new Response(JSON.stringify({ error: 'Depot not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get all resources for this depot
    const { data: resources, error: resourcesError } = await supabase
      .from('ottoq_resources')
      .select('*')
      .eq('depot_id', depot_id)
      .order('resource_type')
      .order('index');

    if (resourcesError) {
      console.error('Resources query error:', resourcesError);
      return new Response(JSON.stringify({ error: resourcesError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get job IDs from resources (real jobs)
    const realJobIds = resources
      .filter(r => r.current_job_id && !r.current_job_id.startsWith('mock-'))
      .map(r => r.current_job_id);

    // Fetch real jobs if any exist
    let jobsMap = new Map();
    if (realJobIds.length > 0) {
      const { data: jobs, error: jobsError } = await supabase
        .from('ottoq_jobs')
        .select(`
          id,
          vehicle_id,
          job_type,
          state,
          scheduled_start_at,
          started_at,
          eta_seconds,
          metadata_jsonb,
          ottoq_vehicles(external_ref, oem)
        `)
        .in('id', realJobIds);

      if (!jobsError && jobs) {
        jobs.forEach(job => jobsMap.set(job.id, job));
      }
    }

    // Check if we need mock data (no real occupied stalls)
    const hasRealOccupiedStalls = resources.some(r => 
      r.current_job_id && 
      !r.current_job_id.startsWith('mock-') && 
      (r.status === 'BUSY' || r.status === 'OCCUPIED' || r.status === 'RESERVED')
    );

    // Generate mock occupancy if no real jobs
    let mockJobsMap = new Map();
    if (!hasRealOccupiedStalls) {
      mockJobsMap = generateMockOccupancy(resources, depot_id);
    }

    // Format resources with labels
    const formattedResources = resources.map((r, idx) => {
      let label = '';
      let job_id = r.current_job_id;
      let vehicle_id = null;
      let status = r.status;

      // Check for mock job first
      if (mockJobsMap.has(r.id)) {
        const mockJob = mockJobsMap.get(r.id);
        status = r.resource_type === 'STAGING_STALL' ? 'RESERVED' : 'BUSY';
        job_id = mockJob.id;
        vehicle_id = mockJob.vehicle_id;
        
        // Calculate time remaining
        const mins = Math.floor(mockJob.eta_seconds / 60);
        const hours = Math.floor(mins / 60);
        let timeRemaining = hours > 0 ? `${hours}h ${mins % 60}m left` : `${mins}m left`;
        
        label = `${mockJob.oem} ${mockJob.vehicle_ref} — ${mockJob.job_label} — ${timeRemaining}`;
      }
      // Check for real job
      else if (r.current_job_id && jobsMap.has(r.current_job_id)) {
        const job = jobsMap.get(r.current_job_id);
        vehicle_id = job.vehicle_id;
        const vehicleRef = job.ottoq_vehicles?.external_ref || job.vehicle_id.substring(0, 8);
        const oem = job.ottoq_vehicles?.oem || '';
        
        let jobLabel = '';
        switch (job.job_type) {
          case 'CHARGE':
            jobLabel = 'Charging';
            break;
          case 'MAINTENANCE':
            jobLabel = job.metadata_jsonb?.task || 'Maintenance';
            break;
          case 'DETAILING':
            jobLabel = 'Detailing';
            break;
          case 'DOWNTIME_PARK':
            jobLabel = 'Parked';
            break;
        }

        // Calculate time remaining
        let timeRemaining = '';
        if (job.state === 'ACTIVE' && job.eta_seconds && job.started_at) {
          const elapsedMs = Date.now() - new Date(job.started_at).getTime();
          const remainingSeconds = Math.max(0, job.eta_seconds - Math.floor(elapsedMs / 1000));
          const mins = Math.floor(remainingSeconds / 60);
          const hours = Math.floor(mins / 60);
          
          if (hours > 0) {
            timeRemaining = `${hours}h ${mins % 60}m left`;
          } else {
            timeRemaining = `${mins}m left`;
          }
        } else if (job.state === 'SCHEDULED' && job.scheduled_start_at) {
          const untilStart = new Date(job.scheduled_start_at).getTime() - Date.now();
          if (untilStart > 0) {
            const mins = Math.floor(untilStart / 60000);
            timeRemaining = `starts in ${mins}m`;
          } else {
            timeRemaining = 'starting soon';
          }
        }

        label = `${oem} ${vehicleRef} — ${jobLabel}${timeRemaining ? ' — ' + timeRemaining : ''}`;
      }
      // Available or Out of Service
      else if (status === 'AVAILABLE') {
        label = 'Available';
      } else if (status === 'OUT_OF_SERVICE') {
        label = 'Out of Service';
      }

      return {
        id: r.id,
        type: r.resource_type,
        index: r.index,
        status,
        label,
        job_id,
        vehicle_id,
      };
    });

    // Generate energy analytics based on depot activity
    const occupiedCount = formattedResources.filter(r => 
      r.status === 'OCCUPIED' || r.status === 'BUSY' || r.status === 'RESERVED'
    ).length;
    const totalResources = formattedResources.length;
    const utilizationRate = totalResources > 0 ? occupiedCount / totalResources : 0;
    
    const baseConsumption = 8500 + (totalResources * 45);
    const energyConsumed = Math.round(baseConsumption * (0.7 + utilizationRate * 0.6));
    const energyRegenerated = Math.round(energyConsumed * (0.35 + Math.random() * 0.15));
    const efficiency = Math.round(75 + Math.random() * 15);
    const peakDemand = Math.round((energyConsumed / 24) * (1.4 + Math.random() * 0.3));
    const carbonOffset = Math.round(energyConsumed * 0.42);

    const energyAnalytics = {
      energyConsumed,
      energyRegenerated,
      efficiency,
      peakDemand,
      carbonOffset,
    };

    return new Response(
      JSON.stringify({
        depot_id: depot.id,
        depot_name: depot.name,
        city: depot.ottoq_cities?.name,
        branding: depot.config_jsonb?.ottoq_branding || 'Powered by OTTO-Q Technology',
        resources: formattedResources,
        energyAnalytics,
        updated_at: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Depot resources error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});


-- Restrict SECURITY DEFINER functions: revoke anon access, grant to authenticated only

-- get_random_vehicles_for_city: returns fleet data, should require auth
REVOKE EXECUTE ON FUNCTION public.get_random_vehicles_for_city(uuid, integer) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_random_vehicles_for_city(uuid, integer) TO authenticated;

-- create_ottoq_depot_resources: admin depot setup function
REVOKE EXECUTE ON FUNCTION public.create_ottoq_depot_resources(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.create_ottoq_depot_resources(uuid) TO authenticated;

-- has_role: used in RLS policies, should not be callable by anon to enumerate roles
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;

-- Also fix search_path on ottoq_sim_seed_city and ottoq_sim_seed_all (mutable search_path finding)
CREATE OR REPLACE FUNCTION public.ottoq_sim_seed_all()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
declare
  v1 jsonb;
  v2 jsonb;
  v3 jsonb;
begin
  v1 := public.ottoq_sim_seed_city('Nashville', 40, 2);
  v2 := public.ottoq_sim_seed_city('Austin', 40, 2);
  v3 := public.ottoq_sim_seed_city('LA', 40, 2);
  return jsonb_build_object('ok', true, 'results', jsonb_build_array(v1, v2, v3));
end;
$function$;

CREATE OR REPLACE FUNCTION public.ottoq_sim_seed_city(p_city_name text, p_vehicle_count integer DEFAULT 35, p_depot_count integer DEFAULT 2)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
declare
  v_city_id uuid;
  v_i int;
  v_depot_id uuid;
  v_lat numeric;
  v_lon numeric;
  v_depot_offsets jsonb := '[
    {"lat": 0.02, "lng": 0.03},
    {"lat": -0.02, "lng": -0.03},
    {"lat": 0.01, "lng": -0.04},
    {"lat": -0.01, "lng": 0.04}
  ]'::jsonb;
  v_center_lat numeric;
  v_center_lng numeric;
begin
  if p_city_name = 'Nashville' then
    v_center_lat := 36.1627; v_center_lng := -86.7816;
  elsif p_city_name = 'Austin' then
    v_center_lat := 30.2672; v_center_lng := -97.7431;
  else
    v_center_lat := 34.0522; v_center_lng := -118.2437;
  end if;

  insert into public.ottoq_cities (name)
  values (p_city_name)
  on conflict (name) do update set tz = excluded.tz
  returning id into v_city_id;

  for v_i in 1..p_depot_count loop
    v_lat := v_center_lat + ((v_depot_offsets->((v_i - 1) % 4))::jsonb->>'lat')::numeric;
    v_lon := v_center_lng + ((v_depot_offsets->((v_i - 1) % 4))::jsonb->>'lng')::numeric;

    insert into public.ottoq_depots (city_id, name, address, lat, lon)
    values (v_city_id, p_city_name || ' Depot ' || v_i, p_city_name || ' (Demo Address ' || v_i || ')', v_lat, v_lon)
    returning id into v_depot_id;

    for v_i in 1..12 loop
      insert into public.ottoq_resources (depot_id, resource_type, index, status)
      values (v_depot_id, 'CHARGE_STALL'::ottoq_resource_type, v_i, 'AVAILABLE'::ottoq_resource_status);
    end loop;

    for v_i in 1..4 loop
      insert into public.ottoq_resources (depot_id, resource_type, index, status)
      values (v_depot_id, 'CLEAN_DETAIL_STALL'::ottoq_resource_type, v_i, 'AVAILABLE'::ottoq_resource_status);
    end loop;

    for v_i in 1..2 loop
      insert into public.ottoq_resources (depot_id, resource_type, index, status)
      values (v_depot_id, 'MAINTENANCE_BAY'::ottoq_resource_type, v_i, 'AVAILABLE'::ottoq_resource_status);
    end loop;

    for v_i in 1..6 loop
      insert into public.ottoq_resources (depot_id, resource_type, index, status)
      values (v_depot_id, 'STAGING_STALL'::ottoq_resource_type, v_i, 'AVAILABLE'::ottoq_resource_status);
    end loop;
  end loop;

  for v_i in 1..p_vehicle_count loop
    insert into public.ottoq_vehicles (city_id, oem, external_ref, soc, odometer_km, status, last_telemetry_at)
    values (
      v_city_id,
      case when v_i % 3 = 0 then 'WAYMO' when v_i % 3 = 1 then 'ZOOX' else 'MOTIONAL' end,
      p_city_name || ' ' || lpad(v_i::text, 3, '0'),
      greatest(0.10, least(1.0, (random() * 0.9 + 0.1))),
      (random() * 120000)::int,
      case when v_i % 7 = 0 then 'IN_SERVICE'::ottoq_vehicle_status else 'IDLE'::ottoq_vehicle_status end,
      now() - (random() * interval '15 minutes')
    )
    on conflict (external_ref) do update
      set soc = excluded.soc,
          odometer_km = excluded.odometer_km,
          status = excluded.status,
          last_telemetry_at = excluded.last_telemetry_at,
          updated_at = now();
  end loop;

  return jsonb_build_object(
    'ok', true,
    'city', p_city_name,
    'vehicles_seeded', p_vehicle_count,
    'depots_seeded', p_depot_count
  );
end;
$function$;

-- Fix ottoq_sim_tick search_path
CREATE OR REPLACE FUNCTION public.ottoq_sim_tick(p_city_name text DEFAULT NULL::text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
declare
  v_now timestamptz := now();
  v_city_id uuid;
  v_cfg jsonb;
  v_reset_seconds int;
  v_reserve_seconds int;
  v_util_target numeric;
  v_charge_avg int;
  v_charge_var int;
  v_jobs_created int := 0;
  v_jobs_completed int := 0;
  v_events_emitted int := 0;
  v_vehicle record;
  v_depot record;
  v_resource record;
  v_job_id uuid;
  v_job_type ottoq_job_type;
  v_target_resource_type ottoq_resource_type;
  v_soc numeric;
  v_soc_delta numeric;
  v_completed_ids uuid[];
begin
  select s.config_jsonb into v_cfg
  from public.ottoq_simulator_state s
  order by s.created_at asc
  limit 1;

  if v_cfg is null then
    v_cfg := '{}'::jsonb;
  end if;

  v_reset_seconds := coalesce((v_cfg->>'reset_interval_seconds')::int, 420);
  v_reserve_seconds := coalesce((v_cfg->>'reservation_interval_seconds')::int, 45);
  v_util_target := coalesce((v_cfg->>'utilization_target')::numeric, 0.50);
  v_charge_avg := coalesce(((v_cfg->'job_durations'->'CHARGE'->>'avg')::int), 2400);
  v_charge_var := coalesce(((v_cfg->'job_durations'->'CHARGE'->>'variance')::int), 600);

  if p_city_name is not null then
    select id into v_city_id from public.ottoq_cities where name = p_city_name limit 1;
    if v_city_id is null then
      return jsonb_build_object('ok', false, 'error', 'City not found: ' || p_city_name);
    end if;
  end if;

  with completed as (
    update public.ottoq_jobs j
      set state = 'COMPLETED'::ottoq_job_state,
          completed_at = v_now,
          updated_at = v_now
    where j.state = 'ACTIVE'::ottoq_job_state
      and j.job_type = 'CHARGE'::ottoq_job_type
      and exists (
        select 1
        from public.ottoq_vehicles v
        where v.id = j.vehicle_id
          and v.soc >= 0.95
          and (v_city_id is null or v.city_id = v_city_id)
      )
    returning j.id, j.vehicle_id, j.resource_id, j.depot_id
  ),
  released as (
    update public.ottoq_resources r
      set status = 'AVAILABLE'::ottoq_resource_status,
          current_job_id = null,
          updated_at = v_now
    where r.current_job_id in (select id from completed)
    returning r.id
  ),
  vehicles_updated as (
    update public.ottoq_vehicles v
      set status = 'IDLE'::ottoq_vehicle_status,
          updated_at = v_now
    where v.id in (select vehicle_id from completed)
    returning v.id
  )
  select
    array_agg(c.id) as completed_ids,
    (select count(*) from completed) as completed_count
  into v_completed_ids, v_jobs_completed
  from completed c;

  if v_completed_ids is not null then
    insert into public.ottoq_events (entity_type, entity_id, event_type, payload_jsonb, created_at)
    select
      'JOB'::ottoq_entity_type,
      j.id,
      'JOB_COMPLETED',
      jsonb_build_object('job_id', j.id, 'at', v_now),
      v_now
    from public.ottoq_jobs j
    where j.id = any(v_completed_ids);
    get diagnostics v_events_emitted = row_count;
  end if;

  for v_vehicle in
    select v.*
    from public.ottoq_vehicles v
    where (v_city_id is null or v.city_id = v_city_id)
      and v.soc <= 0.35
      and v.status in ('IDLE'::ottoq_vehicle_status, 'ON_TRIP'::ottoq_vehicle_status)
      and not exists (
        select 1 from public.ottoq_jobs j
        where j.vehicle_id = v.id
          and j.state in ('PENDING'::ottoq_job_state, 'SCHEDULED'::ottoq_job_state, 'ACTIVE'::ottoq_job_state)
      )
    order by v.soc asc
    limit 8
  loop
    v_job_type := 'CHARGE'::ottoq_job_type;
    v_target_resource_type := 'CHARGE_STALL'::ottoq_resource_type;

    select d.*
    into v_depot
    from public.ottoq_depots d
    where d.city_id = v_vehicle.city_id
    order by random()
    limit 1;

    if v_depot.id is null then
      continue;
    end if;

    select r.*
    into v_resource
    from public.ottoq_resources r
    where r.depot_id = v_depot.id
      and r.resource_type = v_target_resource_type
      and r.status = 'AVAILABLE'::ottoq_resource_status
    order by r.index asc
    for update skip locked
    limit 1;

    if v_resource.id is null then
      continue;
    end if;

    insert into public.ottoq_jobs (
      vehicle_id, depot_id, resource_id,
      job_type, state,
      requested_start_at, scheduled_start_at,
      eta_seconds, metadata_jsonb, created_at, updated_at
    )
    values (
      v_vehicle.id, v_depot.id, v_resource.id,
      v_job_type, 'SCHEDULED'::ottoq_job_state,
      v_now, v_now + make_interval(secs => (random() * 120)::int),
      (random() * 900 + 180)::int,
      jsonb_build_object('sim', true, 'priority', 1),
      v_now, v_now
    )
    returning id into v_job_id;

    update public.ottoq_resources
      set status = 'RESERVED'::ottoq_resource_status,
          current_job_id = v_job_id,
          updated_at = v_now
    where id = v_resource.id;

    update public.ottoq_vehicles
      set status = 'ENROUTE_DEPOT'::ottoq_vehicle_status,
          updated_at = v_now,
          last_telemetry_at = v_now
    where id = v_vehicle.id;

    insert into public.ottoq_events (entity_type, entity_id, event_type, payload_jsonb, created_at)
    values
      ('VEHICLE'::ottoq_entity_type, v_vehicle.id, 'VEHICLE_ENROUTE_DEPOT', jsonb_build_object('vehicle_id', v_vehicle.id, 'job_id', v_job_id, 'depot_id', v_depot.id), v_now),
      ('JOB'::ottoq_entity_type, v_job_id, 'JOB_SCHEDULED', jsonb_build_object('job_id', v_job_id, 'vehicle_id', v_vehicle.id, 'resource_id', v_resource.id), v_now);

    v_jobs_created := v_jobs_created + 1;
    v_events_emitted := v_events_emitted + 2;
  end loop;

  with to_activate as (
    select j.id, j.vehicle_id, j.resource_id
    from public.ottoq_jobs j
    join public.ottoq_vehicles v on v.id = j.vehicle_id
    where j.state = 'SCHEDULED'::ottoq_job_state
      and j.job_type = 'CHARGE'::ottoq_job_type
      and j.scheduled_start_at <= (v_now - make_interval(secs => v_reserve_seconds))
      and (v_city_id is null or v.city_id = v_city_id)
    order by j.scheduled_start_at asc
    limit 10
  )
  update public.ottoq_jobs j
    set state = 'ACTIVE'::ottoq_job_state,
        started_at = coalesce(j.started_at, v_now),
        updated_at = v_now
  where j.id in (select id from to_activate);

  update public.ottoq_resources r
    set status = 'BUSY'::ottoq_resource_status,
        updated_at = v_now
  where r.current_job_id in (
    select id from public.ottoq_jobs
    where state = 'ACTIVE'::ottoq_job_state
      and job_type = 'CHARGE'::ottoq_job_type
  );

  update public.ottoq_vehicles v
    set status = 'AT_DEPOT'::ottoq_vehicle_status,
        updated_at = v_now,
        last_telemetry_at = v_now
  where v.id in (
    select vehicle_id from public.ottoq_jobs
    where state = 'ACTIVE'::ottoq_job_state
      and job_type = 'CHARGE'::ottoq_job_type
  );

  for v_vehicle in
    select v.*
    from public.ottoq_vehicles v
    where v.status = 'AT_DEPOT'::ottoq_vehicle_status
      and (v_city_id is null or v.city_id = v_city_id)
    order by v.soc asc
    limit 20
  loop
    v_soc_delta := 0.02 + (random() * 0.03);
    v_soc := least(1.0, v_vehicle.soc + v_soc_delta);

    update public.ottoq_vehicles
      set soc = v_soc,
          updated_at = v_now,
          last_telemetry_at = v_now
    where id = v_vehicle.id;

    insert into public.ottoq_events (entity_type, entity_id, event_type, payload_jsonb, created_at)
    values (
      'VEHICLE'::ottoq_entity_type,
      v_vehicle.id,
      'VEHICLE_TELEMETRY',
      jsonb_build_object('soc', v_soc, 'delta', v_soc_delta, 'at', v_now),
      v_now
    );

    v_events_emitted := v_events_emitted + 1;
  end loop;

  return jsonb_build_object(
    'ok', true,
    'city', coalesce(p_city_name, 'ALL'),
    'jobs_created', v_jobs_created,
    'jobs_completed', v_jobs_completed,
    'events_emitted', v_events_emitted,
    'at', v_now
  );
end;
$function$;

-- Revoke sim functions from anon too
REVOKE EXECUTE ON FUNCTION public.ottoq_sim_seed_all() FROM anon;
GRANT EXECUTE ON FUNCTION public.ottoq_sim_seed_all() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.ottoq_sim_seed_city(text, integer, integer) FROM anon;
GRANT EXECUTE ON FUNCTION public.ottoq_sim_seed_city(text, integer, integer) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.ottoq_sim_tick(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.ottoq_sim_tick(text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.ottoq_sim_set_state(boolean, text, jsonb) FROM anon;
GRANT EXECUTE ON FUNCTION public.ottoq_sim_set_state(boolean, text, jsonb) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.ottoq_sim_get_state() FROM anon;
GRANT EXECUTE ON FUNCTION public.ottoq_sim_get_state() TO authenticated;

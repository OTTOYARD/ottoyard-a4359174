// OTTO-Q Seed Data Utility — Generates realistic demo data for the Nashville pilot
import { supabase } from "@/integrations/supabase/client";

const MEMBER_VEHICLES = [
  { make: "Tesla", model: "Model 3", year: 2024, battery: 82, range: 358 },
  { make: "Tesla", model: "Model Y", year: 2024, battery: 75, range: 330 },
  { make: "Tesla", model: "Model S", year: 2023, battery: 100, range: 405 },
  { make: "BMW", model: "iX xDrive50", year: 2024, battery: 111, range: 324 },
  { make: "BMW", model: "i4 eDrive40", year: 2024, battery: 84, range: 301 },
  { make: "Mercedes", model: "EQS 450+", year: 2024, battery: 108, range: 350 },
  { make: "Mercedes", model: "EQE 350+", year: 2024, battery: 91, range: 305 },
  { make: "Porsche", model: "Taycan 4S", year: 2024, battery: 94, range: 277 },
  { make: "Audi", model: "e-tron GT", year: 2024, battery: 94, range: 238 },
  { make: "Audi", model: "Q8 e-tron", year: 2024, battery: 114, range: 285 },
  { make: "Rivian", model: "R1T", year: 2024, battery: 135, range: 352 },
  { make: "Rivian", model: "R1S", year: 2024, battery: 135, range: 321 },
  { make: "Lucid", model: "Air Grand Touring", year: 2024, battery: 118, range: 516 },
  { make: "Ford", model: "Mustang Mach-E", year: 2024, battery: 91, range: 312 },
  { make: "Hyundai", model: "Ioniq 6", year: 2024, battery: 77, range: 361 },
  { make: "Kia", model: "EV6 GT-Line", year: 2024, battery: 77, range: 310 },
  { make: "Genesis", model: "GV60", year: 2024, battery: 77, range: 294 },
  { make: "Polestar", model: "2 Long Range", year: 2024, battery: 82, range: 320 },
  { make: "Volvo", model: "EX90", year: 2024, battery: 111, range: 310 },
  { make: "Cadillac", model: "Lyriq", year: 2024, battery: 102, range: 314 },
  { make: "Tesla", model: "Model X", year: 2023, battery: 100, range: 348 },
  { make: "BMW", model: "i5 eDrive40", year: 2024, battery: 84, range: 295 },
  { make: "Mercedes", model: "EQB 350", year: 2024, battery: 71, range: 243 },
  { make: "Chevrolet", model: "Equinox EV", year: 2025, battery: 85, range: 319 },
  { make: "Nissan", model: "Ariya", year: 2024, battery: 91, range: 304 },
];

const AV_VEHICLES = [
  { make: "Waymo", model: "Jaguar I-PACE AV", year: 2024, battery: 90, range: 292 },
  { make: "Zoox", model: "Robotaxi", year: 2024, battery: 133, range: 260 },
  { make: "Cruise", model: "Origin AV", year: 2024, battery: 100, range: 240 },
  { make: "Motional", model: "Ioniq 5 AV", year: 2024, battery: 77, range: 303 },
  { make: "May Mobility", model: "Transit AV", year: 2024, battery: 60, range: 180 },
];

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

export async function seedOttoQData() {
  console.log("[OTTO-Q Seed] Starting...");

  // 1. Create Nashville depot
  const { data: depot, error: depotErr } = await supabase
    .from("ottoq_ps_depots")
    .upsert({
      name: "OTTOYARD Nashville Pilot",
      location_address: "1000 Broadway, Nashville, TN 37203",
      lat: 36.1580,
      lng: -86.7764,
      charge_stalls_count: 40,
      clean_stalls_count: 10,
      service_bays_count: 1,
      staging_stalls_count: 10,
      operating_hours: { open: "00:00", close: "23:59" },
    }, { onConflict: "id" })
    .select("id")
    .single();

  if (depotErr || !depot) {
    console.error("[OTTO-Q Seed] Depot creation failed:", depotErr);
    return { success: false, error: depotErr };
  }

  const depotId = depot.id;

  // 2. Create stalls
  const stalls: Array<{
    depot_id: string;
    stall_number: number;
    stall_type: "charge_standard" | "charge_fast" | "clean_detail" | "service_bay" | "staging";
    status: "available" | "occupied" | "reserved" | "maintenance";
    charger_power_kw: number | null;
  }> = [];

  // 10 fast chargers (stalls 1-10)
  for (let i = 1; i <= 10; i++) {
    stalls.push({
      depot_id: depotId,
      stall_number: i,
      stall_type: "charge_fast",
      status: i <= 3 ? "occupied" : "available",
      charger_power_kw: 250,
    });
  }
  // 30 standard chargers (stalls 11-40)
  for (let i = 11; i <= 40; i++) {
    stalls.push({
      depot_id: depotId,
      stall_number: i,
      stall_type: "charge_standard",
      status: i <= 18 ? "occupied" : "available",
      charger_power_kw: 50,
    });
  }
  // 10 clean/detail (stalls 41-50)
  for (let i = 41; i <= 50; i++) {
    stalls.push({
      depot_id: depotId,
      stall_number: i,
      stall_type: "clean_detail",
      status: i <= 43 ? "occupied" : "available",
      charger_power_kw: null,
    });
  }
  // 1 service bay (stall 51)
  stalls.push({
    depot_id: depotId,
    stall_number: 51,
    stall_type: "service_bay",
    status: "occupied",
    charger_power_kw: null,
  });
  // 10 staging (stalls 52-61)
  for (let i = 52; i <= 61; i++) {
    stalls.push({
      depot_id: depotId,
      stall_number: i,
      stall_type: "staging",
      status: i <= 55 ? "occupied" : "available",
      charger_power_kw: null,
    });
  }

  // Delete existing stalls for this depot then insert
  await supabase.from("ottoq_ps_depot_stalls").delete().eq("depot_id", depotId);
  const { error: stallErr } = await supabase.from("ottoq_ps_depot_stalls").insert(stalls);
  if (stallErr) console.error("[OTTO-Q Seed] Stall insert error:", stallErr);

  // 3. Create vehicles
  const vehicleRows: Array<Record<string, unknown>> = [];

  for (const v of MEMBER_VEHICLES) {
    const soc = Math.round(randomBetween(12, 95));
    vehicleRows.push({
      vehicle_type: "member_ev",
      make: v.make,
      model: v.model,
      year: v.year,
      battery_capacity_kwh: v.battery,
      current_soc_percent: soc,
      current_range_miles: Math.round((soc / 100) * v.range),
      odometer_miles: Math.round(randomBetween(1200, 42000)),
      last_charge_date: daysAgo(Math.round(randomBetween(0, 5))),
      last_detail_date: daysAgo(Math.round(randomBetween(1, 14))),
      last_tire_rotation_date: daysAgo(Math.round(randomBetween(10, 120))),
      last_battery_health_check: daysAgo(Math.round(randomBetween(15, 100))),
      avg_daily_miles: Math.round(randomBetween(15, 65)),
      status: soc < 20 ? "charging" : "active",
    });
  }

  for (const v of AV_VEHICLES) {
    const soc = Math.round(randomBetween(18, 88));
    vehicleRows.push({
      vehicle_type: "autonomous",
      make: v.make,
      model: v.model,
      year: v.year,
      battery_capacity_kwh: v.battery,
      current_soc_percent: soc,
      current_range_miles: Math.round((soc / 100) * v.range),
      odometer_miles: Math.round(randomBetween(8000, 95000)),
      last_charge_date: daysAgo(Math.round(randomBetween(0, 2))),
      last_detail_date: daysAgo(Math.round(randomBetween(2, 10))),
      last_tire_rotation_date: daysAgo(Math.round(randomBetween(20, 90))),
      last_battery_health_check: daysAgo(Math.round(randomBetween(30, 95))),
      avg_daily_miles: Math.round(randomBetween(80, 200)),
      status: "active",
    });
  }

  // Clear existing then insert
  await supabase.from("ottoq_ps_vehicles").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  const { error: vehErr } = await supabase.from("ottoq_ps_vehicles").insert(vehicleRows);
  if (vehErr) console.error("[OTTO-Q Seed] Vehicle insert error:", vehErr);

  // 4. Seed energy pricing for Nashville
  await supabase.from("ottoq_ps_energy_pricing").delete().eq("depot_id", depotId);
  const { error: epErr } = await supabase.from("ottoq_ps_energy_pricing").insert([
    { depot_id: depotId, period_name: "off_peak", start_hour: 22, end_hour: 6, rate_per_kwh: 0.06 },
    { depot_id: depotId, period_name: "shoulder_am", start_hour: 6, end_hour: 14, rate_per_kwh: 0.09 },
    { depot_id: depotId, period_name: "peak", start_hour: 14, end_hour: 20, rate_per_kwh: 0.14 },
    { depot_id: depotId, period_name: "shoulder_pm", start_hour: 20, end_hour: 22, rate_per_kwh: 0.09 },
  ]);
  if (epErr) console.error("[OTTO-Q Seed] Energy pricing error:", epErr);

  console.log("[OTTO-Q Seed] Complete ✓");
  return { success: true, depotId };
}

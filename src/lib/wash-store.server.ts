import "@tanstack/react-start/server-only";

import type { LaundryMachine, LaundryMachineId, Wash, WashCreateInput, WashStatus } from "./washes";

type SupabaseConfig = { url: string; key: string };

// Publishable keys identify a Supabase project and are not secrets. Keeping the
// default here lets the Git-connected Vercel project run without exposing any
// privileged database credential in the browser bundle.
const DEFAULT_SUPABASE_URL = "https://norrcmmpzgxvyjozlugo.supabase.co";
const DEFAULT_SUPABASE_KEY = "sb_publishable_3Z_AIyluPRczUGEN7VsZiQ_dNtU4FUl";

function getSupabaseConfig(): SupabaseConfig {
  return {
    url: (process.env.SUPABASE_URL?.trim() || DEFAULT_SUPABASE_URL).replace(/\/$/u, ""),
    key: process.env.SUPABASE_PUBLISHABLE_KEY?.trim() || DEFAULT_SUPABASE_KEY,
  };
}

function databaseAdminCredentials() {
  return {
    p_user: process.env.LAVTUDO_ADMIN_USER?.trim() || "admin",
    p_password: process.env.LAVTUDO_ADMIN_PASSWORD?.trim() || "admin",
  };
}

async function supabaseRpc<T>(
  name: string,
  parameters: Record<string, unknown>,
  accessHeaders: Record<string, string>,
): Promise<T> {
  const config = getSupabaseConfig();
  const response = await fetch(`${config.url}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: {
      apikey: config.key,
      Authorization: `Bearer ${config.key}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...accessHeaders,
    },
    body: JSON.stringify(parameters),
    cache: "no-store",
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      message?: string;
      hint?: string;
    } | null;
    throw new Error(
      body?.message || body?.hint || `Supabase respondeu com HTTP ${response.status}.`,
    );
  }

  return (await response.json()) as T;
}

export function storageMode(): "supabase" {
  return "supabase";
}

export async function listWashes(): Promise<Wash[]> {
  const credentials = databaseAdminCredentials();
  return supabaseRpc<Wash[]>("lavtudo_list_washes", credentials, {
    "X-LavTudo-Admin-User": credentials.p_user,
    "X-LavTudo-Admin-Password": credentials.p_password,
  });
}

export async function listMachines(): Promise<LaundryMachine[]> {
  const credentials = databaseAdminCredentials();
  return supabaseRpc<LaundryMachine[]>("lavtudo_list_machines", credentials, {
    "X-LavTudo-Admin-User": credentials.p_user,
    "X-LavTudo-Admin-Password": credentials.p_password,
  });
}

export async function findMachine(id: LaundryMachineId): Promise<LaundryMachine | undefined> {
  const machine = await supabaseRpc<LaundryMachine | null>(
    "lavtudo_get_machine",
    { p_id: id },
    { "X-LavTudo-Machine-Id": id },
  );
  return machine ?? undefined;
}

export async function createWash(
  machineId: LaundryMachineId,
  input: WashCreateInput,
): Promise<LaundryMachine> {
  const credentials = databaseAdminCredentials();
  return supabaseRpc<LaundryMachine>(
    "lavtudo_start_machine_wash",
    {
      ...credentials,
      p_machine_id: machineId,
      p_service_type: input.serviceType,
      p_estimated_minutes: input.estimatedMinutes,
      p_started_at: input.startedAt,
    },
    {
      "X-LavTudo-Admin-User": credentials.p_user,
      "X-LavTudo-Admin-Password": credentials.p_password,
    },
  );
}

export async function setMachineStatus(
  machineId: LaundryMachineId,
  status: WashStatus,
): Promise<LaundryMachine | undefined> {
  const credentials = databaseAdminCredentials();
  const machine = await supabaseRpc<LaundryMachine | null>(
    "lavtudo_set_machine_status",
    { ...credentials, p_machine_id: machineId, p_status: status },
    {
      "X-LavTudo-Admin-User": credentials.p_user,
      "X-LavTudo-Admin-Password": credentials.p_password,
    },
  );
  return machine ?? undefined;
}

export async function releaseMachine(
  machineId: LaundryMachineId,
): Promise<LaundryMachine | undefined> {
  const credentials = databaseAdminCredentials();
  const machine = await supabaseRpc<LaundryMachine | null>(
    "lavtudo_release_machine",
    { ...credentials, p_machine_id: machineId },
    {
      "X-LavTudo-Admin-User": credentials.p_user,
      "X-LavTudo-Admin-Password": credentials.p_password,
    },
  );
  return machine ?? undefined;
}

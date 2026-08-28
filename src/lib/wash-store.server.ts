import "@tanstack/react-start/server-only";

import type { Wash, WashCreateInput, WashStatus } from "./washes";

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

export async function findWash(id: string): Promise<Wash | undefined> {
  const wash = await supabaseRpc<Wash | null>(
    "lavtudo_get_wash",
    { p_id: id },
    { "X-LavTudo-Wash-Id": id },
  );
  return wash ?? undefined;
}

export async function createWash(input: WashCreateInput): Promise<Wash> {
  const credentials = databaseAdminCredentials();
  return supabaseRpc<Wash>(
    "lavtudo_create_wash",
    {
      ...credentials,
      p_customer_name: input.customerName,
      p_machine_label: input.machineLabel,
      p_service_type: input.serviceType,
      p_estimated_minutes: input.estimatedMinutes,
    },
    {
      "X-LavTudo-Admin-User": credentials.p_user,
      "X-LavTudo-Admin-Password": credentials.p_password,
    },
  );
}

export async function setWashStatus(id: string, status: WashStatus): Promise<Wash | undefined> {
  const credentials = databaseAdminCredentials();
  const wash = await supabaseRpc<Wash | null>(
    "lavtudo_set_wash_status",
    { ...credentials, p_id: id, p_status: status },
    {
      "X-LavTudo-Admin-User": credentials.p_user,
      "X-LavTudo-Admin-Password": credentials.p_password,
    },
  );
  return wash ?? undefined;
}

export async function resetWash(id: string): Promise<Wash | undefined> {
  const credentials = databaseAdminCredentials();
  const wash = await supabaseRpc<Wash | null>(
    "lavtudo_reset_wash",
    { ...credentials, p_id: id },
    {
      "X-LavTudo-Admin-User": credentials.p_user,
      "X-LavTudo-Admin-Password": credentials.p_password,
    },
  );
  return wash ?? undefined;
}

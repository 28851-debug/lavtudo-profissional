import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  LAUNDRY_MACHINES,
  PET_MACHINE_ID,
  SERVICE_LABEL,
  isLaundryMachineId,
  isPetMachineId,
  serviceTypesForMachine,
  stagesForMachine,
  trackingPath,
} from "./washes.ts";

test("registra uma lavadora pet permanente com URL própria", () => {
  assert.equal(PET_MACHINE_ID, "lavadora-pet-01");
  assert.equal(isLaundryMachineId(PET_MACHINE_ID), true);
  assert.equal(isPetMachineId(PET_MACHINE_ID), true);
  assert.equal(isPetMachineId("lavadora-01"), false);
  assert.equal(trackingPath(PET_MACHINE_ID), "/acompanhar/lavadora-pet-01");

  const machine = LAUNDRY_MACHINES.find(({ id }) => id === PET_MACHINE_ID);
  assert.deepEqual(machine, {
    id: PET_MACHINE_ID,
    label: "Lavadora Pet",
    kind: "washer",
    position: 5,
  });
});

test("restringe a lavadora pet ao serviço exclusivo para roupas de animais", () => {
  assert.deepEqual(serviceTypesForMachine(PET_MACHINE_ID, "washer"), ["pet"]);
  assert.equal(SERVICE_LABEL.pet, "Lavagem de roupas pet");
});

test("mantém serviços comuns fora da lavadora pet", () => {
  assert.deepEqual(serviceTypesForMachine("lavadora-02", "washer"), [
    "standard",
    "delicate",
    "heavy",
  ]);
  assert.deepEqual(serviceTypesForMachine("secadora-01", "dryer"), ["drying"]);
});

test("usa as etapas normais de lavagem na máquina pet", () => {
  assert.deepEqual(stagesForMachine("washer", PET_MACHINE_ID), [
    "washing",
    "rinsing",
    "spinning",
    "ready",
  ]);
});

test("a migração protege a exclusividade pet na própria tabela", () => {
  const migration = readFileSync(
    new URL("../../supabase/migrations/20261002120000_add_pet_washer.sql", import.meta.url),
    "utf8",
  );

  assert.match(migration, /lavtudo_washes_pet_service_check/u);
  assert.match(migration, /machine_id = 'lavadora-pet-01' and service_type = 'pet'/u);
  assert.match(migration, /machine_id <> 'lavadora-pet-01' and service_type <> 'pet'/u);
});

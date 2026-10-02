-- Lavadora permanente e exclusiva para roupas, mantas e acessórios de animais.
-- A exclusividade é validada no banco para não depender apenas da interface.

alter table public.lavtudo_machines
  drop constraint if exists lavtudo_machines_id_check;
alter table public.lavtudo_machines
  add constraint lavtudo_machines_id_check
  check (id ~ '^(lavadora-0[1-4]|secadora-0[1-4]|lavadora-pet-01)$');

alter table public.lavtudo_machines
  drop constraint if exists lavtudo_machines_position_check;
alter table public.lavtudo_machines
  add constraint lavtudo_machines_position_check
  check (position between 1 and 5);

insert into public.lavtudo_machines (id, label, kind, position)
values ('lavadora-pet-01', 'Lavadora Pet', 'washer', 5)
on conflict (id) do update set
  label = excluded.label,
  kind = excluded.kind,
  position = excluded.position;

alter table public.lavtudo_washes
  drop constraint if exists lavtudo_washes_service_type_check;
alter table public.lavtudo_washes
  add constraint lavtudo_washes_service_type_check
  check (service_type in ('standard', 'delicate', 'heavy', 'drying', 'pet'));

alter table public.lavtudo_washes
  drop constraint if exists lavtudo_washes_pet_service_check;
alter table public.lavtudo_washes
  add constraint lavtudo_washes_pet_service_check
  check (
    (machine_id = 'lavadora-pet-01' and service_type = 'pet')
    or (machine_id <> 'lavadora-pet-01' and service_type <> 'pet')
  );

create or replace function public.lavtudo_get_machine(p_id text)
returns jsonb language plpgsql stable security invoker set search_path = '' as $$
begin
  if p_id !~ '^(lavadora-0[1-4]|secadora-0[1-4]|lavadora-pet-01)$' then
    return null;
  end if;
  return private.lavtudo_machine_json(p_id);
end;
$$;

create or replace function public.lavtudo_start_machine_wash(
  p_user text,
  p_password text,
  p_machine_id text,
  p_service_type text,
  p_estimated_minutes integer,
  p_started_at timestamptz
)
returns jsonb language plpgsql volatile security invoker set search_path = '' as $$
declare
  machine_record public.lavtudo_machines%rowtype;
  created_wash_id bigint;
  initial_status text;
begin
  if not private.lavtudo_admin_ok(p_user, p_password) then
    raise insufficient_privilege using message = 'Credenciais administrativas inválidas.';
  end if;

  select * into machine_record
  from public.lavtudo_machines
  where id = p_machine_id;
  if not found then return null; end if;

  if p_estimated_minutes not between 5 and 240 then
    raise check_violation using message = 'Duração inválida.';
  end if;

  if machine_record.id = 'lavadora-pet-01' and p_service_type <> 'pet' then
    raise check_violation using message = 'A Lavadora Pet aceita somente o ciclo para roupas de animais.';
  end if;
  if machine_record.id <> 'lavadora-pet-01' and p_service_type = 'pet' then
    raise check_violation using message = 'O ciclo pet é exclusivo da Lavadora Pet.';
  end if;
  if machine_record.kind = 'dryer' and p_service_type <> 'drying' then
    raise check_violation using message = 'Serviço incompatível com a secadora.';
  end if;
  if machine_record.kind = 'washer'
     and machine_record.id <> 'lavadora-pet-01'
     and p_service_type not in ('standard', 'delicate', 'heavy') then
    raise check_violation using message = 'Serviço incompatível com a lavadora.';
  end if;

  if exists (
    select 1
    from public.lavtudo_washes
    where machine_id = p_machine_id
      and status not in ('collected', 'cancelled')
  ) then
    raise unique_violation using message = 'Máquina ocupada.';
  end if;

  initial_status := case when machine_record.kind = 'dryer' then 'drying' else 'washing' end;

  insert into public.lavtudo_washes (
    customer_name,
    machine_id,
    machine_label,
    service_type,
    status,
    estimated_minutes,
    created_at,
    updated_at,
    started_at
  ) values (
    'Cliente LavTudo',
    machine_record.id,
    machine_record.label,
    p_service_type,
    initial_status,
    p_estimated_minutes,
    p_started_at,
    p_started_at,
    p_started_at
  ) returning id into created_wash_id;

  insert into public.lavtudo_wash_history (wash_id, status, label, occurred_at, actor)
  values (
    created_wash_id,
    initial_status,
    private.lavtudo_status_label(initial_status),
    p_started_at,
    'employee'
  );

  return private.lavtudo_machine_json(p_machine_id);
end;
$$;

comment on table public.lavtudo_machines is
  'Equipamentos permanentes da LavTudo, incluindo lavadora exclusiva para itens pet.';

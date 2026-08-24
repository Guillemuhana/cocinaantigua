-- =============================================================================
--  SISTEMA DE GESTIÓN DE EVENTOS — Mermeladas artesanales
--  Migración 01: esquema completo (tipos, tablas, triggers, vistas, RLS)
--  Postgres 15 / Supabase
--
--  Ejecutar en: Supabase Dashboard > SQL Editor (o supabase db push)
--  Idempotente: se puede correr sobre base limpia.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 0. EXTENSIONES
-- -----------------------------------------------------------------------------
create extension if not exists "pgcrypto";      -- gen_random_uuid()
create extension if not exists "unaccent";      -- búsquedas sin acentos


-- -----------------------------------------------------------------------------
-- 1. TIPOS ENUMERADOS
-- -----------------------------------------------------------------------------

-- Roles de la aplicación.
--   admin      : los dueños. Ven todo, incluidos costos y márgenes.
--   encargado  : responsable de un evento. Ve su evento completo (sin costos).
--   vendedor   : personal temporal. Solo carga ventas y egresos del evento asignado.
create type rol_usuario as enum ('admin', 'encargado', 'vendedor');

create type estado_evento as enum ('planificado', 'abierto', 'cerrado', 'cancelado');

-- Cómo se cargan las ventas en ese evento.
--   detallada : cada venta en el momento (ticket por ticket)
--   resumen   : totales al cierre de la jornada
--   mixta     : el evento admite las dos
create type modo_carga_ventas as enum ('detallada', 'resumen', 'mixta');

create type tipo_venta as enum ('detallada', 'resumen');

create type medio_pago as enum ('efectivo', 'transferencia', 'posnet', 'qr', 'otro');

create type tipo_cuenta as enum ('caja', 'banco', 'billetera', 'posnet');

create type tipo_remito as enum ('salida', 'reposicion', 'devolucion');

create type estado_remito as enum ('borrador', 'en_transito', 'recibido');

-- Todos los motivos por los que se mueve mercadería.
-- El signo lo define la columna `cantidad` (positivo entra, negativo sale).
create type tipo_movimiento as enum (
  'produccion',          -- entra a central desde producción
  'ingreso_remito',      -- entra al evento (remito recibido)
  'salida_remito',       -- sale de central hacia un evento
  'devolucion',          -- vuelve del evento a central
  'venta',               -- sale por venta
  'anulacion_venta',     -- reversa de una venta anulada
  'rotura',              -- egreso no venta
  'rotura_transito',     -- diferencia entre lo enviado y lo recibido
  'degustacion',         -- egreso no venta
  'regalo',              -- muestra / obsequio / prensa
  'consumo_interno',     -- lo consume el equipo
  'canje',               -- intercambio con otro puesto de la feria
  'vencimiento',
  'ajuste'               -- corrección manual (requiere motivo)
);

create type modalidad_pago_personal as enum ('jornal', 'jornal_comision', 'comision', 'sin_cargo');

create type quien_paga as enum ('empresa', 'caja_evento', 'personal');

create type estado_jornada as enum ('abierta', 'cerrada');


-- -----------------------------------------------------------------------------
-- 2. PERSONAS Y PERFILES
-- -----------------------------------------------------------------------------

-- `personal` = registro de todos los que trabajan (fijos y temporales),
-- tengan o no usuario en la app. El primo que ayuda un fin de semana entra acá
-- aunque nunca abra el sistema: así se le puede asignar comisión y liquidación.
create table personal (
  id            uuid primary key default gen_random_uuid(),
  nombre        text not null,
  telefono      text,
  documento     text,
  es_fijo       boolean not null default false,
  activo        boolean not null default true,
  notas         text,
  created_at    timestamptz not null default now()
);

-- `perfiles` = usuarios que sí entran a la app (1:1 con auth.users).
create table perfiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  personal_id   uuid unique references personal(id) on delete set null,
  nombre        text not null,
  rol           rol_usuario not null default 'vendedor',
  activo        boolean not null default true,
  created_at    timestamptz not null default now()
);

create index on perfiles (rol) where activo;


-- -----------------------------------------------------------------------------
-- 3. CATÁLOGO
-- -----------------------------------------------------------------------------

create table productos (
  id               uuid primary key default gen_random_uuid(),
  sku              text unique not null,
  nombre           text not null,               -- "Mermelada de higo"
  sabor            text,
  presentacion_g   integer,                     -- 250, 420, etc.
  precio_lista     numeric(14,2) not null default 0,
  imagen_url       text,
  orden            integer not null default 0,  -- orden en la grilla de venta
  activo           boolean not null default true,
  created_at       timestamptz not null default now()
);

create index on productos (activo, orden);

-- El costo de producción vive en su propia tabla, no en `productos`.
-- RLS es a nivel de fila, no de columna: si el costo estuviera en `productos`,
-- cualquier vendedor con un `select *` vería el margen del negocio.
create table producto_costos (
  producto_id     uuid primary key references productos(id) on delete cascade,
  costo_unitario  numeric(14,2) not null default 0,
  actualizado_at  timestamptz not null default now()
);

-- Cuentas donde entra la plata. Sirve para conciliar transferencias y posnet.
create table cuentas (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null,                    -- "Alias mermelada.mp", "Posnet Naranja"
  tipo        tipo_cuenta not null,
  detalle     text,                             -- CBU, alias, nro de terminal
  comision_pct numeric(5,2) not null default 0, -- comisión por defecto de esa terminal
  activo      boolean not null default true
);


-- -----------------------------------------------------------------------------
-- 4. EVENTOS
-- -----------------------------------------------------------------------------

create table eventos (
  id                uuid primary key default gen_random_uuid(),
  nombre            text not null,              -- "Fiesta Nacional del Poncho 2026"
  provincia         text,
  localidad         text,
  sede              text,
  fecha_inicio      date not null,
  fecha_fin         date not null,
  estado            estado_evento not null default 'planificado',
  modo_carga        modo_carga_ventas not null default 'detallada',
  canon_stand       numeric(14,2) not null default 0,   -- lo que se paga por el puesto
  fondo_caja        numeric(14,2) not null default 0,   -- efectivo con el que arranca
  responsable_id    uuid references personal(id),
  notas             text,
  created_at        timestamptz not null default now(),
  constraint fechas_coherentes check (fecha_fin >= fecha_inicio)
);

create index on eventos (estado, fecha_inicio desc);

-- Precio por evento. Si no hay fila, se usa productos.precio_lista.
-- Necesario porque no se vende al mismo precio en Palermo que en Chaco.
create table evento_precios (
  evento_id    uuid not null references eventos(id) on delete cascade,
  producto_id  uuid not null references productos(id) on delete cascade,
  precio       numeric(14,2) not null check (precio >= 0),
  primary key (evento_id, producto_id)
);

-- Promociones: "3 frascos $X", 2x1, descuento por combo.
-- Si evento_id es null, la promo vale para todos los eventos.
create table promociones (
  id           uuid primary key default gen_random_uuid(),
  evento_id    uuid references eventos(id) on delete cascade,
  nombre       text not null,                   -- "3 x $18.000"
  cantidad     integer not null check (cantidad > 0),
  precio_total numeric(14,2) not null check (precio_total >= 0),
  producto_id  uuid references productos(id),   -- null = cualquier sabor
  activo       boolean not null default true
);

-- Quién trabaja en cada evento y cómo se le paga.
create table evento_personal (
  id               uuid primary key default gen_random_uuid(),
  evento_id        uuid not null references eventos(id) on delete cascade,
  personal_id      uuid not null references personal(id) on delete cascade,
  rol              text,                        -- "encargado", "vendedor", "logística"
  modalidad        modalidad_pago_personal not null default 'jornal',
  jornal_diario    numeric(14,2) not null default 0,
  comision_pct     numeric(5,2) not null default 0,
  dias_trabajados  numeric(5,2) not null default 0,
  adelantos        numeric(14,2) not null default 0,
  liquidado        boolean not null default false,
  notas            text,
  unique (evento_id, personal_id)
);


-- -----------------------------------------------------------------------------
-- 5. REMITOS (movimiento de mercadería entre Central y Evento)
-- -----------------------------------------------------------------------------

create table remitos (
  id                uuid primary key default gen_random_uuid(),
  evento_id         uuid not null references eventos(id) on delete cascade,
  tipo              tipo_remito not null,
  estado            estado_remito not null default 'borrador',
  fecha_despacho    timestamptz,
  fecha_recepcion   timestamptz,
  despachado_por    uuid references perfiles(id),
  recibido_por      uuid references perfiles(id),
  notas             text,
  created_at        timestamptz not null default now()
);

create index on remitos (evento_id, estado);

create table remito_items (
  id                 uuid primary key default gen_random_uuid(),
  remito_id          uuid not null references remitos(id) on delete cascade,
  producto_id        uuid not null references productos(id),
  cantidad_enviada   integer not null check (cantidad_enviada > 0),
  cantidad_recibida  integer,                   -- se completa al recibir
  unique (remito_id, producto_id)
);


-- -----------------------------------------------------------------------------
-- 6. LIBRO MAYOR DE STOCK
--    Ninguna cantidad se "edita" nunca: todo es un asiento en esta tabla.
--    evento_id = null significa depósito central.
-- -----------------------------------------------------------------------------

create table movimientos_stock (
  id              uuid primary key default gen_random_uuid(),
  evento_id       uuid references eventos(id) on delete cascade,
  producto_id     uuid not null references productos(id),
  tipo            tipo_movimiento not null,
  cantidad        integer not null check (cantidad <> 0),  -- + entra, − sale
  motivo          text,
  origen_tabla    text,        -- 'ventas', 'remitos', 'manual'
  origen_id       uuid,
  creado_por      uuid references perfiles(id),
  created_at      timestamptz not null default now()
);

create index on movimientos_stock (evento_id, producto_id);
create index on movimientos_stock (origen_tabla, origen_id);
create index on movimientos_stock (created_at desc);


-- -----------------------------------------------------------------------------
-- 7. JORNADAS Y CAJA
-- -----------------------------------------------------------------------------

create table jornadas (
  id                uuid primary key default gen_random_uuid(),
  evento_id         uuid not null references eventos(id) on delete cascade,
  fecha             date not null,
  estado            estado_jornada not null default 'abierta',
  fondo_inicial     numeric(14,2) not null default 0,
  efectivo_contado  numeric(14,2),              -- lo que realmente había en la caja
  abierta_por       uuid references perfiles(id),
  cerrada_por       uuid references perfiles(id),
  cerrada_at        timestamptz,
  notas             text,
  unique (evento_id, fecha)
);


-- -----------------------------------------------------------------------------
-- 8. VENTAS
--    Un solo modelo para los dos modos de carga:
--      tipo='detallada' -> una fila por ticket
--      tipo='resumen'   -> una fila por jornada con los totales cargados al cierre
--    En ambos casos bajan stock y entran a la caja exactamente igual.
-- -----------------------------------------------------------------------------

create table ventas (
  id             uuid primary key default gen_random_uuid(),
  evento_id      uuid not null references eventos(id) on delete cascade,
  jornada_id     uuid references jornadas(id) on delete set null,
  tipo           tipo_venta not null default 'detallada',
  vendedor_id    uuid references personal(id),
  total          numeric(14,2) not null default 0,
  descuento      numeric(14,2) not null default 0,
  anulada        boolean not null default false,
  motivo_anulacion text,
  notas          text,
  creado_por     uuid references perfiles(id),
  created_at     timestamptz not null default now()
);

create index on ventas (evento_id, created_at desc);
create index on ventas (jornada_id) where not anulada;

create table venta_items (
  id               uuid primary key default gen_random_uuid(),
  venta_id         uuid not null references ventas(id) on delete cascade,
  producto_id      uuid not null references productos(id),
  cantidad         integer not null check (cantidad > 0),
  precio_unitario  numeric(14,2) not null check (precio_unitario >= 0),
  promocion_id     uuid references promociones(id),
  subtotal         numeric(14,2) generated always as (cantidad * precio_unitario) stored
);

create index on venta_items (venta_id);
create index on venta_items (producto_id);

-- Una venta puede tener varios pagos: $10.000 en efectivo + el resto por transferencia.
-- Por eso NO existe un campo `metodo_pago` en `ventas`.
create table venta_pagos (
  id               uuid primary key default gen_random_uuid(),
  venta_id         uuid not null references ventas(id) on delete cascade,
  medio            medio_pago not null,
  importe          numeric(14,2) not null check (importe > 0),
  cuenta_id        uuid references cuentas(id),
  cuotas           smallint not null default 1,
  comision_pct     numeric(5,2) not null default 0,
  -- Neto real que va a entrar a la cuenta. El posnet NO es plata cobrada:
  -- tiene comisión y se acredita después. Si se suma igual que el efectivo,
  -- la caja miente.
  neto_estimado    numeric(14,2) generated always as
                     (round(importe * (1 - comision_pct / 100), 2)) stored,
  referencia       text,                        -- nro de comprobante / lote
  comprobante_url  text,                        -- foto en Supabase Storage
  created_at       timestamptz not null default now()
);

create index on venta_pagos (venta_id);


-- -----------------------------------------------------------------------------
-- 9. GASTOS
-- -----------------------------------------------------------------------------

create table categorias_gasto (
  id      uuid primary key default gen_random_uuid(),
  nombre  text unique not null,
  activo  boolean not null default true
);

create table gastos (
  id               uuid primary key default gen_random_uuid(),
  evento_id        uuid references eventos(id) on delete cascade,  -- null = gasto general
  jornada_id       uuid references jornadas(id) on delete set null,
  categoria_id     uuid references categorias_gasto(id),
  fecha            date not null default current_date,
  descripcion      text not null,
  importe          numeric(14,2) not null check (importe > 0),
  medio            medio_pago not null default 'efectivo',
  -- Clave para el arqueo: si se pagó de la caja del evento, sale del efectivo
  -- del día. Si lo pagó la empresa por transferencia, no toca la caja.
  pagado_por       quien_paga not null default 'caja_evento',
  personal_id      uuid references personal(id),  -- si lo puso alguien de su bolsillo
  comprobante_url  text,
  creado_por       uuid references perfiles(id),
  created_at       timestamptz not null default now()
);

create index on gastos (evento_id, fecha);


-- =============================================================================
--  TRIGGERS: mantienen coherentes el stock y los totales
-- =============================================================================

-- --- 9.1 Venta -> movimiento de stock ---------------------------------------
create or replace function fn_venta_item_stock()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_evento uuid;
  v_user   uuid;
begin
  if (tg_op = 'INSERT') then
    select evento_id into v_evento from ventas where id = new.venta_id;
    select id into v_user from perfiles where id = auth.uid();

    insert into movimientos_stock
      (evento_id, producto_id, tipo, cantidad, origen_tabla, origen_id, creado_por)
    values
      (v_evento, new.producto_id, 'venta', -new.cantidad, 'ventas', new.venta_id, v_user);

  elsif (tg_op = 'DELETE') then
    delete from movimientos_stock
     where origen_tabla = 'ventas'
       and origen_id = old.venta_id
       and producto_id = old.producto_id
       and tipo = 'venta';
  end if;

  return coalesce(new, old);
end;
$$;

create trigger trg_venta_item_stock
after insert or delete on venta_items
for each row execute function fn_venta_item_stock();


-- --- 9.2 Recalcular el total de la venta ------------------------------------
create or replace function fn_recalcular_total_venta()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_venta uuid;
begin
  v_venta := coalesce(new.venta_id, old.venta_id);
  update ventas v
     set total = coalesce((select sum(subtotal) from venta_items where venta_id = v_venta), 0)
                 - v.descuento
   where v.id = v_venta;
  return coalesce(new, old);
end;
$$;

create trigger trg_total_venta
after insert or update or delete on venta_items
for each row execute function fn_recalcular_total_venta();


-- --- 9.3 Anulación de venta: se revierte con asientos, no se borra ----------
create or replace function fn_anular_venta()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.anulada and not old.anulada then
    insert into movimientos_stock
      (evento_id, producto_id, tipo, cantidad, motivo, origen_tabla, origen_id, creado_por)
    select new.evento_id, vi.producto_id, 'anulacion_venta', vi.cantidad,
           coalesce(new.motivo_anulacion, 'Venta anulada'), 'ventas', new.id, auth.uid()
      from venta_items vi
     where vi.venta_id = new.id;
  end if;
  return new;
end;
$$;

create trigger trg_anular_venta
after update of anulada on ventas
for each row execute function fn_anular_venta();


-- --- 9.4 Remitos: despacho y recepción --------------------------------------
-- Al despachar: sale de central.
-- Al recibir: entra al evento lo enviado y, si faltó, se registra la diferencia
-- como rotura_transito. Así la merma queda visible en vez de desaparecer.
create or replace function fn_remito_estado()
returns trigger language plpgsql security definer set search_path = public as $$
declare r record;
begin
  -- despacho
  if new.estado = 'en_transito' and old.estado = 'borrador' then
    for r in select * from remito_items where remito_id = new.id loop
      if new.tipo = 'devolucion' then
        insert into movimientos_stock (evento_id, producto_id, tipo, cantidad, origen_tabla, origen_id, creado_por)
        values (new.evento_id, r.producto_id, 'devolucion', -r.cantidad_enviada, 'remitos', new.id, auth.uid());
      else
        insert into movimientos_stock (evento_id, producto_id, tipo, cantidad, origen_tabla, origen_id, creado_por)
        values (null, r.producto_id, 'salida_remito', -r.cantidad_enviada, 'remitos', new.id, auth.uid());
      end if;
    end loop;
    new.fecha_despacho := coalesce(new.fecha_despacho, now());
  end if;

  -- recepción
  if new.estado = 'recibido' and old.estado <> 'recibido' then
    for r in select * from remito_items where remito_id = new.id loop
      if new.tipo = 'devolucion' then
        insert into movimientos_stock (evento_id, producto_id, tipo, cantidad, origen_tabla, origen_id, creado_por)
        values (null, r.producto_id, 'devolucion', coalesce(r.cantidad_recibida, r.cantidad_enviada), 'remitos', new.id, auth.uid());
      else
        insert into movimientos_stock (evento_id, producto_id, tipo, cantidad, origen_tabla, origen_id, creado_por)
        values (new.evento_id, r.producto_id, 'ingreso_remito', r.cantidad_enviada, 'remitos', new.id, auth.uid());

        if r.cantidad_recibida is not null and r.cantidad_recibida < r.cantidad_enviada then
          insert into movimientos_stock (evento_id, producto_id, tipo, cantidad, motivo, origen_tabla, origen_id, creado_por)
          values (new.evento_id, r.producto_id, 'rotura_transito',
                  -(r.cantidad_enviada - r.cantidad_recibida),
                  'Diferencia entre despachado y recibido', 'remitos', new.id, auth.uid());
        end if;
      end if;
    end loop;
    new.fecha_recepcion := coalesce(new.fecha_recepcion, now());
  end if;

  return new;
end;
$$;

create trigger trg_remito_estado
before update of estado on remitos
for each row execute function fn_remito_estado();


-- =============================================================================
--  FUNCIONES DE SEGURIDAD
--  Se definen antes que las vistas porque las vistas las usan.
-- =============================================================================

create or replace function mi_rol()
returns rol_usuario language sql stable security definer set search_path = public as $$
  select rol from perfiles where id = auth.uid() and activo
$$;

create or replace function es_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select rol = 'admin' from perfiles where id = auth.uid() and activo), false)
$$;

-- ¿Este usuario está asignado a este evento?
create or replace function acceso_evento(p_evento uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select es_admin() or exists (
    select 1
      from evento_personal ep
      join perfiles pf on pf.personal_id = ep.personal_id
     where ep.evento_id = p_evento and pf.id = auth.uid() and pf.activo
  )
$$;

-- ¿Puede este usuario gestionar la administración del evento?
-- El vendedor temporal carga ventas, pero no ve gastos ni resultados.
create or replace function gestiona_evento(p_evento uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select es_admin() or (mi_rol() = 'encargado' and acceso_evento(p_evento))
$$;


-- =============================================================================
--  VISTAS: acá vive la inteligencia del sistema
-- =============================================================================

-- --- 10.1 Conciliación de stock por evento ----------------------------------
-- La ecuación del negocio:
--   inicial + ingresos − ventas − egresos_no_venta = stock teórico
create or replace view v_stock_evento with (security_invoker = true) as
select
  m.evento_id,
  m.producto_id,
  p.sku,
  p.nombre,
  coalesce(sum(m.cantidad) filter (where m.tipo = 'ingreso_remito'), 0)      as ingresos,
  abs(coalesce(sum(m.cantidad) filter (where m.tipo = 'venta'), 0))          as vendidas,
  coalesce(sum(m.cantidad) filter (where m.tipo = 'anulacion_venta'), 0)     as ventas_anuladas,
  abs(coalesce(sum(m.cantidad) filter (where m.tipo in
      ('rotura','rotura_transito','degustacion','regalo',
       'consumo_interno','canje','vencimiento')), 0))                        as egresos_no_venta,
  abs(coalesce(sum(m.cantidad) filter (where m.tipo = 'devolucion'), 0))     as devuelto_a_central,
  sum(m.cantidad)                                                            as stock_teorico
from movimientos_stock m
join productos p on p.id = m.producto_id
where m.evento_id is not null
group by m.evento_id, m.producto_id, p.sku, p.nombre;


-- --- 10.2 Stock de central --------------------------------------------------
create or replace view v_stock_central with (security_invoker = true) as
select m.producto_id, p.sku, p.nombre, sum(m.cantidad) as stock
from movimientos_stock m
join productos p on p.id = m.producto_id
where m.evento_id is null
group by m.producto_id, p.sku, p.nombre;


-- --- 10.3 Ventas por medio de pago ------------------------------------------
create or replace view v_ventas_por_medio with (security_invoker = true) as
select
  v.evento_id,
  v.jornada_id,
  vp.medio,
  count(distinct v.id)     as operaciones,
  sum(vp.importe)          as bruto,
  sum(vp.neto_estimado)    as neto_estimado,
  sum(vp.importe - vp.neto_estimado) as comisiones
from ventas v
join venta_pagos vp on vp.venta_id = v.id
where not v.anulada
group by v.evento_id, v.jornada_id, vp.medio;


-- --- 10.4 Arqueo de caja por jornada ----------------------------------------
-- Efectivo esperado = fondo inicial + ventas en efectivo − gastos pagados de la caja.
-- La diferencia contra lo contado es el control real sobre el personal temporal.
create or replace view v_arqueo_jornada with (security_invoker = true) as
select
  j.id as jornada_id,
  j.evento_id,
  j.fecha,
  j.fondo_inicial,
  coalesce(ef.total, 0)                                   as ventas_efectivo,
  coalesce(g.total, 0)                                    as gastos_de_caja,
  j.fondo_inicial + coalesce(ef.total,0) - coalesce(g.total,0) as efectivo_esperado,
  j.efectivo_contado,
  j.efectivo_contado - (j.fondo_inicial + coalesce(ef.total,0) - coalesce(g.total,0)) as diferencia
from jornadas j
left join lateral (
  select sum(vp.importe) as total
    from ventas v join venta_pagos vp on vp.venta_id = v.id
   where v.jornada_id = j.id and vp.medio = 'efectivo' and not v.anulada
) ef on true
left join lateral (
  select sum(importe) as total from gastos
   where jornada_id = j.id and pagado_por = 'caja_evento' and medio = 'efectivo'
) g on true;


-- --- 10.5 Rentabilidad del evento -------------------------------------------
-- La vista que decide si el año que viene vuelven a esa feria.
-- Devuelve filas SOLO para usuarios con rol 'admin' (ver el `where` del final).
-- Si consultás desde el SQL Editor sin sesión, va a dar 0 filas: es correcto.
create or replace view v_resultado_evento with (security_invoker = true) as
select
  e.id as evento_id,
  e.nombre,
  e.provincia,
  e.fecha_inicio,
  e.fecha_fin,
  coalesce(ven.total_vendido, 0)        as ventas_brutas,
  coalesce(ven.neto_cobrado, 0)         as neto_cobrado,
  coalesce(ven.unidades, 0)             as unidades_vendidas,
  coalesce(ven.tickets, 0)              as tickets,
  case when coalesce(ven.tickets,0) > 0
       then round(ven.total_vendido / ven.tickets, 2) end as ticket_promedio,
  coalesce(cmv.costo, 0)                as costo_mercaderia_vendida,
  coalesce(gas.total, 0) + e.canon_stand as gastos_totales,
  coalesce(ven.neto_cobrado,0) - coalesce(cmv.costo,0)
    - coalesce(gas.total,0) - e.canon_stand as margen
from eventos e
left join lateral (
  select sum(v.total) as total_vendido,
         sum(vp.neto) as neto_cobrado,
         count(*)     as tickets,
         sum(u.unid)  as unidades
    from ventas v
    left join lateral (select sum(neto_estimado) neto from venta_pagos where venta_id = v.id) vp on true
    left join lateral (select sum(cantidad) unid from venta_items where venta_id = v.id) u on true
   where v.evento_id = e.id and not v.anulada
) ven on true
left join lateral (
  select sum(vi.cantidad * coalesce(pc.costo_unitario, 0)) as costo
    from ventas v
    join venta_items vi on vi.venta_id = v.id
    left join producto_costos pc on pc.producto_id = vi.producto_id
   where v.evento_id = e.id and not v.anulada
) cmv on true
left join lateral (
  select sum(importe) as total from gastos where evento_id = e.id
) gas on true
where es_admin();   -- el margen del negocio no sale de los dueños


-- --- 10.6 Liquidación del personal ------------------------------------------
create or replace view v_liquidacion_personal with (security_invoker = true) as
select
  ep.evento_id,
  ep.personal_id,
  pe.nombre,
  ep.modalidad,
  ep.dias_trabajados * ep.jornal_diario as por_jornal,
  coalesce(vv.vendido, 0)               as vendido,
  round(coalesce(vv.vendido,0) * ep.comision_pct / 100, 2) as por_comision,
  ep.adelantos,
  case ep.modalidad
    when 'jornal'          then ep.dias_trabajados * ep.jornal_diario
    when 'comision'        then round(coalesce(vv.vendido,0) * ep.comision_pct / 100, 2)
    when 'jornal_comision' then ep.dias_trabajados * ep.jornal_diario
                                + round(coalesce(vv.vendido,0) * ep.comision_pct / 100, 2)
    else 0
  end - ep.adelantos as a_pagar,
  ep.liquidado
from evento_personal ep
join personal pe on pe.id = ep.personal_id
left join lateral (
  select sum(v.total) as vendido from ventas v
   where v.evento_id = ep.evento_id and v.vendedor_id = ep.personal_id and not v.anulada
) vv on true
where es_admin()
   or exists (select 1 from perfiles pf
               where pf.id = auth.uid() and pf.personal_id = ep.personal_id);


-- =============================================================================
--  RLS — Row Level Security
--  Regla de oro: el vendedor temporal solo ve SU evento y nunca ve costos.
-- =============================================================================

alter table personal            enable row level security;
alter table perfiles            enable row level security;
alter table productos           enable row level security;
alter table producto_costos     enable row level security;
alter table cuentas             enable row level security;
alter table eventos             enable row level security;
alter table evento_precios      enable row level security;
alter table promociones         enable row level security;
alter table evento_personal     enable row level security;
alter table remitos             enable row level security;
alter table remito_items        enable row level security;
alter table movimientos_stock   enable row level security;
alter table jornadas            enable row level security;
alter table ventas              enable row level security;
alter table venta_items         enable row level security;
alter table venta_pagos         enable row level security;
alter table gastos              enable row level security;
alter table categorias_gasto    enable row level security;

-- Perfiles: cada uno se ve a sí mismo; el admin ve todos.
create policy perfiles_select on perfiles for select using (id = auth.uid() or es_admin());
create policy perfiles_admin  on perfiles for all    using (es_admin()) with check (es_admin());

-- Catálogo: lectura para todo usuario logueado, escritura solo admin.
create policy productos_read  on productos for select using (auth.uid() is not null);
create policy productos_write on productos for all using (es_admin()) with check (es_admin());

-- Los costos, en cambio, no salen de la fila del admin. Un vendedor que haga
-- `select *` sobre producto_costos recibe cero filas, no un error.
create policy costos_admin on producto_costos for all
  using (es_admin()) with check (es_admin());

create policy cuentas_read  on cuentas for select using (auth.uid() is not null);
create policy cuentas_write on cuentas for all using (es_admin()) with check (es_admin());

create policy personal_read  on personal for select using (auth.uid() is not null);
create policy personal_write on personal for all using (es_admin()) with check (es_admin());

create policy categorias_read  on categorias_gasto for select using (auth.uid() is not null);
create policy categorias_write on categorias_gasto for all using (es_admin()) with check (es_admin());

-- Eventos y todo lo que cuelga de ellos: solo si estás asignado.
create policy eventos_read  on eventos for select using (acceso_evento(id));
create policy eventos_write on eventos for all using (es_admin()) with check (es_admin());

create policy precios_read  on evento_precios for select using (acceso_evento(evento_id));
create policy precios_write on evento_precios for all using (es_admin()) with check (es_admin());

create policy promos_read  on promociones for select
  using (evento_id is null or acceso_evento(evento_id));
create policy promos_write on promociones for all using (es_admin()) with check (es_admin());

create policy ep_read  on evento_personal for select using (acceso_evento(evento_id));
create policy ep_write on evento_personal for all using (es_admin()) with check (es_admin());

create policy remitos_read on remitos for select using (acceso_evento(evento_id));
create policy remitos_upd  on remitos for update using (acceso_evento(evento_id));
create policy remitos_ins  on remitos for insert with check (es_admin());

create policy remito_items_read on remito_items for select
  using (exists (select 1 from remitos r where r.id = remito_id and acceso_evento(r.evento_id)));
create policy remito_items_upd on remito_items for update
  using (exists (select 1 from remitos r where r.id = remito_id and acceso_evento(r.evento_id)));
create policy remito_items_ins on remito_items for insert with check (es_admin());

create policy mov_read on movimientos_stock for select
  using (evento_id is null and es_admin() or acceso_evento(evento_id));
create policy mov_ins on movimientos_stock for insert
  with check (es_admin() or acceso_evento(evento_id));

create policy jornadas_all on jornadas for all
  using (acceso_evento(evento_id)) with check (acceso_evento(evento_id));

create policy ventas_all on ventas for all
  using (acceso_evento(evento_id)) with check (acceso_evento(evento_id));

create policy vi_all on venta_items for all
  using (exists (select 1 from ventas v where v.id = venta_id and acceso_evento(v.evento_id)))
  with check (exists (select 1 from ventas v where v.id = venta_id and acceso_evento(v.evento_id)));

create policy vp_all on venta_pagos for all
  using (exists (select 1 from ventas v where v.id = venta_id and acceso_evento(v.evento_id)))
  with check (exists (select 1 from ventas v where v.id = venta_id and acceso_evento(v.evento_id)));

create policy gastos_all on gastos for all
  using (case when evento_id is null then es_admin() else gestiona_evento(evento_id) end)
  with check (case when evento_id is null then es_admin() else gestiona_evento(evento_id) end);

-- Vista segura de catálogo para la pantalla de venta: sin costos.
create or replace view v_productos_venta with (security_invoker = true) as
select p.id, p.sku, p.nombre, p.sabor, p.presentacion_g, p.imagen_url, p.orden, p.activo,
       p.precio_lista
from productos p
where p.activo;


-- =============================================================================
--  ALTA AUTOMÁTICA DE PERFIL AL REGISTRARSE
-- =============================================================================
create or replace function fn_nuevo_usuario()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.perfiles (id, nombre, rol)
  values (new.id, coalesce(new.raw_user_meta_data->>'nombre', new.email), 'vendedor')
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger trg_nuevo_usuario
after insert on auth.users
for each row execute function fn_nuevo_usuario();


-- =============================================================================
--  DATOS INICIALES
-- =============================================================================
insert into categorias_gasto (nombre) values
  ('Canon / alquiler de stand'),
  ('Flete y logística'),
  ('Combustible y peajes'),
  ('Alojamiento'),
  ('Comida del equipo'),
  ('Jornales'),
  ('Embalaje e insumos'),
  ('Alquiler de equipos'),
  ('Energía / servicios'),
  ('Publicidad'),
  ('Otros')
on conflict (nombre) do nothing;

insert into cuentas (nombre, tipo, comision_pct) values
  ('Caja del evento', 'caja', 0)
on conflict do nothing;


-- =============================================================================
--  PERMISOS
--  Supabase ya concede estos privilegios por defecto en `public`; se dejan
--  explícitos para que el script sea reproducible en cualquier Postgres.
--  Quién ve qué lo decide RLS, no estos grants.
-- =============================================================================
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant execute on all functions in schema public to authenticated;

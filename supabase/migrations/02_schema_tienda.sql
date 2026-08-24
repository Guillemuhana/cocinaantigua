-- =============================================================================
--  SISTEMA DE GESTIÓN DE EVENTOS — Mermeladas artesanales
--  Migración 02: TIENDA ONLINE
--
--  Requiere haber corrido antes 01_schema_eventos.sql
--
--  Idea central: la tienda NO es un sistema paralelo. Es un canal de venta más
--  que descuenta del mismo depósito central que abastece a las ferias. Por eso
--  `ventas` se vuelve el libro único de los dos canales y el stock disponible
--  para la web se calcula descontando lo que ya está comprometido a un evento.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. TIPOS
-- -----------------------------------------------------------------------------

create type canal_venta as enum ('evento', 'online', 'mayorista');

create type estado_pedido as enum (
  'carrito',            -- todavía no confirmó
  'pendiente_pago',     -- confirmado, esperando que pague
  'pagado',
  'en_preparacion',
  'despachado',
  'entregado',
  'cancelado',
  'devuelto'
);

create type tipo_envio as enum ('domicilio', 'sucursal', 'retiro_local', 'retiro_evento');

create type estado_reserva as enum ('activa', 'consumida', 'liberada');


-- -----------------------------------------------------------------------------
-- 2. EL CATÁLOGO SE HACE PÚBLICO
-- -----------------------------------------------------------------------------

alter table productos
  add column slug             text unique,
  add column descripcion      text,
  add column descripcion_web  text,          -- texto de venta, más largo
  add column ingredientes     text,
  add column peso_g           integer,       -- peso real con envase, para el envío
  add column precio_web       numeric(14,2), -- si es null, se usa precio_lista
  add column visible_web      boolean not null default false,
  add column destacado_web    boolean not null default false,
  -- Colchón para las ferias: unidades que la web NUNCA puede vender, aunque
  -- figuren en el depósito. Es lo que evita quedarse sin mercadería el día
  -- antes de salir para una feria grande.
  add column reserva_ferias   integer not null default 0;

create index on productos (visible_web) where visible_web;

-- Varias fotos por producto: en una tienda una sola imagen no alcanza.
create table producto_imagenes (
  id           uuid primary key default gen_random_uuid(),
  producto_id  uuid not null references productos(id) on delete cascade,
  url          text not null,
  alt          text,
  orden        integer not null default 0
);

create index on producto_imagenes (producto_id, orden);

create table categorias (
  id      uuid primary key default gen_random_uuid(),
  nombre  text not null,
  slug    text unique not null,
  orden   integer not null default 0,
  activa  boolean not null default true
);

create table producto_categorias (
  producto_id  uuid not null references productos(id) on delete cascade,
  categoria_id uuid not null references categorias(id) on delete cascade,
  primary key (producto_id, categoria_id)
);


-- -----------------------------------------------------------------------------
-- 3. CLIENTES
-- -----------------------------------------------------------------------------

-- El cliente web puede tener cuenta (auth_user_id) o comprar como invitado.
-- La mayoría compra como invitado: no obligarlos a registrarse.
create table clientes (
  id            uuid primary key default gen_random_uuid(),
  auth_user_id  uuid unique references auth.users(id) on delete set null,
  nombre        text not null,
  email         text,
  telefono      text,
  documento     text,
  notas         text,
  created_at    timestamptz not null default now()
);

create index on clientes (lower(email));

create table direcciones (
  id           uuid primary key default gen_random_uuid(),
  cliente_id   uuid not null references clientes(id) on delete cascade,
  calle        text not null,
  numero       text,
  piso_depto   text,
  localidad    text not null,
  provincia    text not null,
  codigo_postal text not null,
  referencia   text,
  predeterminada boolean not null default false,
  created_at   timestamptz not null default now()
);

create index on direcciones (cliente_id);


-- -----------------------------------------------------------------------------
-- 4. ENVÍOS
-- -----------------------------------------------------------------------------

-- Zonas tarifadas. En Argentina el costo cambia muchísimo entre CABA/GBA,
-- interior y Patagonia: conviene tarifa por zona y no un precio único.
create table zonas_envio (
  id           uuid primary key default gen_random_uuid(),
  nombre       text not null,               -- "CABA y GBA", "Interior", "Patagonia"
  provincias   text[] not null default '{}',
  activa       boolean not null default true
);

create table metodos_envio (
  id                uuid primary key default gen_random_uuid(),
  nombre            text not null,          -- "Correo Argentino a domicilio"
  tipo              tipo_envio not null,
  zona_id           uuid references zonas_envio(id) on delete cascade,
  costo             numeric(14,2) not null default 0,
  costo_por_kg      numeric(14,2) not null default 0,
  -- Envío gratis a partir de cierto monto. Null = nunca gratis.
  gratis_desde      numeric(14,2),
  plazo_dias        text,                   -- "3 a 5 días hábiles"
  activo            boolean not null default true
);

-- Retiro en feria: "comprá online y te lo llevo al stand".
-- Aprovecha que ya viajan con mercadería y ahorra el costo de envío.
create table puntos_retiro_evento (
  id          uuid primary key default gen_random_uuid(),
  evento_id   uuid not null references eventos(id) on delete cascade,
  instrucciones text,
  activo      boolean not null default true,
  unique (evento_id)
);


-- -----------------------------------------------------------------------------
-- 5. CUPONES
-- -----------------------------------------------------------------------------

create table cupones (
  id             uuid primary key default gen_random_uuid(),
  codigo         text unique not null,
  descripcion    text,
  porcentaje     numeric(5,2) not null default 0 check (porcentaje between 0 and 100),
  monto_fijo     numeric(14,2) not null default 0,
  minimo_compra  numeric(14,2) not null default 0,
  usos_maximos   integer,                   -- null = ilimitado
  usos           integer not null default 0,
  vigente_desde  date,
  vigente_hasta  date,
  activo         boolean not null default true
);


-- -----------------------------------------------------------------------------
-- 6. PEDIDOS
--    El pedido es el documento comercial (lo que el cliente compró y a dónde va).
--    La venta es el hecho contable y de stock. Se separan porque un pedido puede
--    existir sin haber descontado stock todavía: el frasco no sale del depósito
--    hasta que la plata esté acreditada.
-- -----------------------------------------------------------------------------

create sequence pedido_numero_seq start 1000;

create table pedidos (
  id                 uuid primary key default gen_random_uuid(),
  numero             integer not null default nextval('pedido_numero_seq') unique,
  cliente_id         uuid references clientes(id) on delete set null,
  estado             estado_pedido not null default 'carrito',

  -- Datos de contacto congelados en el momento de la compra: si el cliente
  -- después edita su perfil, el pedido histórico no debe cambiar.
  email_contacto     text,
  telefono_contacto  text,
  nombre_contacto    text,

  -- Envío
  metodo_envio_id    uuid references metodos_envio(id),
  tipo_envio         tipo_envio,
  evento_retiro_id   uuid references eventos(id),   -- si retira en una feria
  direccion_texto    text,                          -- snapshot de la dirección
  costo_envio        numeric(14,2) not null default 0,
  tracking           text,
  costo_envio_real   numeric(14,2) not null default 0,  -- lo que se le paga al correo

  -- Importes
  subtotal           numeric(14,2) not null default 0,
  cupon_id           uuid references cupones(id),
  descuento          numeric(14,2) not null default 0,
  total              numeric(14,2) not null default 0,

  -- Pago
  medio_pago_web     medio_pago,
  pago_referencia    text,          -- id de pago de la pasarela
  pago_preferencia   text,          -- id de preferencia / link de checkout
  comprobante_url    text,          -- si pagó por transferencia y sube el comprobante
  pagado_at          timestamptz,

  notas_cliente      text,
  notas_internas     text,
  venta_id           uuid references ventas(id) on delete set null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index on pedidos (estado, created_at desc);
create index on pedidos (cliente_id);

create table pedido_items (
  id               uuid primary key default gen_random_uuid(),
  pedido_id        uuid not null references pedidos(id) on delete cascade,
  producto_id      uuid not null references productos(id),
  -- Snapshot: nombre y precio quedan congelados. Si mañana suben el precio o
  -- renombran el producto, el pedido viejo sigue diciendo lo que el cliente compró.
  nombre_snapshot  text not null,
  precio_unitario  numeric(14,2) not null check (precio_unitario >= 0),
  cantidad         integer not null check (cantidad > 0),
  subtotal         numeric(14,2) generated always as (cantidad * precio_unitario) stored,
  unique (pedido_id, producto_id)
);

create index on pedido_items (pedido_id);


-- -----------------------------------------------------------------------------
-- 7. RESERVAS DE STOCK
--    Sin esto, dos personas compran el último frasco de higo al mismo tiempo.
--    La reserva se crea al confirmar el pedido y se consume al pagarlo.
-- -----------------------------------------------------------------------------

create table reservas_stock (
  id           uuid primary key default gen_random_uuid(),
  pedido_id    uuid not null references pedidos(id) on delete cascade,
  producto_id  uuid not null references productos(id),
  cantidad     integer not null check (cantidad > 0),
  estado       estado_reserva not null default 'activa',
  expira_at    timestamptz not null default now() + interval '48 hours',
  created_at   timestamptz not null default now()
);

create index on reservas_stock (producto_id) where estado = 'activa';
create index on reservas_stock (expira_at) where estado = 'activa';


-- -----------------------------------------------------------------------------
-- 8. VENTAS: ahora es el libro único de los dos canales
-- -----------------------------------------------------------------------------

alter table ventas
  add column canal canal_venta not null default 'evento',
  add column pedido_id uuid references pedidos(id) on delete set null,
  -- El envío que se le cobró al cliente NO es venta de mermelada: es un cargo
  -- que se compensa con lo que se le paga al correo. Si entra dentro de `total`,
  -- las ventas quedan infladas y el margen por frasco deja de ser real.
  add column cargo_envio numeric(14,2) not null default 0;

-- Una venta online no pertenece a ningún evento: descuenta de central.
alter table ventas alter column evento_id drop not null;

alter table ventas add constraint venta_canal_coherente check (
  (canal = 'evento' and evento_id is not null)
  or (canal <> 'evento' and evento_id is null)
);

create index on ventas (canal, created_at desc);

-- La política vieja asumía que toda venta tenía evento. Se reemplaza.
drop policy if exists ventas_all on ventas;
create policy ventas_all on ventas for all
  using (case when evento_id is null then es_admin() else acceso_evento(evento_id) end)
  with check (case when evento_id is null then es_admin() else acceso_evento(evento_id) end);

drop policy if exists vi_all on venta_items;
create policy vi_all on venta_items for all
  using (exists (select 1 from ventas v where v.id = venta_id
                  and (case when v.evento_id is null then es_admin() else acceso_evento(v.evento_id) end)))
  with check (exists (select 1 from ventas v where v.id = venta_id
                  and (case when v.evento_id is null then es_admin() else acceso_evento(v.evento_id) end)));

drop policy if exists vp_all on venta_pagos;
create policy vp_all on venta_pagos for all
  using (exists (select 1 from ventas v where v.id = venta_id
                  and (case when v.evento_id is null then es_admin() else acceso_evento(v.evento_id) end)))
  with check (exists (select 1 from ventas v where v.id = venta_id
                  and (case when v.evento_id is null then es_admin() else acceso_evento(v.evento_id) end)));


-- =============================================================================
--  TRIGGERS
-- =============================================================================

-- --- 9.1 Recalcular totales del pedido --------------------------------------
create or replace function fn_recalcular_pedido()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_pedido uuid;
  v_sub    numeric(14,2);
begin
  v_pedido := coalesce(new.pedido_id, old.pedido_id);
  select coalesce(sum(subtotal), 0) into v_sub from pedido_items where pedido_id = v_pedido;
  update pedidos
     set subtotal = v_sub,
         total    = v_sub - descuento + costo_envio,
         updated_at = now()
   where id = v_pedido;
  return coalesce(new, old);
end;
$$;

create trigger trg_total_pedido
after insert or update or delete on pedido_items
for each row execute function fn_recalcular_pedido();


-- --- 9.2 Confirmación del pedido -> reserva de stock -------------------------
create or replace function fn_reservar_stock()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.estado = 'pendiente_pago' and old.estado = 'carrito' then
    insert into reservas_stock (pedido_id, producto_id, cantidad)
    select new.id, pi.producto_id, pi.cantidad
      from pedido_items pi
     where pi.pedido_id = new.id;
  end if;

  -- Si se cancela o se cae, la mercadería vuelve a estar disponible.
  if new.estado in ('cancelado', 'devuelto') and old.estado not in ('cancelado', 'devuelto') then
    update reservas_stock set estado = 'liberada'
     where pedido_id = new.id and estado = 'activa';
  end if;

  return new;
end;
$$;

create trigger trg_reservar_stock
after update of estado on pedidos
for each row execute function fn_reservar_stock();


-- --- 9.3 Pedido pagado -> se genera la venta real ----------------------------
-- Acá recién se descuenta stock de verdad: el trigger de venta_items de la
-- migración 01 genera solo el movimiento (evento_id null = depósito central).
create or replace function fn_pedido_pagado()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_venta uuid;
begin
  if new.estado = 'pagado' and old.estado <> 'pagado' and new.venta_id is null then

    -- `descuento` y `cargo_envio` se cargan ANTES de los items: el trigger
    -- trg_total_venta calcula total = suma de items − descuento, dejando en
    -- `total` solo la mercadería.
    insert into ventas (evento_id, canal, tipo, pedido_id, descuento, cargo_envio, creado_por)
    values (null, 'online', 'detallada', new.id, new.descuento, new.costo_envio, auth.uid())
    returning id into v_venta;

    insert into venta_items (venta_id, producto_id, cantidad, precio_unitario)
    select v_venta, pi.producto_id, pi.cantidad, pi.precio_unitario
      from pedido_items pi
     where pi.pedido_id = new.id;

    -- El pago, en cambio, es lo que el cliente efectivamente abonó: mercadería
    -- menos descuento más envío.
    insert into venta_pagos (venta_id, medio, importe, referencia, comprobante_url)
    values (v_venta,
            coalesce(new.medio_pago_web, 'transferencia'),
            new.total,
            new.pago_referencia,
            new.comprobante_url);

    update reservas_stock set estado = 'consumida'
     where pedido_id = new.id and estado = 'activa';

    new.venta_id  := v_venta;
    new.pagado_at := coalesce(new.pagado_at, now());

    if new.cupon_id is not null then
      update cupones set usos = usos + 1 where id = new.cupon_id;
    end if;
  end if;

  return new;
end;
$$;

create trigger trg_pedido_pagado
before update of estado on pedidos
for each row execute function fn_pedido_pagado();


-- --- 9.4 Liberar reservas vencidas ------------------------------------------
-- Llamar desde un cron de Supabase (pg_cron) cada 15 minutos.
create or replace function liberar_reservas_vencidas()
returns integer language plpgsql security definer set search_path = public as $$
declare v_count integer;
begin
  update reservas_stock
     set estado = 'liberada'
   where estado = 'activa' and expira_at < now();
  get diagnostics v_count = row_count;

  update pedidos set estado = 'cancelado', notas_internas =
         coalesce(notas_internas || ' | ', '') || 'Cancelado automáticamente por falta de pago'
   where estado = 'pendiente_pago'
     and id in (select pedido_id from reservas_stock where estado = 'liberada')
     and created_at < now() - interval '48 hours';

  return v_count;
end;
$$;


-- =============================================================================
--  VISTAS
-- =============================================================================

-- --- 10.1 Stock realmente vendible por internet ------------------------------
-- La vista más importante del módulo. Al stock de central le resta:
--   · lo reservado por pedidos sin pagar todavía
--   · lo que está armado en un remito en borrador (ya apartado para una feria)
--   · el colchón fijo que el dueño quiere proteger para las ferias
-- Sin estos tres descuentos, la web vende frascos que ya no están.
create or replace view v_stock_web with (security_invoker = true) as
select
  p.id                as producto_id,
  p.sku,
  p.nombre,
  p.slug,
  coalesce(sc.stock, 0)                                   as stock_central,
  coalesce(res.reservado, 0)                              as reservado,
  coalesce(rem.comprometido, 0)                           as comprometido_ferias,
  p.reserva_ferias                                        as colchon_ferias,
  greatest(
    coalesce(sc.stock, 0) - coalesce(res.reservado, 0)
      - coalesce(rem.comprometido, 0) - p.reserva_ferias, 0
  )                                                       as disponible_web
from productos p
left join lateral (
  select sum(m.cantidad) as stock from movimientos_stock m
   where m.evento_id is null and m.producto_id = p.id
) sc on true
left join lateral (
  select sum(r.cantidad) as reservado from reservas_stock r
   where r.producto_id = p.id and r.estado = 'activa' and r.expira_at > now()
) res on true
left join lateral (
  select sum(ri.cantidad_enviada) as comprometido
    from remito_items ri join remitos rm on rm.id = ri.remito_id
   where ri.producto_id = p.id and rm.estado = 'borrador' and rm.tipo <> 'devolucion'
) rem on true
where p.activo;


-- --- 10.2 Catálogo público ---------------------------------------------------
-- Lo que consume la tienda. Sin costos, sin datos internos.
create or replace view v_catalogo_web with (security_invoker = true) as
select
  p.id, p.sku, p.slug, p.nombre, p.sabor, p.presentacion_g,
  p.descripcion, p.descripcion_web, p.ingredientes, p.peso_g,
  coalesce(p.precio_web, p.precio_lista) as precio,
  p.destacado_web,
  (select coalesce(json_agg(json_build_object('url', pi.url, 'alt', pi.alt) order by pi.orden), '[]'::json)
     from producto_imagenes pi where pi.producto_id = p.id) as imagenes,
  (select coalesce(json_agg(c.slug), '[]'::json)
     from producto_categorias pc join categorias c on c.id = pc.categoria_id
    where pc.producto_id = p.id) as categorias
from productos p
where p.activo and p.visible_web;


-- --- 10.3 Comparación entre canales ------------------------------------------
-- ¿Rinde más una feria o la tienda? Con esto se decide dónde poner el esfuerzo.
create or replace view v_resultado_canal with (security_invoker = true) as
select
  v.canal,
  date_trunc('month', v.created_at)::date as mes,
  count(*)                                       as operaciones,
  sum(v.total)                                   as venta_mercaderia,
  sum(v.cargo_envio)                             as envio_cobrado,
  sum(pg.neto)                                   as cobrado_neto,
  sum(pg.importe - pg.neto)                      as comisiones_pasarela,
  sum(cst.costo)                                 as costo_mercaderia,
  -- Margen bruto real: lo que entró, menos comisiones, menos el costo de la
  -- mermelada, menos el envío (que se le paga al correo, no queda en la casa).
  sum(pg.neto) - sum(cst.costo) - sum(v.cargo_envio) as margen_bruto
from ventas v
left join lateral (select sum(neto_estimado) neto, sum(importe) importe
                     from venta_pagos where venta_id = v.id) pg on true
left join lateral (
  select sum(vi.cantidad * coalesce(pc.costo_unitario, 0)) costo
    from venta_items vi
    left join producto_costos pc on pc.producto_id = vi.producto_id
   where vi.venta_id = v.id
) cst on true
where not v.anulada and es_admin()
group by v.canal, date_trunc('month', v.created_at);


-- =============================================================================
--  RLS DE LA TIENDA
--  El catálogo es público (rol `anon`). Todo lo demás, no.
-- =============================================================================

alter table producto_imagenes    enable row level security;
alter table categorias           enable row level security;
alter table producto_categorias  enable row level security;
alter table clientes             enable row level security;
alter table direcciones          enable row level security;
alter table zonas_envio          enable row level security;
alter table metodos_envio        enable row level security;
alter table puntos_retiro_evento enable row level security;
alter table cupones              enable row level security;
alter table pedidos              enable row level security;
alter table pedido_items         enable row level security;
alter table reservas_stock       enable row level security;

-- ¿Este pedido es del usuario logueado?
create or replace function es_mi_pedido(p_pedido uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from pedidos p
      join clientes c on c.id = p.cliente_id
     where p.id = p_pedido and c.auth_user_id = auth.uid()
  )
$$;

-- Catálogo: lectura pública, incluso sin sesión.
create policy prod_img_public on producto_imagenes for select using (true);
create policy prod_img_admin  on producto_imagenes for all using (es_admin()) with check (es_admin());

create policy categorias_public on categorias for select using (activa);
create policy categorias_admin  on categorias for all using (es_admin()) with check (es_admin());

create policy prod_cat_public on producto_categorias for select using (true);
create policy prod_cat_admin  on producto_categorias for all using (es_admin()) with check (es_admin());

create policy zonas_public on zonas_envio for select using (activa);
create policy zonas_admin  on zonas_envio for all using (es_admin()) with check (es_admin());

create policy envios_public on metodos_envio for select using (activo);
create policy envios_admin  on metodos_envio for all using (es_admin()) with check (es_admin());

create policy retiro_public on puntos_retiro_evento for select using (activo);
create policy retiro_admin  on puntos_retiro_evento for all using (es_admin()) with check (es_admin());

-- Cupones: NO son públicos. Se validan por Edge Function, nunca listándolos,
-- o cualquiera abre el devtools y se lleva todos los códigos de descuento.
create policy cupones_admin on cupones for all using (es_admin()) with check (es_admin());

-- Clientes: cada uno ve lo suyo.
create policy clientes_propio on clientes for select using (auth_user_id = auth.uid() or es_admin());
create policy clientes_update on clientes for update using (auth_user_id = auth.uid() or es_admin());
create policy clientes_admin  on clientes for all using (es_admin()) with check (es_admin());

create policy dir_propia on direcciones for all
  using (exists (select 1 from clientes c where c.id = cliente_id
                  and (c.auth_user_id = auth.uid() or es_admin())))
  with check (exists (select 1 from clientes c where c.id = cliente_id
                  and (c.auth_user_id = auth.uid() or es_admin())));

-- Pedidos: el cliente ve los suyos; el admin, todos.
-- La creación del pedido y el cambio a 'pagado' los hace una Edge Function con
-- service_role, no el navegador. Si el front pudiera marcar 'pagado', cualquiera
-- se autodespacharía mercadería gratis.
create policy pedidos_propio on pedidos for select using (es_mi_pedido(id) or es_admin());
create policy pedidos_admin  on pedidos for all using (es_admin()) with check (es_admin());

create policy pedido_items_propio on pedido_items for select
  using (es_mi_pedido(pedido_id) or es_admin());
create policy pedido_items_admin on pedido_items for all
  using (es_admin()) with check (es_admin());

create policy reservas_admin on reservas_stock for all using (es_admin()) with check (es_admin());


-- =============================================================================
--  PERMISOS PÚBLICOS
-- =============================================================================
grant usage on schema public to anon;
grant select on productos, producto_imagenes, categorias, producto_categorias,
                zonas_envio, metodos_envio, puntos_retiro_evento to anon;
grant select on v_catalogo_web, v_stock_web to anon;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant execute on all functions in schema public to authenticated;

-- `productos` sigue teniendo su política de lectura para usuarios logueados.
-- Se agrega una para visitantes anónimos, limitada a lo publicado en la tienda.
create policy productos_public on productos for select using (activo and visible_web);


-- =============================================================================
--  DATOS INICIALES
-- =============================================================================
insert into zonas_envio (nombre, provincias) values
  ('CABA y GBA', array['Ciudad Autónoma de Buenos Aires','Buenos Aires']),
  ('Centro', array['Córdoba','Santa Fe','Entre Ríos','La Pampa']),
  ('Norte', array['Catamarca','Chaco','Corrientes','Formosa','Jujuy','La Rioja','Misiones','Salta','Santiago del Estero','Tucumán']),
  ('Cuyo', array['Mendoza','San Juan','San Luis']),
  ('Patagonia', array['Chubut','Neuquén','Río Negro','Santa Cruz','Tierra del Fuego'])
on conflict do nothing;

insert into categorias (nombre, slug, orden) values
  ('Mermeladas', 'mermeladas', 1),
  ('Dulces', 'dulces', 2),
  ('Combos y regalos', 'combos', 3)
on conflict (slug) do nothing;

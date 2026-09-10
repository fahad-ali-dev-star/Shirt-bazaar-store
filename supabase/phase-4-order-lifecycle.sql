-- Phase 4: canonical order lifecycle and shipping metadata.
-- Run after Phase 3.

-- Canonical lifecycle:
-- pending -> paid -> processing -> shipped -> fulfilled
-- pending/paid/processing may be cancelled where appropriate.
-- refunded is reserved for a future Stripe refund flow.

do $$
begin
  if not exists (
    select 1 from pg_enum e
    join pg_type t on t.oid = e.enumtypid
    where t.typname = 'order_status' and e.enumlabel = 'processing'
  ) then
    alter type order_status add value 'processing' after 'paid';
  end if;

  if not exists (
    select 1 from pg_enum e
    join pg_type t on t.oid = e.enumtypid
    where t.typname = 'order_status' and e.enumlabel = 'shipped'
  ) then
    alter type order_status add value 'shipped' after 'processing';
  end if;
end $$;

-- Phase 2 now requires authentication for checkout. Historical guest orders may still have
-- a null user_id, so we intentionally do not add a NOT NULL constraint here. New orders
-- are created by create_pending_order() with a required authenticated user id.

alter table orders
  add column if not exists courier text,
  add column if not exists tracking_number text,
  add column if not exists shipped_at timestamptz;

alter table orders
  drop constraint if exists orders_courier_length_check,
  drop constraint if exists orders_tracking_number_length_check;

alter table orders
  add constraint orders_courier_length_check
    check (courier is null or char_length(btrim(courier)) between 1 and 120) not valid,
  add constraint orders_tracking_number_length_check
    check (tracking_number is null or char_length(btrim(tracking_number)) between 1 and 160) not valid;

create index if not exists idx_orders_status_created_at
  on orders(status, created_at desc);

create index if not exists idx_orders_tracking_number
  on orders(tracking_number)
  where tracking_number is not null;

-- Keep shipping metadata internally consistent.
alter table orders
  drop constraint if exists orders_shipping_metadata_check;

alter table orders
  add constraint orders_shipping_metadata_check
  check (
    (status <> 'shipped' and status <> 'fulfilled')
    or (courier is not null and tracking_number is not null and shipped_at is not null)
  ) not valid;

-- One privileged transition function is the only supported admin order-status mutation.
-- This prevents invalid jumps such as pending -> fulfilled or paid -> shipped.
create or replace function transition_order_status(
  p_order_id uuid,
  p_status order_status,
  p_courier text default null,
  p_tracking_number text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order orders%rowtype;
  v_old_status order_status;
  v_courier text;
  v_tracking text;
  v_shipped_at timestamptz;
begin
  if p_order_id is null then
    raise exception 'Missing order id';
  end if;

  select * into v_order
  from orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'Order not found';
  end if;

  v_old_status := v_order.status;

  if v_old_status = p_status then
    return jsonb_build_object(
      'changed', false,
      'old_status', v_old_status,
      'status', v_order.status,
      'shipping_address', v_order.shipping_address
    );
  end if;

  if v_old_status = 'pending' and p_status not in ('cancelled') then
    raise exception 'Pending orders can only be cancelled before payment';
  end if;

  if v_old_status = 'paid' and p_status not in ('processing', 'cancelled') then
    raise exception 'Paid orders must move to processing or cancelled';
  end if;

  if v_old_status = 'processing' and p_status not in ('shipped', 'cancelled') then
    raise exception 'Processing orders must move to shipped or cancelled';
  end if;

  if v_old_status = 'shipped' and p_status <> 'fulfilled' then
    raise exception 'Shipped orders must move to fulfilled';
  end if;

  if v_old_status in ('fulfilled', 'cancelled', 'refunded') then
    raise exception 'This order is in a terminal state';
  end if;

  if p_status = 'shipped' then
    v_courier := nullif(btrim(coalesce(p_courier, '')), '');
    v_tracking := nullif(btrim(coalesce(p_tracking_number, '')), '');

    if v_courier is null or v_tracking is null then
      raise exception 'Courier and tracking number are required when shipping an order';
    end if;

    if char_length(v_courier) > 120 or char_length(v_tracking) > 160 then
      raise exception 'Shipping information is too long';
    end if;

    v_shipped_at := coalesce(v_order.shipped_at, now());
  else
    v_courier := v_order.courier;
    v_tracking := v_order.tracking_number;
    v_shipped_at := v_order.shipped_at;
  end if;

  update orders
  set status = p_status,
      courier = v_courier,
      tracking_number = v_tracking,
      shipped_at = v_shipped_at
  where id = p_order_id;

  return jsonb_build_object(
    'changed', true,
    'old_status', v_old_status,
    'status', p_status,
    'shipping_address', v_order.shipping_address,
    'courier', v_courier,
    'tracking_number', v_tracking,
    'shipped_at', v_shipped_at
  );
end;
$$;

revoke all on function transition_order_status(uuid, order_status, text, text) from public, anon, authenticated;
grant execute on function transition_order_status(uuid, order_status, text, text) to service_role;

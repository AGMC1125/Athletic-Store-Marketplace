-- ══════════════════════════════════════════════════════════════════════════════
-- ORDERS SYSTEM — Migration
-- Ejecutar en el SQL Editor de Supabase
-- ══════════════════════════════════════════════════════════════════════════════

-- ── 1. Tabla: orders ──────────────────────────────────────────────────────────
CREATE TABLE public.orders (
  id                   uuid        NOT NULL DEFAULT uuid_generate_v4(),
  folio                text        NOT NULL,
  store_id             uuid        NOT NULL,

  -- Datos del cliente (guest, sin registro requerido)
  customer_name        text        NOT NULL,
  customer_phone       text        NOT NULL,
  customer_phone_alt   text,
  customer_email       text,
  customer_address     text,
  customer_notes       text,

  -- Estado del pedido
  status               text        NOT NULL DEFAULT 'pending_payment'
    CHECK (status = ANY (ARRAY[
      'pending_payment',   -- Esperando comprobante de pago
      'payment_uploaded',  -- Comprobante subido, en revisión
      'paid',              -- Pago validado por la tienda
      'processing',        -- En proceso de preparación/envío
      'shipped',           -- Enviado al cliente
      'delivered',         -- Entregado
      'cancelled'          -- Cancelado (tiempo agotado u otro motivo)
    ])),
  cancellation_reason  text,

  -- Comprobante de pago
  payment_proof_url    text,
  payment_uploaded_at  timestamptz,

  -- Expiración automática: 24 h después de la creación
  expires_at           timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
  cancelled_at         timestamptz,

  -- Total del pedido
  total                numeric     NOT NULL DEFAULT 0 CHECK (total >= 0),

  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT orders_pkey      PRIMARY KEY (id),
  CONSTRAINT orders_folio_key UNIQUE (folio),
  CONSTRAINT orders_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id)
);

-- ── 2. Tabla: order_items ─────────────────────────────────────────────────────
CREATE TABLE public.order_items (
  id                   uuid     NOT NULL DEFAULT uuid_generate_v4(),
  order_id             uuid     NOT NULL,
  product_id           uuid,            -- NULL si el producto fue eliminado después

  -- Snapshot completo del producto al momento de la orden (inmutable)
  product_snapshot     jsonb    NOT NULL DEFAULT '{}',
  -- Contiene: name, price, discount_percentage, final_price,
  --           category, image_url, store_name, store_slug

  -- Selección del cliente
  selected_color       text,
  selected_color_hex   text,
  selected_size        text,
  quantity             integer  NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price           numeric  NOT NULL CHECK (unit_price >= 0),
  subtotal             numeric  NOT NULL CHECK (subtotal >= 0),

  created_at           timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT order_items_pkey            PRIMARY KEY (id),
  CONSTRAINT order_items_order_id_fkey   FOREIGN KEY (order_id)   REFERENCES public.orders(id)   ON DELETE CASCADE,
  CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL
);

-- ── 3. Índices ────────────────────────────────────────────────────────────────
CREATE INDEX idx_orders_store_id        ON public.orders(store_id);
CREATE INDEX idx_orders_customer_phone  ON public.orders(customer_phone);
CREATE INDEX idx_orders_folio           ON public.orders(folio);
CREATE INDEX idx_orders_status          ON public.orders(status);
CREATE INDEX idx_orders_expires_at      ON public.orders(expires_at) WHERE status = 'pending_payment';
CREATE INDEX idx_order_items_order_id   ON public.order_items(order_id);
CREATE INDEX idx_order_items_product_id ON public.order_items(product_id);

-- ── 4. Función: generar folio único ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.generate_order_folio()
RETURNS text LANGUAGE plpgsql AS $$
DECLARE
  _folio text;
  _date  text := to_char(now(), 'YYYYMMDD');
  _rand  text;
BEGIN
  LOOP
    _rand  := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 6));
    _folio := 'ASM-' || _date || '-' || _rand;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.orders WHERE folio = _folio);
  END LOOP;
  RETURN _folio;
END;
$$;

-- ── 5. Trigger: asignar folio automáticamente al insertar ────────────────────
CREATE OR REPLACE FUNCTION public.set_order_folio()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.folio IS NULL OR NEW.folio = '' THEN
    NEW.folio := public.generate_order_folio();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER orders_before_insert_set_folio
  BEFORE INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_order_folio();

-- ── 6. Trigger: updated_at automático ────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.orders_set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER orders_before_update_set_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.orders_set_updated_at();

-- ── 7. Función RPC: cancelar órdenes expiradas ───────────────────────────────
-- Se llama automáticamente desde las funciones de consulta o manualmente
CREATE OR REPLACE FUNCTION public.cancel_expired_orders()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  _count integer;
BEGIN
  UPDATE public.orders
  SET
    status              = 'cancelled',
    cancelled_at        = now(),
    cancellation_reason = 'Tiempo de pago agotado (24 horas)',
    updated_at          = now()
  WHERE
    status             = 'pending_payment'
    AND payment_proof_url IS NULL
    AND expires_at     < now();

  GET DIAGNOSTICS _count = ROW_COUNT;
  RETURN _count;
END;
$$;

-- ── 8. Función RPC: buscar orden por folio (acceso público / guest) ───────────
CREATE OR REPLACE FUNCTION public.get_order_by_folio(p_folio text)
RETURNS TABLE (
  id                  uuid,
  folio               text,
  store_id            uuid,
  status              text,
  customer_name       text,
  customer_phone      text,
  customer_phone_alt  text,
  customer_email      text,
  customer_address    text,
  customer_notes      text,
  payment_proof_url   text,
  payment_uploaded_at timestamptz,
  expires_at          timestamptz,
  cancelled_at        timestamptz,
  cancellation_reason text,
  total               numeric,
  created_at          timestamptz,
  updated_at          timestamptz,
  store_name          text,
  store_phone         text,
  store_logo_url      text,
  store_slug          text
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Auto-cancelar expiradas antes de devolver resultados
  PERFORM public.cancel_expired_orders();

  RETURN QUERY
  SELECT
    o.id, o.folio, o.store_id, o.status,
    o.customer_name, o.customer_phone, o.customer_phone_alt,
    o.customer_email, o.customer_address, o.customer_notes,
    o.payment_proof_url, o.payment_uploaded_at,
    o.expires_at, o.cancelled_at, o.cancellation_reason,
    o.total, o.created_at, o.updated_at,
    s.name       AS store_name,
    s.phone      AS store_phone,
    s.logo_url   AS store_logo_url,
    s.slug       AS store_slug
  FROM public.orders o
  JOIN public.stores  s ON s.id = o.store_id
  WHERE o.folio = p_folio;
END;
$$;

-- ── 9. Función RPC: buscar órdenes por teléfono (acceso público / guest) ──────
CREATE OR REPLACE FUNCTION public.get_orders_by_phone(p_phone text)
RETURNS TABLE (
  id             uuid,
  folio          text,
  store_id       uuid,
  status         text,
  customer_name  text,
  customer_phone text,
  total          numeric,
  expires_at     timestamptz,
  created_at     timestamptz,
  store_name     text,
  store_slug     text,
  store_logo_url text
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  PERFORM public.cancel_expired_orders();

  RETURN QUERY
  SELECT
    o.id, o.folio, o.store_id, o.status,
    o.customer_name, o.customer_phone,
    o.total, o.expires_at, o.created_at,
    s.name       AS store_name,
    s.slug       AS store_slug,
    s.logo_url   AS store_logo_url
  FROM public.orders  o
  JOIN public.stores  s ON s.id = o.store_id
  WHERE o.customer_phone = p_phone
  ORDER BY o.created_at DESC;
END;
$$;

-- ── 10. Función RPC: obtener items de una orden (acceso público) ──────────────
CREATE OR REPLACE FUNCTION public.get_order_items_by_folio(p_folio text)
RETURNS TABLE (
  id                uuid,
  order_id          uuid,
  product_id        uuid,
  product_snapshot  jsonb,
  selected_color    text,
  selected_color_hex text,
  selected_size     text,
  quantity          integer,
  unit_price        numeric,
  subtotal          numeric,
  created_at        timestamptz
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    oi.id, oi.order_id, oi.product_id,
    oi.product_snapshot,
    oi.selected_color, oi.selected_color_hex, oi.selected_size,
    oi.quantity, oi.unit_price, oi.subtotal, oi.created_at
  FROM public.order_items oi
  JOIN public.orders      o  ON o.id = oi.order_id
  WHERE o.folio = p_folio;
END;
$$;

-- ── 11. Función RPC: subir comprobante de pago (guest) ───────────────────────
-- El folio actúa como "token" de autenticación del cliente
CREATE OR REPLACE FUNCTION public.upload_payment_proof(
  p_folio            text,
  p_payment_proof_url text
)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  _order_status text;
  _expires_at   timestamptz;
BEGIN
  SELECT status, expires_at
    INTO _order_status, _expires_at
    FROM public.orders
   WHERE folio = p_folio;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Orden no encontrada';
  END IF;

  IF _order_status = 'cancelled' THEN
    RAISE EXCEPTION 'Esta orden está cancelada';
  END IF;

  IF _order_status NOT IN ('pending_payment', 'payment_uploaded') THEN
    RAISE EXCEPTION 'No se puede subir comprobante para una orden en estado: %', _order_status;
  END IF;

  UPDATE public.orders
  SET
    payment_proof_url   = p_payment_proof_url,
    payment_uploaded_at = now(),
    status              = 'payment_uploaded',
    updated_at          = now()
  WHERE folio = p_folio;

  RETURN 'ok';
END;
$$;

-- ── 12. RLS ───────────────────────────────────────────────────────────────────
ALTER TABLE public.orders      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Cualquiera (incluyendo guests) puede crear órdenes
CREATE POLICY "Anyone can insert orders"
  ON public.orders FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Cualquiera puede crear items de orden
CREATE POLICY "Anyone can insert order_items"
  ON public.order_items FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Dueños de tienda ven sus órdenes
CREATE POLICY "Store owners view their orders"
  ON public.orders FOR SELECT
  TO authenticated
  USING (
    store_id IN (
      SELECT id FROM public.stores WHERE owner_id = auth.uid()
    )
  );

-- Dueños de tienda ven los items de sus órdenes
CREATE POLICY "Store owners view their order_items"
  ON public.order_items FOR SELECT
  TO authenticated
  USING (
    order_id IN (
      SELECT o.id FROM public.orders o
      WHERE o.store_id IN (
        SELECT id FROM public.stores WHERE owner_id = auth.uid()
      )
    )
  );

-- Dueños de tienda actualizan estado de sus órdenes
CREATE POLICY "Store owners update their orders"
  ON public.orders FOR UPDATE
  TO authenticated
  USING (
    store_id IN (
      SELECT id FROM public.stores WHERE owner_id = auth.uid()
    )
  );

-- Admins: acceso completo
CREATE POLICY "Admins full access orders"
  ON public.orders FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins full access order_items"
  ON public.order_items FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ── 13. Permisos para funciones RPC (acceso anónimo) ─────────────────────────
GRANT EXECUTE ON FUNCTION public.cancel_expired_orders()                          TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_order_by_folio(text)                         TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_orders_by_phone(text)                        TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_order_items_by_folio(text)                   TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.upload_payment_proof(text, text)                 TO anon, authenticated;

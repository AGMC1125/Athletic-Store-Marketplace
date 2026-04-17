-- ============================================================
--  Athletic Store Marketplace — Schema Real v1.0
--  NOTA: Este archivo refleja el schema REAL que ya existe en
--  Supabase. Úsalo como referencia o para recrear el proyecto.
--
--  Si las tablas ya existen, ejecutar SOLO el archivo:
--    002_rls_policies_and_triggers.sql
-- ============================================================

-- ── Extensiones necesarias ───────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";   -- uuid_generate_v4()


-- ============================================================
--  TABLA: profiles
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id           UUID          PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email        TEXT          NOT NULL,
  full_name    TEXT,
  avatar_url   TEXT,
  plan         TEXT          NOT NULL DEFAULT 'free'
                             CHECK (plan IN ('free','basic')),
  role         TEXT          NOT NULL DEFAULT 'user'
                             CHECK (role IN ('user','admin')),
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);


-- ============================================================
--  TABLA: stores
--  Una tienda por dueño (owner_id UNIQUE).
-- ============================================================
CREATE TABLE IF NOT EXISTS public.stores (
  id             UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id       UUID          NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  name           TEXT          NOT NULL,
  slug           TEXT          NOT NULL UNIQUE,
  description    TEXT,
  logo_url       TEXT,
  banner_url     TEXT,
  phone          TEXT,
  address        TEXT,
  city           TEXT,
  state          TEXT,
  country        TEXT          DEFAULT 'México',
  is_active      BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);


-- ============================================================
--  TABLA: products
-- ============================================================
CREATE TABLE IF NOT EXISTS public.products (
  id                   UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id             UUID            NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  owner_id             UUID            NOT NULL REFERENCES public.profiles(id),
  name                 TEXT            NOT NULL,
  description          TEXT,
  price                NUMERIC         NOT NULL CHECK (price >= 0),
  category             TEXT            NOT NULL
                                       CHECK (category IN (
                                         'footwear','socks','shin_guards','goalkeeper_gloves'
                                       )),
  image_url            TEXT[],
  attributes           JSONB           NOT NULL DEFAULT '{}',
  is_active            BOOLEAN         NOT NULL DEFAULT TRUE,
  stock                INTEGER         NOT NULL DEFAULT 0 CHECK (stock >= 0),
  discount_percentage  INTEGER         CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
  created_at           TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);


-- ============================================================
--  TABLA: memberships
--  Historial de membresías. FK a profiles (no a stores).
-- ============================================================
CREATE TABLE IF NOT EXISTS public.memberships (
  id           UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id   UUID          NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan         TEXT          NOT NULL CHECK (plan IN ('free','basic')),
  status       TEXT          NOT NULL DEFAULT 'active'
                             CHECK (status IN ('active','cancelled','expired')),
  starts_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  ends_at      TIMESTAMPTZ,
  price_paid   NUMERIC       DEFAULT 0,
  notes        TEXT,
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);


-- ============================================================
--  TABLA: bank_accounts
--  Una cuenta bancaria por tienda (store_id UNIQUE).
-- ============================================================
CREATE TABLE IF NOT EXISTS public.bank_accounts (
  id           UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id     UUID          NOT NULL UNIQUE REFERENCES public.stores(id) ON DELETE CASCADE,
  clabe        TEXT          NOT NULL CHECK (char_length(clabe) = 18),
  bank_name    TEXT          NOT NULL,
  holder_name  TEXT          NOT NULL,
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

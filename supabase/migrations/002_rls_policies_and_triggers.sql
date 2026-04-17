-- ============================================================
--  Athletic Store Marketplace — RLS, Triggers e Índices
--
--  ✅ EJECUTAR ESTE ARCHIVO si las tablas ya existen en Supabase.
--
--  Ir a: Supabase Dashboard → SQL Editor → pegar y ejecutar.
-- ============================================================


-- ============================================================
--  HABILITAR ROW LEVEL SECURITY en todas las tablas
-- ============================================================
ALTER TABLE public.profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;


-- ============================================================
--  RLS: profiles
-- ============================================================

-- Cada usuario ve y edita solo su propio perfil
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- INSERT desde el trigger handle_new_user (SECURITY DEFINER)
-- o desde el código de registro (fallback)
CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Admins pueden leer y actualizar cualquier perfil
CREATE POLICY "profiles_select_admin"
  ON public.profiles FOR SELECT
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "profiles_update_admin"
  ON public.profiles FOR UPDATE
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );


-- ============================================================
--  RLS: stores
-- ============================================================

-- Lectura pública solo para tiendas activas
CREATE POLICY "stores_select_public"
  ON public.stores FOR SELECT
  USING (is_active = TRUE);

-- El dueño puede ver su propia tienda aunque esté inactiva
CREATE POLICY "stores_select_owner"
  ON public.stores FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "stores_insert_owner"
  ON public.stores FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "stores_update_owner"
  ON public.stores FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "stores_delete_owner"
  ON public.stores FOR DELETE
  USING (auth.uid() = owner_id);

-- Admins gestionan todas las tiendas
CREATE POLICY "stores_all_admin"
  ON public.stores FOR ALL
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );


-- ============================================================
--  RLS: products
-- ============================================================

-- Lectura pública: producto activo de tienda activa
CREATE POLICY "products_select_public"
  ON public.products FOR SELECT
  USING (
    is_active = TRUE
    AND EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = products.store_id AND s.is_active = TRUE
    )
  );

-- El dueño ve todos sus productos (activos e inactivos)
CREATE POLICY "products_select_owner"
  ON public.products FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "products_insert_owner"
  ON public.products FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "products_update_owner"
  ON public.products FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "products_delete_owner"
  ON public.products FOR DELETE
  USING (auth.uid() = owner_id);

-- Admins gestionan todos los productos
CREATE POLICY "products_all_admin"
  ON public.products FOR ALL
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );


-- ============================================================
--  RLS: memberships
-- ============================================================

-- El usuario ve solo sus membresías
CREATE POLICY "memberships_select_own"
  ON public.memberships FOR SELECT
  USING (auth.uid() = profile_id);

CREATE POLICY "memberships_insert_own"
  ON public.memberships FOR INSERT
  WITH CHECK (auth.uid() = profile_id);

-- Admins ven y gestionan todo
CREATE POLICY "memberships_all_admin"
  ON public.memberships FOR ALL
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );


-- ============================================================
--  RLS: bank_accounts
-- ============================================================

-- Lectura pública: cualquier visitante puede ver la CLABE de tiendas activas
CREATE POLICY "bank_accounts_select_public"
  ON public.bank_accounts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = bank_accounts.store_id AND s.is_active = TRUE
    )
  );

-- El dueño de la tienda ve y edita su cuenta bancaria
CREATE POLICY "bank_accounts_select_owner"
  ON public.bank_accounts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = bank_accounts.store_id AND s.owner_id = auth.uid()
    )
  );

CREATE POLICY "bank_accounts_insert_owner"
  ON public.bank_accounts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = bank_accounts.store_id AND s.owner_id = auth.uid()
    )
  );

CREATE POLICY "bank_accounts_update_owner"
  ON public.bank_accounts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = bank_accounts.store_id AND s.owner_id = auth.uid()
    )
  );

-- Admins ven todas las cuentas bancarias
CREATE POLICY "bank_accounts_select_admin"
  ON public.bank_accounts FOR SELECT
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );


-- ============================================================
--  TRIGGER: actualizar updated_at automáticamente
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar a todas las tablas con updated_at
CREATE OR REPLACE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER trg_stores_updated_at
  BEFORE UPDATE ON public.stores
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER trg_bank_accounts_updated_at
  BEFORE UPDATE ON public.bank_accounts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ============================================================
--  TRIGGER: crear perfil al registrarse un nuevo usuario
--  Se dispara automáticamente cuando Supabase Auth crea el user.
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, plan, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'free',
    'user'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Eliminar trigger anterior si existe antes de recrear
DROP TRIGGER IF EXISTS trg_on_auth_user_created ON auth.users;

CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ============================================================
--  ÍNDICES para performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_stores_owner_id    ON public.stores(owner_id);
CREATE INDEX IF NOT EXISTS idx_stores_slug        ON public.stores(slug);
CREATE INDEX IF NOT EXISTS idx_stores_is_active   ON public.stores(is_active);

CREATE INDEX IF NOT EXISTS idx_products_store_id  ON public.products(store_id);
CREATE INDEX IF NOT EXISTS idx_products_owner_id  ON public.products(owner_id);
CREATE INDEX IF NOT EXISTS idx_products_category  ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);

CREATE INDEX IF NOT EXISTS idx_memberships_profile ON public.memberships(profile_id);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_store ON public.bank_accounts(store_id);

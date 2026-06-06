-- Tablas para Finanzas Entre Cucharas

-- 1. Cuentas
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  initial_balance NUMERIC DEFAULT 0,
  type TEXT NOT NULL, -- 'Efectivo' | 'Banco'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Categorías
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'Ingreso' | 'Egreso' | 'Neutro'
  subcategories TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Transacciones
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date TIMESTAMPTZ NOT NULL,
  type TEXT NOT NULL, -- 'Ingreso' | 'Egreso' | 'Transferencia'
  category TEXT NOT NULL,
  subcategory TEXT,
  amount NUMERIC NOT NULL,
  description TEXT,
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  to_account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  quantity INTEGER,
  has_attachment BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Proveedores
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact TEXT,
  category TEXT,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Ingredientes
CREATE TABLE ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  unit TEXT NOT NULL, -- 'kg' | 'l' | 'unidad' | 'paquete'
  cost NUMERIC NOT NULL,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  min_stock NUMERIC DEFAULT 0,
  current_stock NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Recetas
CREATE TABLE recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  selling_price NUMERIC NOT NULL,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Ingredientes de Recetas (Muchos a Muchos)
CREATE TABLE recipe_ingredients (
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  ingredient_id UUID REFERENCES ingredients(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  PRIMARY KEY (recipe_id, ingredient_id)
);

-- 8. Cierres de Caja
CREATE TABLE daily_closings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date TIMESTAMPTZ NOT NULL,
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  system_balance NUMERIC NOT NULL,
  physical_amount NUMERIC NOT NULL,
  difference NUMERIC NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 8b. Vínculo Transacciones → Cierre de Caja
-- Cada cierre genera muchas transacciones con el MISMO timestamp. Antes el
-- "reemplazo" de un cierre borraba/reinsertaba buscando por fecha exacta, lo
-- cual es frágil. closing_id las vincula de forma precisa. Es NULLABLE para no
-- romper transacciones existentes ni las que se crean manualmente (sin cierre).
-- ON DELETE SET NULL: borrar un cierre no borra las transacciones por cascada;
-- el borrado de transacciones se maneja explícitamente en la app.
-- Idempotente: sirve también como migración sobre una base ya existente.
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS closing_id UUID REFERENCES daily_closings(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_transactions_closing_id ON transactions(closing_id);

-- Habilitar RLS (Seguridad a nivel de fila) - Opcional por ahora, pero recomendado
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_closings ENABLE ROW LEVEL SECURITY;

-- Crear políticas simples (Permitir todo por ahora para facilitar setup)
CREATE POLICY "Allow all for anonymous" ON accounts FOR ALL USING (true);
CREATE POLICY "Allow all for anonymous" ON categories FOR ALL USING (true);
CREATE POLICY "Allow all for anonymous" ON transactions FOR ALL USING (true);
CREATE POLICY "Allow all for anonymous" ON suppliers FOR ALL USING (true);
CREATE POLICY "Allow all for anonymous" ON ingredients FOR ALL USING (true);
CREATE POLICY "Allow all for anonymous" ON recipes FOR ALL USING (true);
CREATE POLICY "Allow all for anonymous" ON recipe_ingredients FOR ALL USING (true);
CREATE POLICY "Allow all for anonymous" ON daily_closings FOR ALL USING (true);

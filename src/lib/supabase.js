import { createClient } from '@supabase/supabase-js'

/* El demo corre con datos de ejemplo en memoria (src/lib/demoData.js).
   Para conectarlo a la base real:
     1. Copiá .env.example a .env y completá las dos variables
     2. Corré las migraciones de /supabase/migrations en el SQL Editor
     3. Reemplazá los selectores de store.jsx por consultas a las vistas */

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

export const hayBackend = Boolean(url && key)
export const supabase = hayBackend ? createClient(url, key) : null

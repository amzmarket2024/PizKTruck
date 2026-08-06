// PizKTruck — Configuración de Supabase
// 1. Ve a tu proyecto en Supabase > Settings > API
// 2. Copia el "Project URL" y la clave "anon public" (NUNCA la service_role)
// 3. Pégalas abajo

const SUPABASE_URL = "https://jvcbxuiywpeijvvededb.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_BgBbR_a027J4AJPwUIPrHA_YZhf5fUE";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

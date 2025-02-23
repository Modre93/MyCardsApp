import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://doyvtvafxgjvildygoji.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRveXZ0dmFmeGdqdmlsZHlnb2ppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg3NzQ5NzcsImV4cCI6MjA1NDM1MDk3N30.KoBbIBvxeYL6bHMKlajhFCycQnhtFvRDvJiUHbeQugM";

export const adminEmail = "admin@admin.com";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

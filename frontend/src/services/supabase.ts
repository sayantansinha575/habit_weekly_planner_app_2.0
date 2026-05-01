import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";

const supabaseUrl = "https://glplkhjsacgdnsgumswj.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdscGxraGpzYWNnZG5zZ3Vtc3dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1NTM2NDMsImV4cCI6MjA5MzEyOTY0M30.XCKm8MLp77QPctpSjdO3UU5nm6pLNpbDRE7IJebTYJg";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

import { useEffect } from "react";
import { supabase } from "../services/supabaseClient";

export default function ThemeInitializer() {
  useEffect(() => {
    const fetchTheme = async () => {
      const { data, error } = await supabase.from("settings").select("primary_color").single();
      if (data && data.primary_color) {
        document.documentElement.style.setProperty('--primary-color', data.primary_color);
      }
    };
    fetchTheme();
  }, []);

  return null;
}

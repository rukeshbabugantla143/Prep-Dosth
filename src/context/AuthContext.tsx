import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/src/services/supabaseClient";
import { User as SupabaseUser } from "@supabase/supabase-js";

interface User {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async (supabaseUser: SupabaseUser) => {
      console.log("Fetching profile for:", supabaseUser.id);
      
      // SET FALLBACK USER IMMEDIATELY: prevents 'Null User' redirect blocks
      const fallbackUser: User = {
        id: supabaseUser.id,
        name: supabaseUser.user_metadata?.name || supabaseUser.email!.split('@')[0],
        email: supabaseUser.email!,
        role: (supabaseUser.user_metadata?.role as any) || 'user'
      };
      setUser(fallbackUser);

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", supabaseUser.id);
        
        if (error) {
          // If recursion identified, we use the fallback role (from JWT/metadata)
          if (error.code === '42P17') {
            console.error("Auth: Infinite recursion detected in profiles policy. Using session fallback.");
          } else {
            throw error;
          }
        }
        
        if (data && data.length > 0) {
          const profile = data[0];
          setUser({
            id: supabaseUser.id,
            name: profile.name || fallbackUser.name,
            email: supabaseUser.email!,
            role: profile.role || fallbackUser.role,
          });
        }
      } catch (err) {
        console.error("Auth: Profile fetch failed (using fallback):", err);
      } finally {
        setLoading(false);
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchProfile(session.user);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchProfile(session.user);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import type { DoctorProfile } from "@/types/doctor";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";

interface DoctorContextType {
  profile: DoctorProfile | null;
  setProfile: (profile: DoctorProfile) => void;
  updateProfile: (partial: Partial<DoctorProfile>) => void;
  clearProfile: () => void;
  isConfigured: boolean;
}

const STORAGE_KEY = "medshift_doctor_profile";

const DoctorContext = createContext<DoctorContextType | undefined>(undefined);

export const useDoctor = () => {
  const ctx = useContext(DoctorContext);
  if (!ctx) throw new Error("useDoctor must be used within DoctorProvider");
  return ctx;
};

export const DoctorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [profile, setProfileState] = useState<DoctorProfile | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const syncedRef = useRef(false);

  // On login: fetch profile from Supabase (source of truth)
  useEffect(() => {
    if (!user) {
      syncedRef.current = false;
      return;
    }
    if (syncedRef.current) return;
    syncedRef.current = true;

    (async () => {
      try {
        const { data } = await supabase
          .from("profiles")
          .select("doctor_profile")
          .eq("id", user.id)
          .maybeSingle();

        if (data?.doctor_profile) {
          // Supabase has profile data — use it as source of truth
          const remote = data.doctor_profile as DoctorProfile;
          setProfileState(remote);
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(remote));
          } catch { /* ignore quota errors */ }
        } else if (profile) {
          // No remote profile but local exists — push local to Supabase (migration)
          await supabase
            .from("profiles")
            .update({ doctor_profile: profile } as Record<string, unknown>)
            .eq("id", user.id);
        }
      } catch {
        // Network error — keep using localStorage cache
      }
    })();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Persist to localStorage + Supabase on profile change
  useEffect(() => {
    try {
      if (profile) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      console.warn("Failed to persist doctor profile to localStorage");
    }

    // Async persist to Supabase
    if (user && profile) {
      supabase
        .from("profiles")
        .update({ doctor_profile: profile } as Record<string, unknown>)
        .eq("id", user.id)
        .then(({ error }) => {
          if (error) console.warn("Failed to sync profile to Supabase:", error.message);
        });
    }
  }, [profile, user]);

  const setProfile = useCallback((p: DoctorProfile) => setProfileState(p), []);

  const updateProfile = useCallback((partial: Partial<DoctorProfile>) => {
    setProfileState((prev) => (prev ? { ...prev, ...partial } : null));
  }, []);

  const clearProfile = useCallback(() => setProfileState(null), []);

  const isConfigured = !!(profile?.nome && profile?.especialidade && profile?.crm);

  return (
    <DoctorContext.Provider value={{ profile, setProfile, updateProfile, clearProfile, isConfigured }}>
      {children}
    </DoctorContext.Provider>
  );
};

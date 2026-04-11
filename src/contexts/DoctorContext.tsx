import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import type { DoctorProfile } from "@/types/doctor";
import type { Json } from "@/integrations/supabase/types";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface DoctorContextType {
  profile: DoctorProfile | null;
  setProfile: (profile: DoctorProfile) => void;
  updateProfile: (partial: Partial<DoctorProfile>) => void;
  clearProfile: () => void;
  isConfigured: boolean;
  isProfileLoading: boolean;
  reloadProfile: () => Promise<void>;
  persistProfile: (profile: DoctorProfile) => Promise<{ local: boolean; remote: boolean }>;
}

const STORAGE_KEY = "medshift_doctor_profile";
const DoctorContext = createContext<DoctorContextType | undefined>(undefined);

export const useDoctor = () => {
  const ctx = useContext(DoctorContext);
  if (!ctx) throw new Error("useDoctor must be used within DoctorProvider");
  return ctx;
};

/** Read cached profile from localStorage */
function readLocalCache(): DoctorProfile | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

/** Write profile to localStorage cache */
function writeLocalCache(profile: DoctorProfile | null) {
  try {
    if (profile) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch { /* storage full or unavailable */ }
}

/** Convert a Supabase profiles row + profile_data into a DoctorProfile */
function rowToProfile(row: Record<string, unknown>): DoctorProfile | null {
  const data = (row.profile_data ?? {}) as Record<string, unknown>;
  const nome = (data.nome as string) || (row.full_name as string) || "";
  if (!nome) return null;

  return {
    nome,
    especialidade: (data.especialidade as DoctorProfile["especialidade"]) || (row.specialty as DoctorProfile["especialidade"]) || "Outra",
    subespecialidade: (data.subespecialidade as string) || undefined,
    crm: (data.crm as string) || "",
    cidade: (data.cidade as string) || "",
    estado: (data.estado as string) || "",
    plataformas: (data.plataformas as DoctorProfile["plataformas"]) || ["instagram"],
    seguidores_instagram: (data.seguidores_instagram as number) || undefined,
    publico_alvo: (data.publico_alvo as string) || "",
    tom_de_voz: (data.tom_de_voz as string) || "educativo",
    diferenciais: (data.diferenciais as string[]) || [],
    objetivos: (data.objetivos as string[]) || [],
    concorrentes: (data.concorrentes as string[]) || undefined,
    referencia_visual: (data.referencia_visual as string) || undefined,
    bio_instagram: (data.bio_instagram as string) || undefined,
    instagram_handle: (data.instagram_handle as string) || (row.instagram_handle as string) || undefined,
    foto_url: (data.foto_url as string) || (row.photo_url as string) || undefined,
    referencias_conteudo: (data.referencias_conteudo as string[]) || undefined,
    referencias_design: (data.referencias_design as string[]) || undefined,
    skill: (data.skill as DoctorProfile["skill"]) || undefined,
    inspiration_handles: (data.inspiration_handles as string[]) || undefined,
  };
}

/** Convert DoctorProfile into the Supabase upsert payload */
function profileToRow(userId: string, profile: DoctorProfile) {
  return {
    id: userId,
    full_name: profile.nome || null,
    specialty: profile.especialidade || null,
    instagram_handle: profile.instagram_handle || null,
    photo_url: profile.foto_url || null,
    profile_data: JSON.parse(JSON.stringify(profile)),
  };
}

export const DoctorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfileState] = useState<DoctorProfile | null>(readLocalCache);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const hasFetchedRef = useRef<string | null>(null);

  // Fetch profile from Supabase when user becomes available
  const fetchRemoteProfile = useCallback(async (userId: string): Promise<DoctorProfile | null> => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error || !data) return null;
    return rowToProfile(data as Record<string, unknown>);
  }, []);

  const reloadProfile = useCallback(async () => {
    if (!user) return;
    setIsProfileLoading(true);
    try {
      const remote = await fetchRemoteProfile(user.id);
      if (remote) {
        setProfileState(remote);
        writeLocalCache(remote);
      }
    } finally {
      setIsProfileLoading(false);
    }
  }, [user, fetchRemoteProfile]);

  // Rehydrate on auth ready
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      // No user — keep local cache but stop loading
      setIsProfileLoading(false);
      hasFetchedRef.current = null;
      return;
    }

    // Don't re-fetch for same user
    if (hasFetchedRef.current === user.id) {
      setIsProfileLoading(false);
      return;
    }

    let cancelled = false;
    setIsProfileLoading(true);

    fetchRemoteProfile(user.id).then((remote) => {
      if (cancelled) return;
      hasFetchedRef.current = user.id;

      if (remote) {
        setProfileState(remote);
        writeLocalCache(remote);
      }
      // If no remote profile, keep local cache as-is (first-time user or not synced yet)
      setIsProfileLoading(false);
    }).catch(() => {
      if (!cancelled) setIsProfileLoading(false);
    });

    return () => { cancelled = true; };
  }, [user, authLoading, fetchRemoteProfile]);

  const persistProfile = useCallback(async (p: DoctorProfile): Promise<{ local: boolean; remote: boolean }> => {
    // Always save locally first
    setProfileState(p);
    writeLocalCache(p);

    if (!user) return { local: true, remote: false };

    try {
      const payload = profileToRow(user.id, p);
      const { error } = await supabase
        .from("profiles")
        .upsert(payload, { onConflict: "id" });

      if (error) {
        console.error("[DoctorContext] Remote sync failed:", error.message);
        return { local: true, remote: false };
      }
      return { local: true, remote: true };
    } catch (err) {
      console.error("[DoctorContext] Remote sync error:", err);
      return { local: true, remote: false };
    }
  }, [user]);

  const setProfile = useCallback((p: DoctorProfile) => {
    setProfileState(p);
    writeLocalCache(p);
  }, []);

  const updateProfile = useCallback((partial: Partial<DoctorProfile>) => {
    setProfileState((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...partial };
      writeLocalCache(updated);
      return updated;
    });
  }, []);

  const clearProfile = useCallback(async () => {
    setProfileState(null);
    writeLocalCache(null);

    if (user) {
      try {
        await supabase
          .from("profiles")
          .update({ profile_data: {} })
          .eq("id", user.id);
      } catch { /* ignore */ }
    }
  }, [user]);

  const isConfigured = !!(profile?.nome && profile?.especialidade);

  return (
    <DoctorContext.Provider value={{
      profile,
      setProfile,
      updateProfile,
      clearProfile,
      isConfigured,
      isProfileLoading,
      reloadProfile,
      persistProfile,
    }}>
      {children}
    </DoctorContext.Provider>
  );
};

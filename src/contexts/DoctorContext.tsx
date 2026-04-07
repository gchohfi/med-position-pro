import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { DoctorProfile } from "@/types/doctor";

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
  const [profile, setProfileState] = useState<DoctorProfile | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (profile) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [profile]);

  const setProfile = useCallback((p: DoctorProfile) => setProfileState(p), []);

  const updateProfile = useCallback((partial: Partial<DoctorProfile>) => {
    setProfileState((prev) => (prev ? { ...prev, ...partial } : null));
  }, []);

  const clearProfile = useCallback(() => setProfileState(null), []);

  const isConfigured = !!(profile?.nome && profile?.especialidade);

  return (
    <DoctorContext.Provider value={{ profile, setProfile, updateProfile, clearProfile, isConfigured }}>
      {children}
    </DoctorContext.Provider>
  );
};

import React, { createContext, useContext, useState, ReactNode } from "react";
import { Profile } from "../../lib/types/pages/profile.interface";

type ProfileContextType = {
  profile: Profile;
  setProfile: (profile: Profile) => void;
};

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const useProfile = () => {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used within a ProfileProvider");
  return ctx;
};

export const ProfileProvider = ({ children }: { children: ReactNode }) => {
  const [profile, setProfile] = useState<Profile>({});
  return (
    <ProfileContext.Provider value={{ profile, setProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}; 
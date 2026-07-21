"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useMemo,
  type ReactNode,
} from "react";
import { useAuth } from "@/contexts/AuthContext";
import type { Profile } from "@/types/profile";

const STORAGE_KEY_AVATAR = "nyx_profile_avatar";
const STORAGE_KEY_NAME = "nyx_profile_name";

function loadStoredAvatar(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(STORAGE_KEY_AVATAR);
  } catch {
    return null;
  }
}

function loadStoredName(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(STORAGE_KEY_NAME);
  } catch {
    return null;
  }
}

function saveFallbackAvatar(url: string | null) {
  try {
    if (url) localStorage.setItem(STORAGE_KEY_AVATAR, url);
    else localStorage.removeItem(STORAGE_KEY_AVATAR);
  } catch {
    /* noop */
  }
}

function saveFallbackName(name: string | null) {
  try {
    if (name) localStorage.setItem(STORAGE_KEY_NAME, name);
    else localStorage.removeItem(STORAGE_KEY_NAME);
  } catch {
    /* noop */
  }
}

type ProfileContextValue = {
  profile: Profile | null;
  profileLoading: boolean;
  avatarUrl: string | null;
  displayName: string | null;
  setAvatarUrl: (url: string | null) => void;
  setDisplayName: (name: string | null) => void;
  updateProfile: (patch: Partial<Profile>) => void;
};

const ProfileContext = createContext<ProfileContextValue | null>(null);

async function fetchProfileApi(): Promise<Profile | null> {
  const res = await fetch("/api/profile");
  if (!res.ok) return null;
  return (await res.json()) as Profile;
}

async function patchProfileApi(patch: Partial<Profile>): Promise<boolean> {
  const res = await fetch("/api/profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  return res.ok;
}

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [profile, setProfileState] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [fallback, setFallback] = useState<{ avatar: string | null; name: string | null }>(() =>
    typeof window === "undefined"
      ? { avatar: null, name: null }
      : {
          avatar: loadStoredAvatar(),
          name: loadStoredName(),
        }
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      setFallback({ avatar: loadStoredAvatar(), name: loadStoredName() });
    }
  }, []);

  useEffect(() => {
    if (!user?.id) {
      setProfileState(null);
      setProfileLoading(false);
      return;
    }

    let cancelled = false;
    setProfileLoading(true);

    (async () => {
      try {
        const loaded = await fetchProfileApi();
        if (cancelled) return;
        if (loaded) setProfileState(loaded);
      } finally {
        if (!cancelled) setProfileLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  /** Garante Tenant + User no Postgres (Prisma) para transações / API. Idempotente. */
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/auth/bootstrap", { method: "POST" });
        if (!cancelled && res.ok) {
          await res.json().catch(() => null);
          const loaded = await fetchProfileApi();
          if (!cancelled && loaded) setProfileState(loaded);
        }
      } catch {
        /* rede */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  /** Migra flag legada só se for da MESMA conta (chave com userId). */
  useEffect(() => {
    if (!user?.id || !profile || profile.onboardingCompleted) return;
    let legacy = false;
    try {
      const scoped = localStorage.getItem(`nyx_onboarding_completed:${user.id}`);
      legacy = scoped === "true";
      // NÃO migrar a chave global antiga — ela fazia conta nova pular onboarding
      localStorage.removeItem("nyx_onboarding_completed");
    } catch {
      /* noop */
    }
    if (!legacy) return;
    const now = new Date().toISOString();
    setProfileState((prev) =>
      prev
        ? { ...prev, onboardingCompleted: true, onboardingCompletedAt: now, updatedAt: now }
        : prev
    );
    patchProfileApi({
      onboardingCompleted: true,
      onboardingCompletedAt: now,
    }).catch(() => {});
  }, [user?.id, profile]);

  const setAvatarUrl = useCallback(
    (url: string | null) => {
      setProfileState((prev) =>
        prev ? { ...prev, avatarUrl: url, updatedAt: new Date().toISOString() } : prev
      );
      saveFallbackAvatar(url);
      if (user?.id) {
        patchProfileApi({ avatarUrl: url }).catch(() => {});
      }
    },
    [user?.id]
  );

  const setDisplayName = useCallback(
    (name: string | null) => {
      setProfileState((prev) =>
        prev ? { ...prev, displayName: name, updatedAt: new Date().toISOString() } : prev
      );
      saveFallbackName(name);
      if (user?.id) {
        patchProfileApi({ displayName: name }).catch(() => {});
      }
    },
    [user?.id]
  );

  const updateProfile = useCallback(
    (patch: Partial<Profile>) => {
      setProfileState((prev) => {
        if (!prev) {
          if (patch.displayName !== undefined) saveFallbackName(patch.displayName);
          if (patch.avatarUrl !== undefined) saveFallbackAvatar(patch.avatarUrl);
          return prev;
        }
        const next = { ...prev, ...patch, updatedAt: new Date().toISOString() };
        if (patch.displayName !== undefined) saveFallbackName(patch.displayName);
        if (patch.avatarUrl !== undefined) saveFallbackAvatar(patch.avatarUrl);
        return next;
      });

      if (!profile && (patch.displayName !== undefined || patch.avatarUrl !== undefined)) {
        setFallback((f) => ({
          avatar: patch.avatarUrl !== undefined ? patch.avatarUrl : f.avatar,
          name: patch.displayName !== undefined ? patch.displayName : f.name,
        }));
      }

      if (user?.id && Object.keys(patch).length > 0) {
        patchProfileApi(patch).catch(() => {});
      }
    },
    [user?.id, profile]
  );

  const avatarUrl = profile?.avatarUrl ?? fallback.avatar;
  const displayName = profile?.displayName ?? fallback.name;

  const value = useMemo<ProfileContextValue>(
    () => ({
      profile,
      profileLoading,
      avatarUrl,
      displayName,
      setAvatarUrl,
      setDisplayName,
      updateProfile,
    }),
    [
      profile,
      profileLoading,
      avatarUrl,
      displayName,
      setAvatarUrl,
      setDisplayName,
      updateProfile,
    ]
  );

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  return ctx ?? null;
}

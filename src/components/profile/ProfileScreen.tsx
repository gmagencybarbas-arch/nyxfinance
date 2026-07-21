"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { AppNav } from "@/components/layout/AppNav";
import { Container, Button } from "@/components/ui";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/contexts/ProfileContext";
import { useToast } from "@/contexts/ToastContext";
import {
  UserHeaderCard,
  NyxPrimeCard,
  ProfileIdentitySection,
  FinancialOrgSection,
  RecurringBillsDrawer,
  SecuritySection,
  NotificationsSection,
  ThemePreferenceSection,
  ReferralSection,
} from "./index";
import {
  MOCK_PROFILE_IDENTITY,
  MOCK_NOTIFICATION_SETTINGS,
  MOCK_REFERRAL_CODE,
} from "./mocks/profile";
import { generateId } from "./utils/profile";
import { useRecurringBills } from "@/hooks/useRecurringBills";
import { resetOnboarding } from "@/lib/onboarding/completeOnboarding";
import {
  clearLegacyRecurringStorage,
  dtoToProfileItem,
  loadLegacyRecurringFromStorage,
  profileItemToCreateInput,
} from "@/lib/recurring/profileMappers";
import { DEFAULT_EXPENSE_CATEGORIES, STORAGE_CATEGORIES_KEY } from "./constants/categories";
import type {
  ProfileIdentity,
  NyxPlan,
  RecurringExpense,
  NotificationSettings,
  ExpenseCategory,
} from "./types";

const STORAGE_IDENTITY = "nyx_profile_identity";
const STORAGE_NOTIFICATIONS = "nyx_notification_settings";
const DEFAULT_CAT_ID = DEFAULT_EXPENSE_CATEGORIES[0]?.id ?? "outros";

function loadJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const s = localStorage.getItem(key);
    return s ? { ...fallback, ...JSON.parse(s) } : fallback;
  } catch {
    return fallback;
  }
}

function saveJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* noop */
  }
}

export function ProfileScreen() {
  const { user, signOut } = useAuth();
  const profile = useProfile();
  const toast = useToast();
  const router = useRouter();
  const [identity, setIdentity] = useState<ProfileIdentity>(MOCK_PROFILE_IDENTITY);
  const [categories, setCategories] = useState<ExpenseCategory[]>(DEFAULT_EXPENSE_CATEGORIES);
  const recurringApi = useRecurringBills(!!user?.id);
  const [notifications, setNotifications] = useState<NotificationSettings>(
    MOCK_NOTIFICATION_SETTINGS
  );
  const [plan] = useState<NyxPlan>("free");
  const [identitySaving, setIdentitySaving] = useState(false);
  const [recurringDrawerOpen, setRecurringDrawerOpen] = useState(false);
  const legacyMigratedRef = useRef(false);

  useEffect(() => {
    const loadedIdentity = loadJson(STORAGE_IDENTITY, MOCK_PROFILE_IDENTITY);
    setIdentity(loadedIdentity);
    if (loadedIdentity.fullName?.trim()) {
      profile?.setDisplayName(loadedIdentity.fullName.trim());
    }
    const catStored = localStorage.getItem(STORAGE_CATEGORIES_KEY);
    if (catStored) {
      try {
        const parsed = JSON.parse(catStored) as ExpenseCategory[];
        const custom = Array.isArray(parsed) ? parsed : [];
        const defaultIds = new Set(DEFAULT_EXPENSE_CATEGORIES.map((c) => c.id));
        const customOnly = custom.filter((c) => !defaultIds.has(c.id));
        setCategories([...DEFAULT_EXPENSE_CATEGORIES, ...customOnly]);
      } catch {
        /* keep default */
      }
    }
    const notif = localStorage.getItem(STORAGE_NOTIFICATIONS);
    if (notif) {
      try {
        const parsed = JSON.parse(notif) as NotificationSettings;
        setNotifications({ ...MOCK_NOTIFICATION_SETTINGS, ...parsed });
      } catch {
        /* keep default */
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const recurringForUi = useMemo(
    () => recurringApi.items.map((d) => dtoToProfileItem(d, categories)),
    [recurringApi.items, categories]
  );

  useEffect(() => {
    if (legacyMigratedRef.current || !user?.id || recurringApi.loading) return;
    if (recurringApi.items.length > 0) {
      legacyMigratedRef.current = true;
      return;
    }
    const legacy = loadLegacyRecurringFromStorage();
    if (legacy.length === 0) return;

    let cancelled = false;
    (async () => {
      try {
        for (const item of legacy) {
          if (cancelled) return;
          await recurringApi.create(profileItemToCreateInput(item, categories));
        }
        clearLegacyRecurringStorage();
        legacyMigratedRef.current = true;
        await recurringApi.refetch();
      } catch {
        /* mantém legacy para nova tentativa */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id, recurringApi.loading, recurringApi.items.length, categories, recurringApi.create, recurringApi.refetch]);

  const handleIdentityChange = useCallback((v: ProfileIdentity) => {
    setIdentity(v);
  }, []);

  const handleIdentitySave = useCallback(async () => {
    setIdentitySaving(true);
    saveJson(STORAGE_IDENTITY, identity);
    profile?.updateProfile({
      displayName: identity.fullName.trim() || null,
      profession: identity.profession || null,
      jobTitle: identity.jobTitle || null,
      salaryRange: identity.salaryRange,
      payday: identity.payday,
      financialGoal: identity.financialGoal || null,
    });
    toast.show("Dados salvos", "success");
    setIdentitySaving(false);
  }, [identity, profile, toast]);

  const handleRecurringAdd = useCallback(
    async (item: Omit<RecurringExpense, "id">) => {
      try {
        await recurringApi.create(profileItemToCreateInput(item, categories));
        toast.show("Conta recorrente adicionada", "success");
      } catch (e) {
        toast.show(
          e instanceof Error ? e.message : "Não foi possível salvar a conta",
          "error"
        );
      }
    },
    [recurringApi, categories, toast]
  );

  const handleRecurringRemove = useCallback(
    async (id: string) => {
      try {
        await recurringApi.remove(id);
        toast.show("Conta removida", "success");
      } catch (e) {
        toast.show(
          e instanceof Error ? e.message : "Não foi possível remover",
          "error"
        );
      }
    },
    [recurringApi, toast]
  );

  const handleRecurringUpdate = useCallback(
    async (id: string, item: Omit<RecurringExpense, "id">) => {
      try {
        const input = profileItemToCreateInput(item, categories);
        await recurringApi.update(id, input);
        toast.show("Conta atualizada", "success");
      } catch (e) {
        toast.show(
          e instanceof Error ? e.message : "Não foi possível atualizar",
          "error"
        );
      }
    },
    [recurringApi, categories, toast]
  );

  const handleRecurringToggle = useCallback(
    async (id: string, active: boolean) => {
      try {
        await recurringApi.update(id, { active });
        toast.show(active ? "Conta reativada" : "Conta pausada", "success");
      } catch (e) {
        toast.show(
          e instanceof Error ? e.message : "Não foi possível atualizar o status",
          "error"
        );
      }
    },
    [recurringApi, toast]
  );

  const handleAddCategory = useCallback((category: Omit<ExpenseCategory, "id">) => {
    const newCat: ExpenseCategory = { ...category, id: generateId() };
    const defaultIds = new Set(DEFAULT_EXPENSE_CATEGORIES.map((c) => c.id));
    setCategories((prev) => {
      const next = [...prev, newCat];
      const customOnly = next.filter((c) => !defaultIds.has(c.id));
      saveJson(STORAGE_CATEGORIES_KEY, customOnly);
      return next;
    });
    return newCat;
  }, []);

  const handleNotificationsChange = useCallback((v: NotificationSettings) => {
    setNotifications(v);
    saveJson(STORAGE_NOTIFICATIONS, v);
  }, []);

  const handleSignOut = useCallback(async () => {
    await signOut();
    router.push("/login");
    router.refresh();
  }, [signOut, router]);

  const handleRedoOnboarding = useCallback(async () => {
    if (!user?.id) return;
    try {
      await resetOnboarding(user.id);
      profile?.updateProfile({
        onboardingCompleted: false,
        onboardingCompletedAt: null,
      });
      router.push("/onboarding");
      router.refresh();
    } catch (e) {
      toast.show(e instanceof Error ? e.message : "Não foi possível reiniciar", "error");
    }
  }, [user?.id, profile, router, toast]);

  const mockReferral = useMemo(
    () => ({
      invitedCount: 3,
      activatedCount: 1,
      myTransactionsCount: 15,
    }),
    []
  );

  return (
    <div className="min-h-screen">
      <AppNav userEmail={user?.email ?? undefined} />
      <main className="py-6 pb-32 md:pb-12">
        <Container size="sm" className="space-y-6 profile-sections">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <UserHeaderCard isPrime={plan === "prime"} />
          </motion.div>

          <NyxPrimeCard plan={plan} />

          <ThemePreferenceSection />

          <ProfileIdentitySection
            value={identity}
            onChange={handleIdentityChange}
            onSave={handleIdentitySave}
            saving={identitySaving}
          />

          <FinancialOrgSection
            items={recurringForUi}
            onManage={() => setRecurringDrawerOpen(true)}
          />

          <RecurringBillsDrawer
            open={recurringDrawerOpen}
            onClose={() => setRecurringDrawerOpen(false)}
            items={recurringForUi}
            categories={categories}
            loading={recurringApi.loading}
            error={recurringApi.error}
            onAdd={(item) => void handleRecurringAdd(item)}
            onUpdate={(id, item) => void handleRecurringUpdate(id, item)}
            onRemove={(id) => void handleRecurringRemove(id)}
            onToggleActive={(id, active) => void handleRecurringToggle(id, active)}
            onAddCategory={handleAddCategory}
          />

          <SecuritySection />

          <NotificationsSection value={notifications} onChange={handleNotificationsChange} />

          <ReferralSection
            code={MOCK_REFERRAL_CODE}
            invitedCount={mockReferral.invitedCount}
            activatedCount={mockReferral.activatedCount}
            myTransactionsCount={mockReferral.myTransactionsCount}
          />

          <motion.div
            className="pt-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
          >
            <Button
              variant="ghost"
              size="md"
              fullWidth
              onClick={() => void handleRedoOnboarding()}
              className="text-[var(--muted-foreground)]"
            >
              Refazer onboarding
            </Button>
          </motion.div>

          <motion.div
            className="pt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Button
              variant="danger"
              size="md"
              fullWidth
              onClick={handleSignOut}
            >
              Sair da conta
            </Button>
          </motion.div>
        </Container>
      </main>
    </div>
  );
}

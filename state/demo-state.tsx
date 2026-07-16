"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { z } from "zod";

const DemoStageSchema = z.enum([
  "initial",
  "plans_generated",
  "approved",
  "disrupted",
  "recovered",
]);

const DemoStateSchema = z.object({
  version: z.literal(1),
  stage: DemoStageSchema,
  selectedPlanId: z.string(),
  approvalReason: z.string(),
  fallbackUsed: z.boolean(),
  resetCount: z.number().int().nonnegative(),
});

export type DemoStage = z.infer<typeof DemoStageSchema>;
export type DemoState = z.infer<typeof DemoStateSchema>;

const STORAGE_KEY = "choicegrid-demo-v1";

export const initialDemoState: DemoState = {
  version: 1,
  stage: "initial",
  selectedPlanId: "OPT-003",
  approvalReason: "",
  fallbackUsed: true,
  resetCount: 0,
};

type DemoContextValue = {
  state: DemoState;
  hydrated: boolean;
  selectPlan: (planId: string) => void;
  generatePlans: () => void;
  approvePlan: (reason: string) => void;
  triggerDisruption: () => void;
  approveRecovery: () => void;
  resetScenario: () => void;
};

const DemoContext = createContext<DemoContextValue | null>(null);

export function DemoStateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DemoState>(initialDemoState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      const persisted = window.localStorage.getItem(STORAGE_KEY);
      if (persisted) {
        try {
          const parsed = DemoStateSchema.safeParse(JSON.parse(persisted));
          if (parsed.success) setState(parsed.data);
        } catch {
          window.localStorage.removeItem(STORAGE_KEY);
        }
      }
      setHydrated(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [hydrated, state]);

  const selectPlan = useCallback((planId: string) => {
    setState((current) => ({ ...current, selectedPlanId: planId }));
  }, []);

  const generatePlans = useCallback(() => {
    setState((current) => ({
      ...current,
      stage: "plans_generated",
      selectedPlanId: "OPT-003",
      fallbackUsed: true,
    }));
  }, []);

  const approvePlan = useCallback((reason: string) => {
    setState((current) => {
      if (current.stage === "approved") return current;
      return {
        ...current,
        stage: "approved",
        approvalReason: reason,
      };
    });
  }, []);

  const triggerDisruption = useCallback(() => {
    setState((current) => ({ ...current, stage: "disrupted" }));
  }, []);

  const approveRecovery = useCallback(() => {
    setState((current) => ({ ...current, stage: "recovered" }));
  }, []);

  const resetScenario = useCallback(() => {
    setState((current) => ({
      ...initialDemoState,
      resetCount: current.resetCount + 1,
    }));
  }, []);

  const value = useMemo<DemoContextValue>(
    () => ({
      state,
      hydrated,
      selectPlan,
      generatePlans,
      approvePlan,
      triggerDisruption,
      approveRecovery,
      resetScenario,
    }),
    [
      approvePlan,
      approveRecovery,
      generatePlans,
      hydrated,
      resetScenario,
      selectPlan,
      state,
      triggerDisruption,
    ],
  );

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemoState(): DemoContextValue {
  const value = useContext(DemoContext);
  if (!value) {
    throw new Error("useDemoState must be used inside DemoStateProvider");
  }
  return value;
}

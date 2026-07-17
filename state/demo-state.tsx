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
import {
  DemoStateSchema,
  approvePlan as approvePlanState,
  approveRecovery as approveRecoveryState,
  completeMissionStop as completeMissionStopState,
  createInitialDemoState,
  editPlan as editPlanState,
  initialDemoState,
  setPackingBatchComplete as setPackingBatchCompleteState,
  startPacking as startPackingState,
  triggerPartnerCancellation,
  type DemoState,
} from "@/domain/demo/demo-state";
import { scenarioContext } from "@/domain/planning/scenario-context";
import type { PlanOption } from "@/domain/types";

export { initialDemoState } from "@/domain/demo/demo-state";
export type { DemoStage, DemoState } from "@/domain/demo/demo-state";

const STORAGE_KEY = "choicegrid-demo-v3";
const PREVIOUS_STORAGE_KEY = "choicegrid-demo-v2";
const LEGACY_STORAGE_KEY = "choicegrid-demo-v1";

type DemoContextValue = {
  state: DemoState;
  hydrated: boolean;
  selectPlan: (planId: string) => void;
  generatePlans: () => void;
  editPlan: (plan: PlanOption, reason: string) => void;
  approvePlan: (plan: PlanOption, reason: string) => void;
  startPacking: (packingPlanId: string) => void;
  setPackingBatchComplete: (packingPlanId: string, batchId: string, complete: boolean) => void;
  completeMissionStop: (missionId: string, stopId: string) => void;
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
          else window.localStorage.removeItem(STORAGE_KEY);
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
    setState((current) => current.approvedPlan
      ? current
      : { ...current, selectedPlanId: planId });
  }, []);

  const generatePlans = useCallback(() => {
    setState((current) =>
      current.stage === "initial"
        ? {
            ...current,
            stage: "plans_generated",
            selectedPlanId: scenarioContext.ids.primaryOptionId,
            fallbackUsed: true,
          }
        : current,
    );
  }, []);

  const editPlan = useCallback((plan: PlanOption, reason: string) => {
    setState((current) => editPlanState(current, plan, reason));
  }, []);

  const approvePlan = useCallback((plan: PlanOption, reason: string) => {
    setState((current) => approvePlanState(current, plan, reason));
  }, []);

  const startPacking = useCallback((packingPlanId: string) => {
    setState((current) => startPackingState(current, packingPlanId));
  }, []);

  const setPackingBatchComplete = useCallback((packingPlanId: string, batchId: string, complete: boolean) => {
    setState((current) => setPackingBatchCompleteState(current, packingPlanId, batchId, complete));
  }, []);

  const completeMissionStop = useCallback((missionId: string, stopId: string) => {
    setState((current) => completeMissionStopState(current, missionId, stopId));
  }, []);

  const triggerDisruption = useCallback(() => {
    setState((current) => triggerPartnerCancellation(current));
  }, []);

  const approveRecovery = useCallback(() => {
    setState((current) => approveRecoveryState(current));
  }, []);

  const resetScenario = useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem(PREVIOUS_STORAGE_KEY);
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);
    setState((current) => createInitialDemoState(current.resetCount + 1));
  }, []);

  const value = useMemo<DemoContextValue>(
    () => ({
      state,
      hydrated,
      selectPlan,
      generatePlans,
      editPlan,
      approvePlan,
      startPacking,
      setPackingBatchComplete,
      completeMissionStop,
      triggerDisruption,
      approveRecovery,
      resetScenario,
    }),
    [
      approvePlan,
      approveRecovery,
      completeMissionStop,
      editPlan,
      generatePlans,
      hydrated,
      resetScenario,
      selectPlan,
      setPackingBatchComplete,
      startPacking,
      state,
      triggerDisruption,
    ],
  );

  return (
    <DemoContext.Provider value={value}>
      {hydrated ? children : <div className="route-state"><strong>Loading saved demo state…</strong></div>}
    </DemoContext.Provider>
  );
}

export function useDemoState(): DemoContextValue {
  const value = useContext(DemoContext);
  if (!value) {
    throw new Error("useDemoState must be used inside DemoStateProvider");
  }
  return value;
}

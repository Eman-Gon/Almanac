"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useDemoState } from "@/state/demo-state";

export default function MissionsPage() {
  const router = useRouter();
  const { state } = useDemoState();

  useEffect(() => {
    router.replace(state.stage === "recovered" ? "/missions/MSN-105" : "/missions/MSN-104");
  }, [router, state.stage]);

  return <div className="route-state"><strong>Opening active mission…</strong></div>;
}

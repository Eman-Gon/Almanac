import { readFile } from "node:fs/promises";

const checks = [
  {
    file: "data/seed/scenario.ts",
    patterns: [
      ["scenario", 'id: "SCN-STRAWBERRY-001"'],
      ["inventory lot", 'id: "LOT-104"'],
      ["available quantity", "availableQuantityLb: 1_200"],
    ],
  },
  {
    file: "state/demo-state.tsx",
    patterns: [["versioned browser state", 'const STORAGE_KEY = "choicegrid-demo-v3"']],
  },
];

const results = [];
for (const check of checks) {
  const contents = await readFile(new URL(`../${check.file}`, import.meta.url), "utf8");
  for (const [name, expected] of check.patterns) {
    results.push({ name, file: check.file, ready: contents.includes(expected) });
  }
}

const ready = results.every((check) => check.ready);
const result = {
  scenarioId: "SCN-STRAWBERRY-001",
  inventoryLotId: "LOT-104",
  status: ready ? "ready" : "not_ready",
  checks: results,
  note: "This verifies immutable fixture readiness. Use Reset scenario in the app to clear browser demo state.",
};

process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
if (!ready) process.exitCode = 1;

const result = {
  scenarioId: "SCN-STRAWBERRY-001",
  donationId: "DON-104",
  status: "ready",
  note: "ChoiceGrid uses immutable seed fixtures. Use Reset scenario in the app to clear browser demo state.",
};

process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);

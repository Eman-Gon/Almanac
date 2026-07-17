const result = {
  scenarioId: "SCN-STRAWBERRY-001",
  inventoryLotId: "LOT-104",
  warehouseId: "WH-001",
  status: "ready",
  note: "ChoiceGrid uses immutable seed fixtures. Use Reset scenario in the app to clear browser demo state.",
};

process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);

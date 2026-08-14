const Holding = require("../models/Holding");
const Snapshot = require("../models/Snapshot");

function todayKey() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

async function recordSnapshot() {
  const holdings = await Holding.find();
  const totalValue = holdings.reduce((sum, h) => sum + h.quantity * h.currentPrice, 0);
  const totalCost = holdings.reduce((sum, h) => sum + h.quantity * h.avgBuyPrice, 0);

  await Snapshot.findOneAndUpdate(
    { date: todayKey() },
    { date: todayKey(), totalValue, totalCost },
    { upsert: true }
  );
}

async function listHoldings(req, res) {
  const holdings = await Holding.find().sort({ createdAt: -1 });
  res.json(holdings);
}

async function createHolding(req, res) {
  const holding = await Holding.create(req.body);
  await recordSnapshot();
  res.status(201).json(holding);
}

async function bulkCreateHoldings(req, res) {
  const items = Array.isArray(req.body.items) ? req.body.items : [];
  if (items.length === 0) {
    return res.status(400).json({ message: "저장할 항목이 없습니다." });
  }
  const created = await Holding.insertMany(items);
  await recordSnapshot();
  res.status(201).json(created);
}

async function updateHolding(req, res) {
  const holding = await Holding.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!holding) {
    return res.status(404).json({ message: "종목을 찾을 수 없습니다." });
  }
  await recordSnapshot();
  res.json(holding);
}

async function deleteHolding(req, res) {
  const holding = await Holding.findByIdAndDelete(req.params.id);
  if (!holding) {
    return res.status(404).json({ message: "종목을 찾을 수 없습니다." });
  }
  await recordSnapshot();
  res.json({ ok: true });
}

async function listSnapshots(req, res) {
  const snapshots = await Snapshot.find().sort({ date: 1 });
  res.json(snapshots);
}

module.exports = {
  listHoldings,
  createHolding,
  bulkCreateHoldings,
  updateHolding,
  deleteHolding,
  listSnapshots,
};

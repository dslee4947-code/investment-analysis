const Holding = require("../models/Holding");
const Snapshot = require("../models/Snapshot");
const { getUsdKrwRate } = require("../utils/fx");
const { syncLivePrices } = require("../utils/livePrice");

function todayKey() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

async function recordSnapshot() {
  const holdings = await Holding.find();
  const fxRate = await getUsdKrwRate();
  const toKRW = (h, price) => (h.currency === "USD" ? h.quantity * price * fxRate : h.quantity * price);

  const totalValue = holdings.reduce((sum, h) => sum + toKRW(h, h.currentPrice), 0);
  const totalCost = holdings.reduce((sum, h) => sum + toKRW(h, h.avgBuyPrice), 0);

  await Snapshot.findOneAndUpdate(
    { date: todayKey() },
    { date: todayKey(), totalValue, totalCost },
    { upsert: true }
  );
}

async function listHoldings(req, res) {
  const holdings = await Holding.find().sort({ createdAt: -1 });

  const { updatedCount } = await syncLivePrices(holdings);
  if (updatedCount > 0) {
    await recordSnapshot();
  }

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

  const results = [];
  for (const item of items) {
    const query = { account: item.account };
    if (item.ticker) {
      query.ticker = item.ticker;
    } else {
      query.name = item.name;
    }

    const existing = await Holding.findOne(query);
    if (existing) {
      existing.set(item);
      await existing.save();
      results.push(existing);
    } else {
      results.push(await Holding.create(item));
    }
  }

  await recordSnapshot();
  res.status(201).json(results);
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

const Deposit = require("../models/Deposit");

async function listDeposits(req, res) {
  const deposits = await Deposit.find().sort({ date: 1, createdAt: 1 });
  res.json(deposits);
}

async function createDeposit(req, res) {
  const deposit = await Deposit.create(req.body);
  res.status(201).json(deposit);
}

async function deleteDeposit(req, res) {
  const deposit = await Deposit.findByIdAndDelete(req.params.id);
  if (!deposit) {
    return res.status(404).json({ message: "입금 내역을 찾을 수 없습니다." });
  }
  res.json({ ok: true });
}

module.exports = { listDeposits, createDeposit, deleteDeposit };

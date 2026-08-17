const { getUsdKrwRate } = require("../utils/fx");

async function getUsdKrw(req, res) {
  const rate = await getUsdKrwRate();
  res.json({ rate });
}

module.exports = { getUsdKrw };

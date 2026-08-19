// 매일 아침 실행되는 뉴스 리포트 생성 스크립트 (Heroku Scheduler 또는 로컬 cron에서 호출)
require("dotenv").config();
const connectDB = require("./config/db");
const Holding = require("./models/Holding");
const NewsReport = require("./models/NewsReport");
const { generateNewsItems, holdingKey } = require("./utils/newsGenerator");
const { todayKeyKST } = require("./utils/kstDate");

async function run() {
  await connectDB();

  const holdings = await Holding.find();
  const date = todayKeyKST();

  // 계좌 중복 제거 (같은 종목이 여러 계좌에 있으면 한 번만 검색)
  const uniqueByKey = new Map();
  holdings.forEach((h) => {
    const key = holdingKey(h);
    if (key && !uniqueByKey.has(key)) uniqueByKey.set(key, h);
  });

  console.log(`오늘(${date}) 리포트 대상 종목: ${uniqueByKey.size}개`);

  let done = 0;
  let skipped = 0;
  let failed = 0;

  for (const [key, holding] of uniqueByKey) {
    const already = await NewsReport.findOne({ key, date });
    if (already) {
      skipped++;
      continue;
    }
    try {
      const items = await generateNewsItems(holding);
      await NewsReport.findOneAndUpdate(
        { key, date },
        { key, date, items, generatedAt: Date.now() },
        { upsert: true }
      );
      done++;
      console.log(`  ✓ ${holding.name} (${key}) - ${items.length}건`);
    } catch (err) {
      failed++;
      console.error(`  ✗ ${holding.name} (${key}) 실패: ${err.message}`);
    }
  }

  console.log(`완료: ${done}개 생성, ${skipped}개 이미 있음, ${failed}개 실패`);
  process.exit(0);
}

run().catch((err) => {
  console.error("일일 뉴스 리포트 생성 실패:", err.message);
  process.exit(1);
});

// 한국 시간(Asia/Seoul) 기준 YYYY-MM-DD. UTC 기준으로 계산하면 아침 7~9시 배치가
// 생성한 "오늘" 리포트가 낮 동안 어제 날짜로 취급되어 stale로 보이는 문제가 있어 KST로 고정한다.
function todayKeyKST() {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
}

module.exports = { todayKeyKST };

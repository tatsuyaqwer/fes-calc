console.log("counter.js 読込OK");

/* ----------------------------------
   CountAPI 方式（今日 / 累計）
------------------------------------- */

const NAMESPACE = "fes-calc";   // プロジェクト名として使う
const TOTAL_KEY = `${NAMESPACE}-total`;

// 今日の日付キー
function getTodayKey() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${NAMESPACE}-${y}${m}${day}`;
}

// CountAPI の GET
async function countAPI(namespace, key, amount = 1) {
    const url = `https://api.countapi.xyz/hit/${namespace}/${key}?amount=${amount}`;
    const res = await fetch(url);
    return res.json();
}

async function loadCounts() {

    const todayKey = getTodayKey();

    // 今日 +1
    const todayRes = await countAPI(NAMESPACE, todayKey, 1);

    // 累計 +1
    const totalRes = await countAPI(NAMESPACE, TOTAL_KEY, 1);

    // 表示部分を更新
    document.getElementById("today-count").textContent = todayRes.value;
    document.getElementById("total-count").textContent = totalRes.value;
}

// 読み込み時に実行
window.addEventListener("DOMContentLoaded", loadCounts);

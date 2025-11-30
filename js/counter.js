console.log("counter.js 読込OK");

// ★ あなたの Worker API エンドポイント
const API_URL = "https://fes-counter.s-n-summer-0718.workers.dev/";

// Worker へ GET → {today, total} を返す
async function loadCounts() {
    try {
        const res = await fetch(API_URL, { method: "GET" });
        const data = await res.json();

        document.getElementById("today-count").textContent = data.today;
        document.getElementById("total-count").textContent = data.total;

    } catch (err) {
        console.error("アクセスカウンター取得エラー:", err);
        document.getElementById("today-count").textContent = "ERR";
        document.getElementById("total-count").textContent = "ERR";
    }
}

// ページ読み込み時に実行
loadCounts();

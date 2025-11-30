console.log("script.js 読込OK");

/***********************************************
 * 基礎データ
 ***********************************************/
const BASE_POINT = {
    "EASY": 120,
    "NORMAL": 150,
    "HARD": 190,
    "EXPERT": 230
};

const RANK_BONUS = {
    "SS": 0.25,
    "S":  0.20,
    "A":  0.15,
    "B":  0.10,
    "C":  0.05,
    "D":  0.00
};

const CONSUME = [1, 3, 5];
const DIFFICULTIES = ["EASY", "NORMAL", "HARD", "EXPERT"];
const SCORE_RANKS = ["SS", "S", "A", "B", "C", "D"];
const COMBO_RANKS = ["SS", "S", "A", "B", "C", "D"];

/***********************************************
 * 1曲の計算（基礎 + 各補正 + カード特攻）
 ***********************************************/
function calcPatternDetail(base, cons, scoreBonus, comboBonus, plBonus, trophyBonus, cardBonus = 0) {
    const baseCons = base * cons;

    const baseTotal =
        Math.ceil(baseCons) +
        Math.ceil(baseCons * scoreBonus) +
        Math.ceil(baseCons * comboBonus) +
        Math.ceil(baseCons * plBonus) +
        Math.ceil(baseCons * trophyBonus);

    const bonus = Math.ceil(baseCons * cardBonus);

    return {
        baseTotal,
        bonus,
        total: baseTotal + bonus
    };
}

/***********************************************
 * 全 432 パターン生成
 ***********************************************/
function generatePatternsWithCard(plBonus, trophyBonus, cardBonus = 0) {
    const list = [];

    for (const diff of DIFFICULTIES) {
        const base = BASE_POINT[diff];

        for (const cons of CONSUME) {
            for (const sRank of SCORE_RANKS) {
                for (const cRank of COMBO_RANKS) {

                    const detail = calcPatternDetail(
                        base, cons,
                        RANK_BONUS[sRank],
                        RANK_BONUS[cRank],
                        plBonus,
                        trophyBonus,
                        cardBonus
                    );

                    list.push({
                        diff,
                        cons,
                        sRank,
                        cRank,
                        baseTotal: detail.baseTotal,
                        bonus: detail.bonus,
                        total: detail.total
                    });
                }
            }
        }
    }
    return list;
}

function generateSinglePatterns(plBonus, trophyBonus, cardBonus = 0) {
    return generatePatternsWithCard(plBonus, trophyBonus, cardBonus);
}

/***********************************************
 * total ごとにまとめる
 ***********************************************/
function groupPatternsByTotal(patterns) {
    const map = new Map();
    patterns.forEach(p => {
        if (!map.has(p.total)) map.set(p.total, []);
        map.get(p.total).push(p);
    });
    return map;
}

/***********************************************
 * 表示整形（1曲）★ pt を削除し1行にまとめる版
 ***********************************************/
function formatGroupedPattern(total, list) {
    const labels = list
        .map(p => `${p.cons}倍消化-${p.diff}-スコア${p.sRank}-コンボ${p.cRank}`)
        .join(" / ");

    return `<b>${total}</b> (${labels})`;
}

/***********************************************
 * 表示整形（2曲）★ 改行バグなし版
 ***********************************************/
function formatTwoSongResult(item, map) {
    const p1 = item.details[0];
    const p2 = item.details[1];

    const line1 = map.get(p1.total)
        .map(p => `${p.cons}倍消化-${p.diff}-スコア${p.sRank}-コンボ${p.cRank}`)
        .join(" / ");

    const line2 = map.get(p2.total)
        .map(p => `${p.cons}倍消化-${p.diff}-スコア${p.sRank}-コンボ${p.cRank}`)
        .join(" / ");

    return `
<b>${p1.total}</b> (${line1})<br>
<b>${p2.total}</b> (${line2})
`;
}

/***********************************************
 * 表示整形（3曲）★ 改行バグなし版
 ***********************************************/
function formatThreeSongResult(item, map) {
    return item.details
        .map(p => {
            const labels = map.get(p.total)
                .map(pp => `${pp.cons}倍消化-${pp.diff}-スコア${pp.sRank}-コンボ${pp.cRank}`)
                .join(" / ");
            return `<b>${p.total}</b> (${labels})`;
        })
        .join("<br>");
}

/***********************************************
 * 通常モード
 ***********************************************/
function searchNormalMode(remain, plBonus, trophyBonus) {

    const baseList = generateSinglePatterns(plBonus, trophyBonus, 0);
    const groupedMap = groupPatternsByTotal(baseList);

    const results = [];

    // 1曲
    for (const p of baseList) {
        if (p.total === remain) {
            results.push({
                sumSong: 1,
                details: [p],
                map: groupedMap
            });
            if (results.length >= 20) return results;
        }
    }

    // 2曲
    for (let i = 0; i < baseList.length; i++) {
        for (let j = i; j < baseList.length; j++) {
            if (baseList[i].total + baseList[j].total === remain) {
                results.push({
                    sumSong: 2,
                    details: [baseList[i], baseList[j]],
                    map: groupedMap
                });
                if (results.length >= 20) return results;
            }
        }
    }

    // 3曲
    for (let i = 0; i < baseList.length; i++) {
        for (let j = i; j < baseList.length; j++) {
            for (let k = j; k < baseList.length; k++) {
                if (baseList[i].total + baseList[j].total + baseList[k].total === remain) {
                    results.push({
                        sumSong: 3,
                        details: [baseList[i], baseList[j], baseList[k]],
                        map: groupedMap
                    });
                    if (results.length >= 20) return results;
                }
            }
        }
    }

    return results;
}

/***********************************************
 * カード特攻モード
 ***********************************************/
function searchCardMode(remain, plBonus, trophyBonus, inputCard, use5step) {

    const step = use5step ? 5 : 10;
    const results = [];

    for (let card = 0; card <= inputCard; card += step) {

        const cardBonus = card / 100;
        const patterns = generatePatternsWithCard(plBonus, trophyBonus, cardBonus);

        const hits = patterns.filter(p => p.total === remain);

        if (hits.length > 0) {

            const baseTotal = hits[0].baseTotal;
            const bonus = hits[0].bonus;

            results.push({
                cardValue: card,
                baseTotal,
                bonus,
                total: remain,
                list: hits
            });

            if (results.length >= 20) return results;
        }
    }

    return results;
}

/***********************************************
 * タブ切り替え（正常動作版）
 ***********************************************/
document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {

        document.querySelectorAll(".tab-btn")
            .forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        document.querySelectorAll(".tab-content")
            .forEach(c => c.classList.remove("active"));

        const tabId = btn.dataset.tab + "-result";
        document.getElementById(tabId).classList.add("active");
    });
});

/***********************************************
 * メイン：計算処理
 ***********************************************/
document.getElementById("calc-btn").addEventListener("click", () => {

    const plBonus = Number(document.getElementById("penlight").value);
    const trophyBonus = Number(document.getElementById("trophy").value);

    const useCard = document.getElementById("use-card").checked;
    const cardInput = Number(document.getElementById("card-bonus").value);
    const use5step = document.getElementById("use-5step").checked;

    const remain = Number(document.getElementById("remaining").value);

    if (isNaN(remain) || remain <= 0) {
        alert("残りポイントを正しく入力してください");
        return;
    }

    document.getElementById("normal-summary").innerHTML = "";
    document.getElementById("normal-list").innerHTML = "";
    document.getElementById("card-summary").innerHTML = "";
    document.getElementById("card-list").innerHTML = "";

    /***********************************************
     * 通常モード
     ***********************************************/
    const normal = searchNormalMode(remain, plBonus, trophyBonus);

    if (normal.length === 0) {
        document.getElementById("normal-summary").innerHTML =
            `結果 0件<br>上記の条件では見つけることが出来ませんでした。<br>
             ペンライト：${plBonus * 100}%<br>
             トロフィー：${trophyBonus * 100}%`;
    } else {

        document.getElementById("normal-summary").innerHTML =
            `結果 ${normal.length}件見つかりました<br>
             ペンライト：${plBonus * 100}%<br>
             トロフィー：${trophyBonus * 100}%`;

        const html = normal.map((item, idx) => {

            const grouped = item.map;
            let block = `結果${idx+1} 合計${item.sumSong}曲 <b>${remain}pt</b><br>`;

            if (item.sumSong === 1) {
                const p = item.details[0];
                block += formatGroupedPattern(p.total, grouped.get(p.total));
            }
            else if (item.sumSong === 2) {
                block += formatTwoSongResult(item, grouped);
            }
            else {
                block += formatThreeSongResult(item, grouped);
            }

            return `<div class="result-block">${block}</div>`;
        });

        document.getElementById("normal-list").innerHTML = html.join("");
    }

    /***********************************************
     * カード特攻モード
     ***********************************************/
    if (!useCard) {
        document.getElementById("card-summary").innerHTML =
            `カード特攻を使用する場合は、チェックを入れてください。`;
        return;
    }

    const cardResults = searchCardMode(remain, plBonus, trophyBonus, cardInput, use5step);

    if (cardResults.length === 0) {
        document.getElementById("card-summary").innerHTML =
            `結果 0件<br>上記の条件では見つけることが出来ませんでした。<br>
             ペンライト：${plBonus * 100}%<br>
             トロフィー：${trophyBonus * 100}%<br>
             カード特攻：${cardInput}%`;
        return;
    }

    document.getElementById("card-summary").innerHTML =
        `結果 ${cardResults.length}件見つかりました<br>
         ペンライト：${plBonus * 100}%<br>
         トロフィー：${trophyBonus * 100}%<br>
         入力値：${cardInput}% ／ 刻み：${use5step ? 5 : 10}%`;

    /***********************************************
     * カード特攻結果（改行なし・左寄せ乱れなし）
     ***********************************************/
    const cardHTML = cardResults.map((item, idx) => {

        const labels = item.list
            .map(p => `${p.cons}倍消化-${p.diff}-スコア${p.sRank}-コンボ${p.cRank}`)
            .join(" / ");

        return `
<div class="result-block">
結果${idx+1} 合計1曲 <b>${item.total}pt</b> ／ カード特攻 <b>${item.cardValue}%</b><br>
<b>${item.bonus}</b>（カード特攻${item.cardValue}%）<br>
<b>${item.baseTotal}</b> (${labels})
</div>
`;
    });

    document.getElementById("card-list").innerHTML = cardHTML.join("");

});

/***********************************************
 * カード特攻入力の UX
 ***********************************************/
const cardInputBox = document.getElementById("card-bonus");

cardInputBox.addEventListener("focus", () => {
    if (cardInputBox.value === "0") cardInputBox.value = "";
});

cardInputBox.addEventListener("blur", () => {
    if (cardInputBox.value.trim() === "") cardInputBox.value = "0";
});

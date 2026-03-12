// js/scenes/gacha.js

import { drawGacha } from "../data/gachaLogics.js";
import { gachaPools } from "../data/gachaPools.js";
import { characters as characters_flat } from "../data/characters_flat.js";
import { getPrefNameByCharId } from "../data/characterUtil.js";
import { savePlayerData, loadPlayerData } from "../data/save.js";
import { characters } from "../data/characters.js";



function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


function showGachaResult(results, onDrawAgain) {
    const modal = document.getElementById("gacha-result-modal");
    const grid = document.getElementById("gacha-result-grid");
    const closeBtn = document.getElementById("gacha-result-close");
    const againBtn = document.getElementById("gacha-draw-again");

    grid.innerHTML = "";

    results.forEach(r => {
        const item = document.createElement("div");
        item.classList.add("result-item");
        if (r.rarity === "☆4") item.classList.add("rare-4");

        if (r.isNew) {
            const newBadge = document.createElement("div");
            newBadge.classList.add("new-badge");
            newBadge.textContent = "NEW!";
            item.appendChild(newBadge);
        }

        const img = document.createElement("img");
        img.src = r.character?.image ?? "";
        item.appendChild(img);

        const badge = document.createElement("div");
        badge.classList.add("rarity-badge");
        badge.textContent = r.rarity;
        item.appendChild(badge);

        grid.appendChild(item);
    });

    const closeHandler = () => {
        modal.style.display = "none";
        closeBtn.removeEventListener("pointerdown", closeHandler);
        againBtn.removeEventListener("pointerdown", againHandler);
    };

    const againHandler = () => {
        modal.style.display = "none";
        closeBtn.removeEventListener("pointerdown", closeHandler);
        againBtn.removeEventListener("pointerdown", againHandler);
        if (onDrawAgain) onDrawAgain();
    };

    closeBtn.addEventListener("pointerdown", closeHandler);
    againBtn.addEventListener("pointerdown", againHandler);

    modal.style.display = "flex";
}

async function playGachaAnimation(results, onComplete) {
    const modal = document.getElementById("gacha-animation-modal");
    const container = document.getElementById("gacha-reveal-container");
    const charImg = document.getElementById("reveal-char-img");
    const rarity = document.getElementById("reveal-char-rarity");
    const subtitle = document.getElementById("reveal-char-subtitle");
    const prefecture = document.getElementById("reveal-char-prefecture");
    const newBadge = document.getElementById("reveal-new-badge");

    modal.style.display = "flex";

    const waitForTap = () => new Promise(resolve => {
        const handler = () => {
            modal.removeEventListener("pointerdown", handler);
            resolve();
        };
        modal.addEventListener("pointerdown", handler);
    });

    for (let i = 0; i < results.length; i++) {
        const r = results[i];

        // 1. Reset state (Curtain closed)
        modal.classList.remove("revealed");
        container.classList.remove("active");
        container.style.opacity = "0";

        if (i > 0) {
            // 前のキャラが見えないよう、幕が閉まるのを待つ
            await sleep(900);
        }

        // 2. Prepare data safely behind the curtain
        const charData = r.character;
        charImg.src = charData.image;
        rarity.textContent = r.rarity;
        subtitle.textContent = charData.subtitle;
        prefecture.textContent = getPrefNameByCharId(charData.id);

        if (newBadge) {
            newBadge.style.display = r.isNew ? "block" : "none";
        }

        await sleep(100);

        // 3. Wait for tap
        await waitForTap();

        // 4. Reveal!
        modal.classList.add("revealed");
        await sleep(100);
        container.style.opacity = "1";
        container.classList.add("active");

        // 5. Wait for tap to go next or finish
        await sleep(500);
        await waitForTap();
    }

    modal.style.display = "none";
    modal.classList.remove("revealed");
    container.classList.remove("active");

    if (onComplete) onComplete();
}


export function initGacha() {
    let playerData = loadPlayerData();
    let currentGacha = "pickup";
    let drawCount = 1;
    const listItems = document.querySelectorAll(".gacha-list-item");
    const previewText = document.querySelector(".gacha-placeholder-text");
    const previewImg = document.getElementById("gacha-preview-img");

    const updateDiamondUI = () => {
        // 全てのダイヤ表示（ガチャ画面、ホーム画面）を一括更新
        document.querySelectorAll(".gacha-diamond-display span, #home-diamond-display span").forEach(el => {
            el.textContent = playerData.diamond;
        });
    };
    updateDiamondUI();

    listItems.forEach(item => {
        item.addEventListener("pointerdown", (e) => {
            listItems.forEach(i => i.classList.remove("active"));
            e.currentTarget.classList.add("active");
            currentGacha = e.currentTarget.dataset.gacha;

            if (currentGacha === "normal") {
                if (previewImg) {
                    previewImg.src = "assets/images/normal_gacha.png";
                    previewImg.style.display = "block";
                }
                if (previewText) previewText.style.display = "none";
            } else {
                if (previewImg) previewImg.style.display = "none";
                if (previewText) {
                    previewText.style.display = "block";
                    previewText.textContent = `${currentGacha}（未作成）`;
                }
            }
        });
    });

    const rateBtn = document.querySelector(".gacha-info-btn");
    const rateModal = document.getElementById("gacha-rate-modal");
    const rateCloseBtn = document.querySelector(".rate-close-btn");

    if (rateBtn) {
        rateBtn.addEventListener("pointerdown", () => {
            const rarityTable = document.querySelector(".rate-table");
            const charTable = document.getElementById("char-rate-table");
            if (!rarityTable || !charTable) return;

            const pool = gachaPools[currentGacha];
            const rates = pool.rarityRates;
            const pickups = pool.pickups || [];
            const pickupRate = pool.pickupRate || 0;

            // 1. レアリティ別テーブル
            rarityTable.innerHTML = "<tr><th>レアリティ</th><th>合計確率</th></tr>";
            Object.entries(rates).sort((a, b) => b[0] - a[0]).forEach(([rarity, rate]) => {
                const row = document.createElement("tr");
                row.innerHTML = `<td>☆${rarity}</td><td>${rate}%</td>`;
                rarityTable.appendChild(row);
            });

            // 2. キャラクター個別テーブル
            charTable.innerHTML = "";

            const charactersByRarity = { 1: [], 2: [], 3: [], 4: [] };
            Object.values(characters_flat).forEach(c => {
                charactersByRarity[c.rarity].push(c);
            });

            const allRows = [];

            // 各レアリティごとに計算
            Object.entries(charactersByRarity).forEach(([rarityStr, charList]) => {
                const rarity = parseInt(rarityStr);
                const totalRarityRate = rates[rarity] || 0;

                const pickupCharsInRarity = charList.filter(c => pickups.includes(c.id));
                const normalCharsInRarity = charList.filter(c => !pickups.includes(c.id));

                let pickupCharProb = 0;
                let normalCharProb = 0;

                // ピックアップは現状レア度4のみ
                if (rarity === 4 && pickupCharsInRarity.length > 0) {
                    // pool.pickupRate はピックアップ全体の合計確率
                    pickupCharProb = pickupRate / pickupCharsInRarity.length;
                    // 残りの確率を非ピックアップで分ける
                    const remainingRarityProb = Math.max(0, totalRarityRate - pickupRate);
                    normalCharProb = normalCharsInRarity.length > 0 ? remainingRarityProb / normalCharsInRarity.length : 0;
                } else {
                    // 通常通り等分
                    normalCharProb = charList.length > 0 ? totalRarityRate / charList.length : 0;
                }

                charList.forEach(c => {
                    const isPickup = pickups.includes(c.id);
                    const prob = isPickup ? pickupCharProb : normalCharProb;
                    const prefName = getPrefNameByCharId(c.id);

                    allRows.push({
                        rarity,
                        name: prefName,
                        subtitle: c.subtitle,
                        prob: prob.toFixed(3),
                        isPickup
                    });
                });
            });

            // ソート: ピックアップ優先 > レアリティ降順
            allRows.sort((a, b) => {
                if (a.isPickup && !b.isPickup) return -1;
                if (!a.isPickup && b.isPickup) return 1;
                return b.rarity - a.rarity;
            });

            allRows.forEach(row => {
                const div = document.createElement("div");
                div.className = `char-rate-row ${row.isPickup ? 'pickup' : ''}`;
                div.innerHTML = `
                    <div class="char-rate-rarity">☆${row.rarity}</div>
                    <div class="char-rate-name">${row.name}</div>
                    <div class="char-rate-subtitle">${row.subtitle}</div>
                    <div class="char-rate-percent">${row.prob}%</div>
                `;
                charTable.appendChild(div);
            });

            if (rateModal) rateModal.style.display = "flex";
        });
    }

    if (rateCloseBtn && rateModal) {
        rateCloseBtn.addEventListener("pointerdown", () => {
            rateModal.style.display = "none";
        });
    }

    const executeDraw = (count) => {
        let cost = (count === 1) ? 100 : 1000;
        if (playerData.diamond < cost) return;

        playerData.diamond -= cost;

        const result = drawGacha(currentGacha, count);

        // コレクションに追加
        if (!playerData.collection) playerData.collection = [];
        result.forEach(r => {
            const isNew = !playerData.collection.includes(r.character.id);
            r.isNew = isNew; // 結果オブジェクトにフラグを立てる
            if (isNew) {
                playerData.collection.push(r.character.id);
            }
        });

        // データの保存
        savePlayerData(playerData);
        updateDiamondUI();

        playGachaAnimation(result, () => {
            showGachaResult(result, () => executeDraw(count));
        });
    };

    const drawButtons = document.querySelectorAll(".gacha-draw-btn");
    const confirmModal = document.getElementById("gacha-confirm-modal");
    const cancelBtn = document.getElementById("cancel-gacha");
    const confirmBtn = document.getElementById("confirm-gacha");

    drawButtons.forEach(btn => {
        btn.addEventListener("pointerdown", () => {
            drawCount = Number(btn.dataset.count);
            let cost = (drawCount === 1) ? 100 : 1000;

            document.getElementById("cost-before").textContent = cost;
            document.getElementById("diamond-before").textContent = playerData.diamond;
            document.getElementById("diamond-after").textContent = playerData.diamond - cost;

            if (playerData.diamond < cost) {
                confirmBtn.disabled = true;
                const warn = document.getElementById("gacha-warning");
                if (warn) warn.textContent = "※ダイヤが足りません";
            } else {
                confirmBtn.disabled = false;
                const warn = document.getElementById("gacha-warning");
                if (warn) warn.textContent = "";
            }
            confirmModal.style.display = "flex";
        });
    });

    cancelBtn.addEventListener("pointerdown", () => {
        confirmModal.style.display = "none";
    });

    confirmBtn.addEventListener("pointerdown", () => {
        confirmModal.style.display = "none";
        executeDraw(drawCount);
    });
}


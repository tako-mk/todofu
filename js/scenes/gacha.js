// js/scenes/gacha.js

import { gachaData } from "../data/gachaData.js";


export function initGacha() {
    let currentGacha = "pickup";
    const listItems = document.querySelectorAll(".gacha-list-item");
    const previewText = document.querySelector(".gacha-placeholder-text");
    const previewImg = document.getElementById("gacha-preview-img");

    listItems.forEach(item => {
        item.addEventListener("pointerdown", (e) => {
            // 他の要素から active を外す
            listItems.forEach(i => i.classList.remove("active"));
            // クリックされた要素に active をつける
            e.currentTarget.classList.add("active");

            currentGacha = e.currentTarget.dataset.gacha;

            // 右側のプレビュー切り替えロジック
            if (currentGacha === "normal") {
                // ノーマルガチャの場合、画像を表示してテキストを隠す
                if (previewImg) {
                    previewImg.src = "assets/images/normal_gacha.png";
                    previewImg.style.display = "block";
                }
                if (previewText) previewText.style.display = "none";
            } else {
                // それ以外（未作成）の場合、画像を隠してテキストを表示する
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
    const rateCloseBtn = document.getElementById("rate-close-btn");

    if (rateBtn && rateModal) {
        rateBtn.addEventListener("pointerdown", () => {

            const table = document.querySelector(".rate-table");
            if (!table) return;
            table.innerHTML = "";

            const rates = gachaData[currentGacha].rarityRates;

            rates.forEach(r => {

                const row = document.createElement("tr");

                row.innerHTML = `
                    <td>${r.rarity}</td>
                    <td>${r.rate}</td>
                `;

                table.appendChild(row);
            });

            rateModal.style.display = "flex";
        });
    }

    if (rateCloseBtn && rateModal) {
        rateCloseBtn.addEventListener("pointerdown", () => {
            rateModal.style.display = "none";
        });
    }

    const drawButtons = document.querySelectorAll(".gacha-draw-btn");
    const confirmModal = document.getElementById("gacha-confirm-modal");
    const cancelBtn = document.getElementById("cancel-gacha");

    drawButtons.forEach(btn => {

        btn.addEventListener("pointerdown", () => {

            const count = Number(btn.dataset.count);

            let cost;
            if (count === 1) {
                cost = 100;
            } else if (count === 10) {
                cost = 1000;
            }

            const diamonds = 500;

            document.getElementById("cost-before").textContent = cost;
            document.getElementById("diamond-before").textContent = diamonds;
            document.getElementById("diamond-after").textContent = diamonds - cost;

            confirmModal.style.display = "flex";
        });

    });

    cancelBtn.addEventListener("pointerdown", () => {
        confirmModal.style.display = "none";
    });
}

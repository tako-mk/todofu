// js/scenes/present.js
import { loadPlayerData, savePlayerData } from "../data/save.js";

export function initPresentModal() {
    const modal = document.getElementById("present-modal");
    const openBtn = document.getElementById("btn-present");
    const closeBtn = document.getElementById("btn-close-present");
    const claimAllBtn = document.getElementById("btn-present-claim-all");

    if (openBtn) {
        openBtn.addEventListener("pointerdown", () => {
            renderPresentList();
            modal.style.display = "flex";
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener("pointerdown", () => {
            modal.style.display = "none";
        });
    }

    if (claimAllBtn) {
        claimAllBtn.addEventListener("pointerdown", () => {
            claimAll();
        });
    }
}

function renderPresentList() {
    const data = loadPlayerData();
    const listContainer = document.getElementById("present-list");
    const emptyMsg = document.getElementById("present-empty-msg");

    if (!listContainer) return;

    listContainer.innerHTML = "";

    if (!data.presents || data.presents.length === 0) {
        if (emptyMsg) emptyMsg.style.display = "block";
        return;
    }

    if (emptyMsg) emptyMsg.style.display = "none";

    data.presents.forEach(p => {
        const item = document.createElement("div");
        item.className = "present-item";

        let iconHtml = p.icon;
        if (p.type === "money") iconHtml = `<img src="assets/images/coin.png" class="icon-coin" alt="coin">`;
        if (p.type === "diamond") iconHtml = `<img src="assets/images/diamond.png" class="icon-diamond" alt="diamond">`;

        item.innerHTML = `
            <div class="present-item-icon">${iconHtml}</div>
            <div class="present-item-info">
                <div class="present-item-name">${p.name}</div>
                <div class="present-item-desc">${p.desc}</div>
            </div>
            <button class="btn-claim" data-id="${p.id}">受取</button>
        `;
        listContainer.appendChild(item);

        item.querySelector(".btn-claim").addEventListener("pointerdown", () => {
            claimPresent(p.id);
        });
    });
}

function claimPresent(id) {
    const data = loadPlayerData();
    const index = data.presents.findIndex(p => p.id === id);
    if (index === -1) return;

    const present = data.presents[index];

    // 報酬の付与
    if (present.type === "money") {
        data.money += present.amount;
    } else if (present.type === "diamond") {
        data.diamond += present.amount;
    }

    // リストから削除
    data.presents.splice(index, 1);

    savePlayerData(data);
    updateUI(data);
    renderPresentList();
}

function claimAll() {
    const data = loadPlayerData();
    if (!data.presents || data.presents.length === 0) return;

    data.presents.forEach(present => {
        if (present.type === "money") {
            data.money += present.amount;
        } else if (present.type === "diamond") {
            data.diamond += present.amount;
        }
    });

    data.presents = [];

    savePlayerData(data);
    updateUI(data);
    renderPresentList();
}

function updateUI(data) {
    // ホーム画面の表示を更新
    const moneyEl = document.querySelector("#home-money-display span");
    const diamondEl = document.querySelector("#home-diamond-display span");
    if (moneyEl) moneyEl.textContent = data.money;
    if (diamondEl) diamondEl.textContent = data.diamond;

    // ガチャ画面などの他画面との同期が必要な場合はカスタムイベントなどで通知
    window.dispatchEvent(new CustomEvent("player-data-updated", { detail: data }));
}

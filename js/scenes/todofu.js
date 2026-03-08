import { loadPlayerData, savePlayerData } from "../data/save.js";
import { characters as characters_flat } from "../data/characters_flat.js";
import { characters as characters_raw } from "../data/characters.js";
import { getPrefNameByCharId } from "../data/characterUtil.js";

let playerData = null;
let currentTeamIdx = 0;
let currentSlotIdx = null;
let selectedCharId = null;

// キャラクタの正規の並び（IDの配列）
const canonicalOrder = [];
const allPrefNames = [];
for (const prefKey in characters_raw) {
    const pref = characters_raw[prefKey];
    allPrefNames.push(pref.name);
    for (const charKey in pref.characters) {
        canonicalOrder.push(pref.characters[charKey].id);
    }
}

// フィルター・ソート状態
let activeRarities = [4, 3, 2, 1];
let activeNames = [...allPrefNames]; // 初期状態はすべて
let sortMode = "rarity"; // "rarity" or "default"

export function initTodofu() {
    playerData = loadPlayerData();

    const menu = document.getElementById("todofu-menu");
    const formationView = document.getElementById("todofu-formation-view");
    const backBtn = document.getElementById("btn-todofu-back");
    const title = document.getElementById("todofu-main-title");

    // 編成ボタン
    document.getElementById("btn-formation").addEventListener("pointerdown", () => {
        menu.style.display = "none";
        formationView.style.display = "flex";
        title.textContent = "編成";
        renderFormation();
    });

    // もどるボタン
    backBtn.addEventListener("pointerdown", () => {
        const trainingView = document.getElementById("todofu-training-view");
        const selectionView = document.getElementById("todofu-training-selection-view");

        if (formationView.style.display === "flex") {
            formationView.style.display = "none";
            menu.style.display = "flex";
            title.textContent = "とどーふ";
        } else if (trainingView.style.display === "flex") {
            trainingView.style.display = "none";
            selectionView.style.display = "flex";
            title.textContent = "とどーふ選択";
        } else if (selectionView.style.display === "flex") {
            selectionView.style.display = "none";
            menu.style.display = "flex";
            title.textContent = "とどーふ";
        } else {
            window.dispatchEvent(new CustomEvent("transition-to-home"));
        }
    });

    // 編成タブ
    const tabs = document.querySelectorAll(".formation-tab");
    tabs.forEach(tab => {
        tab.addEventListener("pointerdown", (e) => {
            tabs.forEach(t => t.classList.remove("active"));
            e.currentTarget.classList.add("active");
            currentTeamIdx = parseInt(e.currentTarget.dataset.team);
            renderFormation();
        });
    });

    // キャラ選択モーダル関連
    const cancelSelect = document.getElementById("btn-cancel-select");
    const confirmSelect = document.getElementById("btn-confirm-select");
    const modal = document.getElementById("todofu-char-select-modal");

    cancelSelect.addEventListener("pointerdown", () => {
        modal.style.display = "none";
    });

    confirmSelect.addEventListener("pointerdown", () => {
        if (selectedCharId !== null) {
            if (selectionCallback) {
                selectionCallback(selectedCharId);
            } else {
                playerData.formations[currentTeamIdx][currentSlotIdx] = selectedCharId;
                savePlayerData(playerData);
                renderFormation();
            }
            modal.style.display = "none";
        }
    });

    // フィルタ・ソートUIイベント
    initFilterSortUI();
    renderNameFilterOptions(); // 追加: 起動時にチェックボックスを生成しておく
}

// 外部からフィルター反映時の挙動を指定できるようにする
let filterChangeCallback = null;
export function setFilterChangeCallback(callback) {
    filterChangeCallback = callback;
}

function initFilterSortUI() {
    const filterPanel = document.getElementById("filter-panel");
    const btnOpenFilter = document.getElementById("btn-open-filter");
    const btnCloseFilter = document.getElementById("btn-close-filter");
    const btnToggleSort = document.getElementById("btn-toggle-sort");

    if (!filterPanel || !btnOpenFilter || !btnCloseFilter || !btnToggleSort) {
        console.warn("Filter UI elements not found. Skipping init.");
        return;
    }

    btnOpenFilter.onclick = () => {
        filterPanel.style.display = "flex";
        renderNameFilterOptions();
    };

    btnCloseFilter.onclick = () => {
        filterPanel.style.display = "none";
        if (filterChangeCallback) {
            filterChangeCallback();
        } else {
            renderCharList();
        }
    };

    btnToggleSort.onclick = () => {
        sortMode = (sortMode === "rarity") ? "default" : "rarity";
        btnToggleSort.textContent = `↕ ソート: ${sortMode === "rarity" ? "レアリティ順" : "デフォルト順"}`;
        renderCharList();
    };

    // 一括操作ボタン
    const btnRarityAll = document.getElementById("btn-rarity-all");
    const btnRarityNone = document.getElementById("btn-rarity-none");
    const btnNameAll = document.getElementById("btn-name-all");
    const btnNameNone = document.getElementById("btn-name-none");

    if (btnRarityAll) {
        btnRarityAll.onclick = () => {
            document.querySelectorAll(".filter-rarity-check").forEach(c => c.checked = true);
            activeRarities = [4, 3, 2, 1];
            if (filterChangeCallback) filterChangeCallback(); else renderCharList();
        };
    }
    if (btnRarityNone) {
        btnRarityNone.onclick = () => {
            document.querySelectorAll(".filter-rarity-check").forEach(c => c.checked = false);
            activeRarities = [];
            if (filterChangeCallback) filterChangeCallback(); else renderCharList();
        };
    }
    if (btnNameAll) {
        btnNameAll.onclick = () => {
            document.querySelectorAll(".filter-name-check").forEach(c => c.checked = true);
            activeNames = [...allPrefNames];
            if (filterChangeCallback) filterChangeCallback(); else renderCharList();
        };
    }
    if (btnNameNone) {
        btnNameNone.onclick = () => {
            document.querySelectorAll(".filter-name-check").forEach(c => c.checked = false);
            activeNames = [];
            if (filterChangeCallback) filterChangeCallback(); else renderCharList();
        };
    }


    // レアリティチェックボックスのイベント
    document.querySelectorAll(".filter-rarity-check").forEach(chk => {
        chk.onchange = () => {
            activeRarities = Array.from(document.querySelectorAll(".filter-rarity-check:checked")).map(c => parseInt(c.value));
            if (filterChangeCallback) filterChangeCallback(); else renderCharList();
        };
    });
}

export function renderNameFilterOptions() {
    const nameGroup = document.getElementById("filter-name-group");
    if (!nameGroup) return;
    nameGroup.innerHTML = "";

    allPrefNames.forEach(name => {
        const label = document.createElement("label");
        const isChecked = activeNames.includes(name);
        label.innerHTML = `<input type="checkbox" class="filter-name-check" value="${name}" ${isChecked ? "checked" : ""}> ${name}`;

        const chk = label.querySelector("input");
        chk.onchange = () => {
            activeNames = Array.from(document.querySelectorAll(".filter-name-check:checked")).map(c => c.value);
            if (filterChangeCallback) filterChangeCallback(); else renderCharList();
        };

        nameGroup.appendChild(label);
    });
}

function renderFormation() {
    const slotsContainer = document.getElementById("formation-slots");
    slotsContainer.innerHTML = "";

    const team = playerData.formations ? playerData.formations[currentTeamIdx] : null;
    if (!team) return;

    team.forEach((charId, idx) => {
        const slot = document.createElement("div");
        slot.className = "formation-slot" + (charId ? " occupied" : "");

        if (charId) {
            const char = characters_flat[charId];
            const img = document.createElement("img");
            img.src = char.image;
            slot.appendChild(img);

            // レアリティ表示を追加
            const rarityDiv = document.createElement("div");
            rarityDiv.className = "grid-item-rarity";
            rarityDiv.textContent = "★".repeat(char.rarity);
            slot.appendChild(rarityDiv);
        } else {
            const plus = document.createElement("div");
            plus.className = "add-icon";
            plus.textContent = "+";
            slot.appendChild(plus);
        }

        slot.addEventListener("pointerdown", () => {
            openCharSelect(idx);
        });

        slotsContainer.appendChild(slot);
    });
}

let selectionCallback = null;

export function openCharSelect(slotIdx, customCallback = null) {
    currentSlotIdx = slotIdx;
    selectedCharId = null;
    selectionCallback = customCallback;
    document.getElementById("btn-confirm-select").disabled = true;

    const modal = document.getElementById("todofu-char-select-modal");
    modal.style.display = "flex";

    renderCharList();
}

function renderCharList() {
    const grid = document.getElementById("char-select-grid");
    const preview = document.getElementById("char-preview-area");
    grid.innerHTML = "";
    preview.innerHTML = '<div class="placeholder">キャラクターを選択してください</div>';

    // 所持キャラ
    let list = (playerData.collection || []).map(id => ({
        id,
        ...characters_flat[id],
        prefName: getPrefNameByCharId(id),
        orderIndex: canonicalOrder.indexOf(id)
    }));

    // フィルタリング
    // 1. レアリティ
    list = list.filter(char => activeRarities.includes(char.rarity));
    // 2. 名前
    if (activeNames.length > 0) {
        list = list.filter(char => activeNames.includes(char.prefName));
    } else {
        list = []; // 何も選択されていない場合は空
    }
    // 3. 重複排除（同じ都道府県のキャラは同じチームに入れられない）
    // NOTE: お気に入り変更（selectionCallbackがある場合）のときは全キャラ選べるようにする
    if (!selectionCallback) {
        const team = playerData.formations[currentTeamIdx];
        const teamPrefNames = team
            .filter((id, i) => i !== currentSlotIdx && id !== null)
            .map(id => getPrefNameByCharId(id));

        list = list.filter(char => !teamPrefNames.includes(char.prefName));
    }

    // ソート
    if (sortMode === "rarity") {
        list.sort((a, b) => b.rarity - a.rarity || a.orderIndex - b.orderIndex);
    } else {
        list.sort((a, b) => a.orderIndex - b.orderIndex);
    }

    list.forEach(char => {
        const item = document.createElement("div");
        item.className = "grid-item";
        item.innerHTML = `
            <img src="${char.image}" alt="">
            <div class="grid-item-rarity">${"★".repeat(char.rarity)}</div>
        `;

        item.addEventListener("pointerdown", () => {
            document.querySelectorAll(".grid-item").forEach(i => i.classList.remove("selected"));
            item.classList.add("selected");

            selectedCharId = char.id;
            updatePreview(char.id);
            document.getElementById("btn-confirm-select").disabled = false;
        });

        grid.appendChild(item);
    });
}

function updatePreview(charId) {
    const char = characters_flat[charId];
    const preview = document.getElementById("char-preview-area");
    const prefName = getPrefNameByCharId(charId);

    preview.innerHTML = `
        <div class="preview-img-container">
            <img src="${char.image}" class="preview-img">
            <div class="grid-item-rarity">${"★".repeat(char.rarity)}</div>
        </div>
        <div class="preview-subtitle">${char.subtitle}</div>
        <div class="preview-name">${prefName}</div>
    `;
}

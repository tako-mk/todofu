/* js/scenes/training.js */
import { loadPlayerData, savePlayerData } from "../data/save.js";
import { characters as characters_flat } from "../data/characters_flat.js";
import { getPrefNameByCharId, getAllCharacters } from "../data/characterUtil.js";
import { setFilterChangeCallback, renderNameFilterOptions } from "./todofu.js";

let playerData = null;
let currentTrainingCharId = null;
let tempSelectedCharId = null;

let sortMode = "rarity";
let useQuantities = {
    "training_platinum": 0,
    "training_gold": 0,
    "training_silver": 0,
    "training_bronze": 0
};

const xpValues = {
    "training_platinum": 5000,
    "training_gold": 1000,
    "training_silver": 200,
    "training_bronze": 50
};

const itemNames = {
    "training_platinum": "プラチナちほーこーふきんカード",
    "training_gold": "ゴールドちほーこーふきんカード",
    "training_silver": "シルバーちほーこーふきんカード",
    "training_bronze": "ブロンズちほーこーふきんカード"
};

const itemIcons = {
    "training_platinum": "assets/images/items/platinum_tax_card.png",
    "training_gold": "assets/images/items/gold_tax_card.png",
    "training_silver": "assets/images/items/silver_tax_card.png",
    "training_bronze": "assets/images/items/bronze_tax_card.png"
};

export function initTraining() {
    const btnTraining = document.getElementById("btn-training");
    const todofuMenu = document.getElementById("todofu-menu");
    const selectionView = document.getElementById("todofu-training-selection-view");
    const title = document.getElementById("todofu-main-title");

    btnTraining.addEventListener("pointerdown", () => {
        todofuMenu.style.display = "none";
        selectionView.style.display = "flex";
        title.textContent = "とどーふ選択";

        playerData = loadPlayerData();
        tempSelectedCharId = null;
        updateSelectionPreview(null);
        renderSelectionGrid();
    });

    document.getElementById("btn-training-filter").addEventListener("pointerdown", () => {
        const filterPanel = document.getElementById("filter-panel");
        if (filterPanel) {
            renderNameFilterOptions(); // 都道府県リストを生成
            setFilterChangeCallback(() => {
                renderSelectionGrid();
            });
            filterPanel.style.display = "flex";
            // z-indexを高めにする (もし必要なら)
            filterPanel.style.zIndex = "1000";
        }
    });

    document.getElementById("btn-training-sort").addEventListener("pointerdown", () => {
        sortMode = (sortMode === "rarity") ? "default" : "rarity";
        document.getElementById("btn-training-sort").textContent = `↕ ソート: ${sortMode === "rarity" ? "レアリティ順" : "デフォルト順"}`;
        renderSelectionGrid();
    });

    document.getElementById("btn-confirm-training-selection").addEventListener("pointerdown", () => {
        if (tempSelectedCharId) {
            selectCharForTraining(tempSelectedCharId);
        }
    });

    document.getElementById("btn-execute-training").addEventListener("pointerdown", executeTraining);
}

function renderSelectionGrid() {
    playerData = loadPlayerData();
    const grid = document.getElementById("training-selection-grid");
    grid.innerHTML = "";

    const canonicalIds = getAllCharacters().map(c => c.id);

    let list = (playerData.collection || []).map(id => ({
        id,
        ...characters_flat[id],
        prefName: getPrefNameByCharId(id),
        orderIndex: canonicalIds.indexOf(id)
    }));

    // フィルタリングロジック
    // レアリティフィルター
    const rarityChecks = document.querySelectorAll(".filter-rarity-check:checked");
    const checkedRarities = rarityChecks.length > 0
        ? Array.from(rarityChecks).map(c => parseInt(c.value))
        : [4, 3, 2, 1];
    list = list.filter(char => checkedRarities.includes(char.rarity));

    // 名前フィルター
    const nameChecks = document.querySelectorAll(".filter-name-check");
    if (nameChecks.length > 0) {
        const checkedNames = Array.from(document.querySelectorAll(".filter-name-check:checked")).map(c => c.value);
        if (checkedNames.length > 0) {
            list = list.filter(char => checkedNames.includes(char.prefName));
        } else {
            list = []; // 明示的に「何も選択されていない」状態
        }
    }
    // どちらのチェックボックスも存在しない場合は、全表示（初期化のタイミング等）

    if (sortMode === "rarity") {
        list.sort((a, b) => b.rarity - a.rarity || a.orderIndex - b.orderIndex);
    } else {
        list.sort((a, b) => a.orderIndex - b.orderIndex);
    }

    list.forEach(char => {
        const charItem = document.createElement("div");
        charItem.className = "char-item" + (tempSelectedCharId === char.id ? " selected" : "");
        charItem.innerHTML = `
            <img src="${char.image}" alt="">
            <div class="grid-item-rarity">${"★".repeat(char.rarity)}</div>
        `;

        charItem.addEventListener("pointerdown", () => {
            tempSelectedCharId = char.id;
            const items = grid.querySelectorAll(".char-item");
            items.forEach(it => it.classList.remove("selected"));
            charItem.classList.add("selected");
            updateSelectionPreview(char.id);
        });

        grid.appendChild(charItem);
    });
}

function updateSelectionPreview(charId) {
    const previewArea = document.getElementById("training-selection-preview");
    const confirmBtn = document.getElementById("btn-confirm-training-selection");

    if (!charId) {
        previewArea.innerHTML = '<p class="placeholder-text">育成するとどーふを<br>選んでください</p>';
        confirmBtn.disabled = true;
        return;
    }

    const char = characters_flat[charId];
    const prefName = getPrefNameByCharId(charId);
    const stats = playerData.charStats[charId] || { level: 1, xp: 0 };

    previewArea.innerHTML = `
        <div class="training-subtitle">${char.subtitle}</div>
        <div class="training-name" style="font-size: 28px; margin-bottom: 15px;">${prefName}</div>
        <div class="preview-img-container">
            <img src="${char.image}" style="max-height: 250px; margin-bottom: 20px;">
            <div class="grid-item-rarity">${"★".repeat(char.rarity)}</div>
        </div>
        <div class="training-level" style="margin-bottom: 5px;">Lv <span>${stats.level}</span></div>
    `;
    confirmBtn.disabled = false;
}

function selectCharForTraining(charId) {
    // 他の画面でもフィルターが効くようにリセット
    setFilterChangeCallback(null);

    currentTrainingCharId = charId;
    document.getElementById("todofu-training-selection-view").style.display = "none";
    document.getElementById("todofu-training-view").style.display = "flex";
    document.getElementById("todofu-main-title").textContent = "育成";
    resetUseQuantities();
    renderTrainingView();
}

function resetUseQuantities() {
    for (const key in useQuantities) {
        useQuantities[key] = 0;
    }
}

function renderTrainingView() {
    if (!currentTrainingCharId) return;

    playerData = loadPlayerData();
    const char = characters_flat[currentTrainingCharId];
    const stats = playerData.charStats[currentTrainingCharId] || { level: 1, xp: 0 };
    const prefName = getPrefNameByCharId(currentTrainingCharId);

    document.getElementById("training-char-subtitle").textContent = char.subtitle;
    document.getElementById("training-char-name").textContent = prefName;

    const previewArea = document.getElementById("training-char-preview");
    const existingElements = previewArea.querySelectorAll("img, .preview-img-container, .training-level-row, .training-xp-bar-container, .training-xp-text");
    existingElements.forEach(el => el.remove());

    const contentScroll = document.createElement("div");
    contentScroll.style.width = "100%";
    contentScroll.innerHTML = `
        <div class="preview-img-container">
            <img src="${char.image}" alt="">
            <div class="grid-item-rarity">${"★".repeat(char.rarity)}</div>
        </div>
        <div class="training-level-row">
            <div class="training-level">Lv <span>${stats.level}</span></div>
        </div>
        <div class="training-xp-bar-container">
            <div class="training-xp-bar-fill" style="width: ${calculateXPPerc(stats)}%"></div>
            <div id="xp-bar-expected" class="training-xp-bar-expected" style="width: 0%"></div>
        </div>
        <div class="training-xp-text">NEXT: ${calculateNextXP(stats.level) - stats.xp}</div>
    `;
    Array.from(contentScroll.children).forEach(child => previewArea.appendChild(child));

    const itemsContainer = document.getElementById("training-items-container");
    itemsContainer.innerHTML = "";

    const itemKeys = ["training_platinum", "training_gold", "training_silver", "training_bronze"];
    itemKeys.forEach(key => {
        const owned = playerData.items[key] || 0;
        const row = document.createElement("div");
        row.className = "training-item-row";

        const typeClass = key.split("_")[1];
        row.innerHTML = `
            <div class="item-header-part">
                <div class="item-thumb ${typeClass}"><img src="${itemIcons[key]}" alt=""></div>
                <div class="item-info">
                    <div class="item-name">${itemNames[key]}</div>
                    <div class="item-usage-blocks" id="usage-blocks-${key}">
                        <div class="count-block">${owned}</div>
                        <div class="usage-arrow" style="display:none">→</div>
                        <div class="count-block after" style="display:none"></div>
                    </div>
                </div>
            </div>
            <div class="item-slider-area">
                <input type="range" class="item-slider" min="0" max="${owned}" value="${useQuantities[key]}" data-key="${key}">
                <div class="item-use-count">${useQuantities[key]}</div>
            </div>
        `;

        const slider = row.querySelector(".item-slider");
        slider.addEventListener("input", (e) => {
            const val = parseInt(e.target.value);
            useQuantities[key] = val;
            const container = document.getElementById(`usage-blocks-${key}`);
            row.querySelector(".item-use-count").textContent = val;

            const arrow = container.querySelector(".usage-arrow");
            const afterBlock = container.querySelector(".count-block.after");

            if (val > 0) {
                arrow.style.display = "block";
                afterBlock.style.display = "block";
                afterBlock.textContent = owned - val;
                if (owned - val === 0) afterBlock.classList.add("warning");
                else afterBlock.classList.remove("warning");
            } else {
                arrow.style.display = "none";
                afterBlock.style.display = "none";
            }
            updateExpectedGain();
        });

        itemsContainer.appendChild(row);
    });

    updateExpectedGain();
}

function updateExpectedGain() {
    let totalGain = 0;
    for (const key in useQuantities) {
        totalGain += useQuantities[key] * xpValues[key];
    }
    document.getElementById("xp-gain-value").textContent = totalGain;
    document.getElementById("btn-execute-training").disabled = totalGain === 0;

    const stats = playerData.charStats[currentTrainingCharId] || { level: 1, xp: 0 };
    const nextXP = calculateNextXP(stats.level);
    const expectedXP = stats.xp + totalGain;
    const expectedPerc = Math.min(100, (expectedXP / nextXP) * 100);
    document.getElementById("xp-bar-expected").style.width = expectedPerc + "%";
}

function calculateNextXP(level) {
    return level * 1000;
}

function calculateXPPerc(stats) {
    const nextXP = calculateNextXP(stats.level);
    return Math.min(100, (stats.xp / nextXP) * 100);
}

function executeTraining() {
    playerData = loadPlayerData();
    const stats = playerData.charStats[currentTrainingCharId] || { level: 1, xp: 0 };

    let totalGain = 0;
    for (const key in useQuantities) {
        const amount = useQuantities[key];
        if (amount > 0) {
            totalGain += amount * xpValues[key];
            playerData.items[key] -= amount;
        }
    }

    if (totalGain === 0) return;

    stats.xp += totalGain;
    while (stats.xp >= calculateNextXP(stats.level)) {
        stats.xp -= calculateNextXP(stats.level);
        stats.level++;
    }

    playerData.charStats[currentTrainingCharId] = stats;
    savePlayerData(playerData);
    resetUseQuantities();
    renderTrainingView();
    alert(`育成完了！ レベルが ${stats.level} になりました。`);
}

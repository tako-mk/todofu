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

// ---- ユーティリティ ----

/** レアリティ別の最大レベルを返す。reformed=trueのとき上限解除(60) */
export function getMaxLevel(rarity, reformed) {
    if (reformed) return 60;
    const caps = { 1: 30, 2: 40, 3: 50, 4: 50 };
    return caps[rarity] ?? 50;
}

/**
 * キャラのbaseStats × レベルボーナス(0.01%/Lv)を計算して返す
 * 例: economy=70, level=30 → 70 × (1 + 0.0001×30) = 70.21
 */
export function calcEffectiveStats(charId, level) {
    const base = characters_flat[charId]?.stats;
    if (!base) return null;
    const bonus = 1 + 0.0001 * (level - 1);
    return {
        economy: (base.economy * bonus).toFixed(2),
        agriculture: (base.agriculture * bonus).toFixed(2),
        industry: (base.industry * bonus).toFixed(2),
        tourism: (base.tourism * bonus).toFixed(2)
    };
}

/** 4数値パネルのHTML文字列を返す（2×2グリッド） */
export function buildStatsPanelHTML(charId, level) {
    const s = calcEffectiveStats(charId, level);
    if (!s) return "";
    return `
        <div class="training-stats-panel">
            <div class="stat-cell"><span class="stat-label">💰 経済</span><span class="stat-value">${s.economy}</span></div>
            <div class="stat-cell"><span class="stat-label">🌾 農業</span><span class="stat-value">${s.agriculture}</span></div>
            <div class="stat-cell"><span class="stat-label">🏭 工業</span><span class="stat-value">${s.industry}</span></div>
            <div class="stat-cell"><span class="stat-label">🗺 観光</span><span class="stat-value">${s.tourism}</span></div>
        </div>
    `;
}

// ---- 初期化 ----

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
            renderNameFilterOptions();
            setFilterChangeCallback(() => {
                renderSelectionGrid();
            });
            filterPanel.style.display = "flex";
            filterPanel.style.zIndex = "1000";
        }
    });

    document.getElementById("btn-training-sort").addEventListener("pointerdown", () => {
        if (sortMode === "rarity") {
            sortMode = "level";
            document.getElementById("btn-training-sort").textContent = "↕ ソート: レベル順";
        } else if (sortMode === "level") {
            sortMode = "default";
            document.getElementById("btn-training-sort").textContent = "↕ ソート: デフォルト順";
        } else {
            sortMode = "rarity";
            document.getElementById("btn-training-sort").textContent = "↕ ソート: レアリティ順";
        }
        renderSelectionGrid();
    });

    document.getElementById("btn-confirm-training-selection").addEventListener("pointerdown", () => {
        if (tempSelectedCharId) {
            selectCharForTraining(tempSelectedCharId);
        }
    });

    document.getElementById("btn-execute-training").addEventListener("pointerdown", executeTraining);

    // 改革ボタン関連
    document.getElementById("btn-reform").addEventListener("pointerdown", showReformModal);
    document.getElementById("btn-cancel-reform").addEventListener("pointerdown", closeReformModal);
    document.getElementById("btn-confirm-reform").addEventListener("pointerdown", executeReform);
}

// ---- キャラ選択画面 ----

function renderSelectionGrid() {
    playerData = loadPlayerData();
    const grid = document.getElementById("training-selection-grid");
    grid.innerHTML = "";

    const canonicalIds = getAllCharacters().map(c => c.id);

    let list = (playerData.collection || []).map(id => {
        const stats = playerData.charStats[id] || { level: 1, xp: 0, reformed: false };
        return {
            id,
            ...characters_flat[id],
            prefName: getPrefNameByCharId(id),
            orderIndex: canonicalIds.indexOf(id),
            level: stats.level,
            reformed: stats.reformed
        };
    });

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
            list = [];
        }
    }

    if (sortMode === "rarity") {
        list.sort((a, b) => b.rarity - a.rarity || b.level - a.level || a.orderIndex - b.orderIndex);
    } else if (sortMode === "level") {
        list.sort((a, b) => b.level - a.level || b.rarity - a.rarity || a.orderIndex - b.orderIndex);
    } else {
        list.sort((a, b) => a.orderIndex - b.orderIndex);
    }

    list.forEach(char => {
        const charItem = document.createElement("div");
        charItem.className = "char-item" + (tempSelectedCharId === char.id ? " selected" : "");
        charItem.innerHTML = `
            <img src="${char.image}" alt="">
            <div class="grid-item-rarity${char.reformed ? ' reformed' : ''}">${"★".repeat(char.rarity)}</div>
            <div class="grid-item-level">Lv.${char.level}</div>
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
    const stats = playerData.charStats[charId] || { level: 1, xp: 0, reformed: false };
    const maxLv = getMaxLevel(char.rarity, stats.reformed);

    previewArea.innerHTML = `
        <div class="training-subtitle">${char.subtitle}</div>
        <div class="training-name" style="font-size: 28px;">${prefName}</div>
        <div class="preview-img-container">
            <img src="${char.image}" style="max-height: 200px; margin-bottom: 10px;">
            <div class="grid-item-rarity${stats.reformed ? ' reformed' : ''}">${"★".repeat(char.rarity)}</div>
        </div>
        <div class="training-level" style="margin-bottom: 5px;">Lv <span>${stats.level}</span><span class="level-max-label"> / ${maxLv}</span></div>
        ${buildStatsPanelHTML(charId, stats.level)}
    `;
    confirmBtn.disabled = false;
}

// ---- 育成画面 ----

function selectCharForTraining(charId) {
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
    const stats = playerData.charStats[currentTrainingCharId] || { level: 1, xp: 0, reformed: false };
    const prefName = getPrefNameByCharId(currentTrainingCharId);
    const maxLv = getMaxLevel(char.rarity, stats.reformed);

    document.getElementById("training-char-subtitle").textContent = char.subtitle;
    document.getElementById("training-char-name").textContent = prefName;

    const previewArea = document.getElementById("training-char-preview");
    const existingElements = previewArea.querySelectorAll("img, .preview-img-container, .training-level-row, .training-xp-bar-container, .training-xp-text, .training-stats-panel");
    existingElements.forEach(el => el.remove());

    const contentScroll = document.createElement("div");
    contentScroll.style.width = "100%";

    const atMax = stats.level >= maxLv;
    const isRarity4 = char.rarity === 4;
    const canReform = isRarity4 && stats.level >= 50 && !stats.reformed;

    contentScroll.innerHTML = `
        <div class="preview-img-container">
            <img src="${char.image}" alt="">
            <div class="grid-item-rarity${stats.reformed ? ' reformed' : ''}">${"★".repeat(char.rarity)}</div>
        </div>
        <div class="training-level-row">
            <div id="training-level-block" class="training-level">Lv <span id="training-current-lv">${stats.level}</span><span class="level-max-label"> / ${maxLv}</span></div>
            ${atMax ? '<div class="level-max-badge">MAX</div>' : ''}
            <div class="training-xp-bar-container" ${atMax ? 'style="display:none;"' : ''}>
                <div class="training-xp-bar-fill" style="width: ${atMax ? 100 : calculateXPPerc(stats)}%"></div>
                <div id="xp-bar-expected" class="training-xp-bar-expected" style="width: 0%"></div>
            </div>
        </div>
        <div id="training-xp-text" class="training-xp-text">${atMax ? "レベル最大" : `NEXT: ${calculateNextXP(stats.level) - stats.xp}`}</div>
        ${buildStatsPanelHTML(currentTrainingCharId, stats.level)}
    `;
    Array.from(contentScroll.children).forEach(child => previewArea.appendChild(child));

    // 改革ボタン表示制御
    const reformBtn = document.getElementById("btn-reform");
    if (isRarity4 && !stats.reformed) {
        reformBtn.style.display = "block";
        reformBtn.disabled = !canReform;
    } else {
        reformBtn.style.display = "none";
    }

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

    const stats = playerData.charStats[currentTrainingCharId] || { level: 1, xp: 0, reformed: false };
    const char = characters_flat[currentTrainingCharId];
    const maxLv = getMaxLevel(char.rarity, stats.reformed);
    const atMax = stats.level >= maxLv;

    if (!atMax) {
        // 現在のレベルと、シミュレートしたレベル・XPを計算
        let simLevel = stats.level;
        let simXp = stats.xp + totalGain;

        while (simLevel < maxLv && simXp >= calculateNextXP(simLevel)) {
            simXp -= calculateNextXP(simLevel);
            simLevel++;
        }

        const isSimAtMax = simLevel >= maxLv;

        // レベル数字の更新
        const lvSpan = document.getElementById("training-current-lv");
        if (lvSpan) {
            lvSpan.textContent = simLevel;
            // レベルが上がっていれば色を変える
            if (simLevel > stats.level) {
                lvSpan.style.color = "#ff5722";
                lvSpan.style.textShadow = "0 0 8px rgba(255,87,34,0.4)";
            } else {
                lvSpan.style.color = "";
                lvSpan.style.textShadow = "";
            }
        }

        // テキストの更新
        const textEl = document.getElementById("training-xp-text");
        if (textEl) {
            textEl.textContent = isSimAtMax ? "レベル最大" : `NEXT: ${calculateNextXP(simLevel) - simXp}`;
        }

        // バーの更新
        if (isSimAtMax) {
            document.getElementById("xp-bar-expected").style.width = "100%";
        } else {
            const nextXP = calculateNextXP(simLevel);
            // 元のレベルより上がっていれば元の緑バーは無視する形になるが、ここではシンプルに
            // 「現在到達しているシミュレートレベル」でのパーセンテージ幅をexpectedに設定する
            // (実際にはFILLが0になりEXPECTEDが伸びるような見せ方も可能だが、今回はEXPECTEDの幅だけを計算)
            const expectedPerc = Math.min(100, (simXp / nextXP) * 100);
            document.getElementById("xp-bar-expected").style.width = expectedPerc + "%";
            // 視覚的調整：もしレベルアップしている場合は、元のバーを0にするか、expectedを前面に出す
            document.querySelector(".training-xp-bar-fill").style.width = (simLevel > stats.level) ? "0%" : calculateXPPerc(stats) + "%";
        }
    } else {
        document.getElementById("xp-bar-expected").style.width = "0%";
        document.getElementById("btn-execute-training").disabled = true;
    }

}

/** XPを加算した後のレベルをシミュレートする */
function simulateLevelAfterGain(stats, totalGain, maxLv) {
    let level = stats.level;
    let xp = stats.xp + totalGain;
    while (level < maxLv && xp >= calculateNextXP(level)) {
        xp -= calculateNextXP(level);
        level++;
    }
    return level;
}

function calculateNextXP(level) {
    return level * 1000;
}

function calculateXPPerc(stats) {
    const nextXP = calculateNextXP(stats.level);
    return Math.min(100, (stats.xp / nextXP) * 100);
}

// ---- 育成実行 ----

function executeTraining() {
    playerData = loadPlayerData();
    const stats = playerData.charStats[currentTrainingCharId] || { level: 1, xp: 0, reformed: false };
    const char = characters_flat[currentTrainingCharId];
    const maxLv = getMaxLevel(char.rarity, stats.reformed);

    if (stats.level >= maxLv) return;

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
    while (stats.level < maxLv && stats.xp >= calculateNextXP(stats.level)) {
        stats.xp -= calculateNextXP(stats.level);
        stats.level++;
    }
    // レベルが上限に達したらxpをリセット
    if (stats.level >= maxLv) {
        stats.xp = 0;
    }

    playerData.charStats[currentTrainingCharId] = stats;
    savePlayerData(playerData);
    resetUseQuantities();
    renderTrainingView();
    alert(`育成完了！ レベルが ${stats.level} になりました。`);
}

// ---- 改革 ----

function showReformModal() {
    if (!currentTrainingCharId) return;
    playerData = loadPlayerData();
    const stats = playerData.charStats[currentTrainingCharId] || { level: 1, xp: 0, reformed: false };
    const char = characters_flat[currentTrainingCharId];

    if (char.rarity !== 4) return;
    if (stats.level < 50) return;
    if (stats.reformed) return;

    const reformItems = playerData.items["reform_ticket"] || 0;

    document.getElementById("reform-item-before").textContent = reformItems;
    document.getElementById("reform-item-after").textContent = Math.max(0, reformItems - 1);

    const confirmBtn = document.getElementById("btn-confirm-reform");
    if (reformItems < 1) {
        confirmBtn.disabled = true;
        confirmBtn.style.opacity = "0.5";
    } else {
        confirmBtn.disabled = false;
        confirmBtn.style.opacity = "1";
    }

    document.getElementById("reform-confirm-modal").style.display = "flex";
}

function closeReformModal() {
    document.getElementById("reform-confirm-modal").style.display = "none";
}

function executeReform() {
    if (!currentTrainingCharId) return;
    playerData = loadPlayerData();
    const stats = playerData.charStats[currentTrainingCharId] || { level: 1, xp: 0, reformed: false };
    const reformItems = playerData.items["reform_ticket"] || 0;

    if (reformItems < 1) {
        alert("改革条例案が不足しています！");
        return;
    }

    stats.reformed = true;
    playerData.items["reform_ticket"] = reformItems - 1;
    playerData.charStats[currentTrainingCharId] = stats;
    savePlayerData(playerData);

    closeReformModal();
    renderTrainingView();
    alert("改革が完了しました！ レベル上限が60に解放されました。");
}

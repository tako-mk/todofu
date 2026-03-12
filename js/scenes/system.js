import { loadPlayerData, savePlayerData, resetPlayerData } from "../data/save.js";
import { characters as characters_flat } from "../data/characters_flat.js";
import { openCharSelect } from "./todofu.js";
import { getPrefNameByCharId } from "../data/characterUtil.js";
import { initHome } from "./home.js";

export function initSystemMenu() {
    const btnMenu = document.getElementById("btn-system-menu");
    const menuModal = document.getElementById("system-menu-modal");
    const closeBtn = document.getElementById("btn-close-system-menu");

    const btnOpenProfile = document.getElementById("btn-open-profile");
    const btnResetData = document.getElementById("btn-reset-data");
    const resetConfirmModal = document.getElementById("reset-confirm-modal");
    const btnResetCancel = document.getElementById("btn-reset-cancel");
    const btnResetConfirm = document.getElementById("btn-reset-confirm");

    const profileModal = document.getElementById("profile-modal");
    const closeProfileBtn = document.getElementById("btn-close-profile");

    const nameInput = document.getElementById("profile-name-input");
    const commentInput = document.getElementById("profile-comment-input");
    const btnChangeFavorite = document.getElementById("btn-change-favorite");

    // メニュー開閉
    btnMenu.addEventListener("pointerdown", () => {
        menuModal.style.display = "flex";
    });

    closeBtn.addEventListener("pointerdown", () => {
        menuModal.style.display = "none";
    });

    // プロフィール開閉
    btnOpenProfile.addEventListener("pointerdown", () => {
        menuModal.style.display = "none";
        profileModal.style.display = "flex";
        renderProfile();
    });

    closeProfileBtn.addEventListener("pointerdown", () => {
        profileModal.style.display = "none";
    });

    // データリセット
    btnResetData.addEventListener("pointerdown", () => {
        menuModal.style.display = "none";
        resetConfirmModal.style.display = "flex";
    });

    btnResetCancel.addEventListener("pointerdown", () => {
        resetConfirmModal.style.display = "none";
    });

    btnResetConfirm.addEventListener("pointerdown", () => {
        resetPlayerData();
        window.location.reload();
    });

    // 名前入力
    nameInput.addEventListener("change", (e) => {
        const data = loadPlayerData();
        data.profile.name = e.target.value.trim() || data.profile.name;
        savePlayerData(data);
    });

    // ひとこと入力
    commentInput.addEventListener("change", (e) => {
        const data = loadPlayerData();
        data.profile.comment = e.target.value.trim();
        savePlayerData(data);
    });

    // お気に入り変更
    btnChangeFavorite.addEventListener("pointerdown", () => {
        openCharSelect(null, (charId) => {
            const data = loadPlayerData();
            data.profile.favoriteCharId = charId;
            savePlayerData(data);
            renderProfile(); // 再描画
            initHome();      // ホーム画面のキャラも更新
        });
    });

    // 表示編成切り替え
    const formationTabs = document.querySelectorAll(".mini-tab");
    formationTabs.forEach(tab => {
        tab.addEventListener("pointerdown", (e) => {
            const data = loadPlayerData();
            const idx = parseInt(e.currentTarget.dataset.idx);
            data.profile.displayFormationIdx = idx;
            savePlayerData(data);
            renderProfile();
        });
    });

    // モーダルの外側をクリックして閉じる
    [menuModal, profileModal, resetConfirmModal].forEach(modal => {
        modal.addEventListener("pointerdown", (e) => {
            if (e.target === modal) {
                modal.style.display = "none";
            }
        });
    });
}

export function renderProfile() {
    const playerData = loadPlayerData();
    const profile = playerData.profile;

    // 名前・コメント
    document.getElementById("profile-name-input").value = profile.name;
    document.getElementById("profile-comment-input").value = profile.comment;

    // お気に入りキャラ
    const favContainer = document.getElementById("profile-favorite-char");
    const favRarity = document.getElementById("profile-fav-rarity");
    const favSubtitle = document.getElementById("profile-fav-subtitle");
    const favName = document.getElementById("profile-fav-name");

    favContainer.innerHTML = "";
    favRarity.textContent = "";
    favSubtitle.textContent = "";
    favName.textContent = "";

    if (profile.favoriteCharId) {
        const char = characters_flat[profile.favoriteCharId];
        const stats = playerData.charStats[profile.favoriteCharId] || { reformed: false };
        if (char) {
            favContainer.innerHTML = `
                <div class="preview-img-container">
                    <img src="${char.image}" alt="">
                    <div class="grid-item-rarity${stats.reformed ? ' reformed' : ''}">${"★".repeat(char.rarity)}</div>
                </div>
            `;
            favSubtitle.textContent = char.subtitle;
            favName.textContent = getPrefNameByCharId(profile.favoriteCharId);
        }
    }

    // 表示編成タブのアクティブ状態
    const formationIdx = profile.displayFormationIdx || 0;
    document.querySelectorAll(".mini-tab").forEach(tab => {
        if (parseInt(tab.dataset.idx) === formationIdx) {
            tab.classList.add("active");
        } else {
            tab.classList.remove("active");
        }
    });

    // 表示編成グリッド
    const formationGrid = document.getElementById("profile-formation-display");
    formationGrid.innerHTML = "";

    const team = playerData.formations[formationIdx];

    team.forEach(charId => {
        const slot = document.createElement("div");
        slot.className = "profile-formation-slot";

        if (charId) {
            const char = characters_flat[charId];
            const stats = playerData.charStats[charId] || { reformed: false };
            if (char) {
                const img = document.createElement("img");
                img.src = char.image;
                slot.appendChild(img);

                const rarity = document.createElement("div");
                rarity.className = "grid-item-rarity" + (stats.reformed ? " reformed" : "");
                rarity.textContent = "★".repeat(char.rarity);
                slot.appendChild(rarity);
            }
        }

        formationGrid.appendChild(slot);
    });
}

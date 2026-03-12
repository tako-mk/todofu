import { characters as characters_flat } from "../data/characters_flat.js";
import { loadPlayerData } from "../data/save.js";

export function initHome() {
    const data = loadPlayerData();
    const favId = data.profile ? data.profile.favoriteCharId : data.character;
    const char = characters_flat[favId];

    const img = document.querySelector(".player-character");
    if (img && char) img.src = char.image;

    // UI更新
    const moneyEl = document.querySelector("#home-money-display span");
    const diamondEl = document.querySelector("#home-diamond-display span");
    if (moneyEl) moneyEl.textContent = data.money;
    if (diamondEl) diamondEl.textContent = data.diamond;
}

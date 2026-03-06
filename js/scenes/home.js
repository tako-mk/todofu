// js/scenes/home.js
import { characters } from "../data/characters.js";
import { loadPlayerData } from "../data/save.js";

export function initHome() {
    const data = loadPlayerData();
    const char = characters[data.character];

    const img = document.querySelector(".player-character");
    if (img && char) img.src = char.image;

    // UI更新
    const moneyEl = document.getElementById("home-money-display");
    const diamondEl = document.getElementById("home-diamond-display");
    if (moneyEl) moneyEl.textContent = `💰 ${data.money}`;
    if (diamondEl) diamondEl.textContent = `💎 ${data.diamond}`;
}

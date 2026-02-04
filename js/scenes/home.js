// js/scenes/home.js
import { characters } from "../data/characters.js";
import { loadPlayerData } from "../data/save.js";

export function initHome() {
    const data = loadPlayerData();
    const char = characters[data.character];

    const img = document.querySelector(".player-character");
    img.src = char.image;
}

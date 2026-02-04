// js/data/save.js
export function savePlayerData(data) {
    localStorage.setItem("todofu_save", JSON.stringify(data));
}

export function loadPlayerData() {
    return JSON.parse(localStorage.getItem("todofu_save")) || {
        character: "hokkaido",
        money: 1200,
        diamond: 35
    };
}

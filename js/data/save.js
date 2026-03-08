// js/data/save.js
export function savePlayerData(data) {
    localStorage.setItem("todofu_save", JSON.stringify(data));
}

export function loadPlayerData() {
    const defaultData = {
        character: "hokkaido_a",
        money: 1200,
        diamond: 5000,
        collection: [],
        formations: [
            [null, null, null, null, null],
            [null, null, null, null, null],
            [null, null, null, null, null],
            [null, null, null, null, null],
            [null, null, null, null, null]
        ],
        profile: {
            name: "とどーふマスター",
            comment: "日本全国制覇を目指しています！",
            favoriteCharId: "hokkaido_a",
            displayFormationIdx: 0
        },
        items: {
            "training_platinum": 1,
            "training_gold": 2,
            "training_silver": 5,
            "training_bronze": 10
        },
        charStats: {} // { charId: { level: 1, xp: 0 } }
    };

    const saved = JSON.parse(localStorage.getItem("todofu_save"));
    if (!saved) return defaultData;

    // 既存のセーブデータがある場合、足りないキーを補完する
    return {
        ...defaultData,
        ...saved
    };
}
export function resetPlayerData() {
    localStorage.removeItem("todofu_save");
}

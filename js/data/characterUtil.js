import { characters } from "./characters.js";

export function getAllCharacters() {
    const list = [];
    for (const pref of Object.values(characters)) {
        for (const char of Object.values(pref.characters)) {
            list.push(char);
        }
    }
    return list;
}

export function getCharacterById(id) {
    for (const pref of Object.values(characters)) {
        for (const char of Object.values(pref.characters)) {
            if (char.id === id) {
                return char;
            }
        }
    }
    return null;
}

export function getPrefNameByCharId(charId) {
    for (const [prefKey, prefData] of Object.entries(characters)) {
        for (const charKey of Object.keys(prefData.characters)) {
            if (prefData.characters[charKey].id === charId) {
                return prefData.name;
            }
        }
    }
    return "";
}

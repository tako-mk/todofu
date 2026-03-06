import { gachaPools } from "./gachaPools.js";
import { characters } from "./characters_flat.js";

// Cache for grouped characters by rarity
let characterPoolCache = null;

function getCharacterPools() {
    if (characterPoolCache) return characterPoolCache;

    const pools = { 1: [], 2: [], 3: [], 4: [] };

    for (const char of Object.values(characters)) {
        if (pools[char.rarity]) {
            pools[char.rarity].push(char);
        }
    }
    characterPoolCache = pools;
    return pools;
}

export function rollCharacter(gachaType) {
    const config = gachaPools[gachaType];
    if (!config) return null;

    // Stage 1: Rarity Draw
    const rarityRand = Math.random() * 100;
    let raritySum = 0;
    let selectedRarity = 1;

    for (const [rarity, rate] of Object.entries(config.rarityRates)) {
        raritySum += rate;
        if (rarityRand < raritySum) {
            selectedRarity = parseInt(rarity);
            break;
        }
    }

    // Stage 2: Character Draw
    const allPools = getCharacterPools();
    const rarityPool = allPools[selectedRarity];
    if (!rarityPool || rarityPool.length === 0) return null;

    // Pickup logic (only applies to Rarity 4 for now as per requirements)
    if (selectedRarity === 4 && config.pickups.length > 0) {
        const pickupRand = Math.random() * config.rarityRates[4];
        if (pickupRand < config.pickupRate) {
            // Draw from pickups
            const idx = Math.floor(Math.random() * config.pickups.length);
            const pickupId = config.pickups[idx];
            return characters[pickupId] || rarityPool[0];
        } else {
            // Draw from non-pickups in the same rarity
            const nonPickups = rarityPool.filter(c => !config.pickups.includes(c.id));
            if (nonPickups.length > 0) {
                return nonPickups[Math.floor(Math.random() * nonPickups.length)];
            }
        }
    }

    // Default: Uniform draw from the rarity pool
    return rarityPool[Math.floor(Math.random() * rarityPool.length)];
}

export function drawGacha(gachaType, count) {
    const result = [];
    for (let i = 0; i < count; i++) {
        const char = rollCharacter(gachaType);
        if (char) {
            result.push({
                character: char,
                rarity: "☆" + char.rarity
            });
        }
    }
    return result;
}

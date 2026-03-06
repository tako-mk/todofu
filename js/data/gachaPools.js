export const gachaPools = {
    normal: {
        rarityRates: {
            1: 50.0,
            2: 45.0,
            3: 4.8,
            4: 0.2
        },
        pickups: [],
        pickupRate: 0
    },
    pickup: {
        rarityRates: {
            1: 50.0,
            2: 45.0,
            3: 3.0,
            4: 2.0
        },
        pickups: ["hokkaido_e", "akita_d"], // Example pickup characters
        pickupRate: 1.0 // Total rate for pickup characters within Rarity 4 (e.g., 1.0% out of 2.0%)
    },
    event: {
        rarityRates: {
            1: 50.0,
            2: 40.0,
            3: 7.5,
            4: 2.5
        },
        pickups: ["hokkaido_f", "aomori_e"], // Example event characters
        pickupRate: 1.5 // Total rate for pickup characters within Rarity 4
    }
};

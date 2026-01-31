const loading = document.getElementById("loading-screen");
const loadingText = loading.querySelector(".loading-text");
const tipsText = loading.querySelector(".tips-text");

const tips = [
    "北海道はでっかいどう",
    "静岡と山梨は仲が悪い！",
    "沖縄は小さいが戦力は高い！",
    "各とどーふの特徴を理解しよう！"
];

let dot = 1;
let dotTimer = null;
let tipsTimer = null;

export function startLoading() {
    loading.classList.add("active");

    loadingText.textContent = "Now loading.";

    dotTimer = setInterval(() => {
        dot = dot % 3 + 1;
        loadingText.textContent = "Now loading" + ".".repeat(dot);
    }, 500);

    tipsText.textContent = tips[0];
    let i = 0;
    tipsTimer = setInterval(() => {
        tipsText.style.opacity = 0;

        setTimeout(() => {
            i = (i + 1) % tips.length;
            tipsText.textContent = tips[i];
            tipsText.style.opacity = 1;
        }, 200);

    }, 2500);

}

export function hideLoading() {
    loading.classList.remove("active");
    clearInterval(dotTimer);
    clearInterval(tipsTimer);
}

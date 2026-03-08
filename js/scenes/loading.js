const loading = document.getElementById("loading-screen");
const tipsText = loading.querySelector(".tips-text");

const tips = [
    "北海道はでっかいどう",
    "東京は人が多い！",
    "温泉地は回復に優れている！",
    "静岡と山梨は仲が悪い！",
    "沖縄は小さいが力は強い！",
    "各とどーふの特徴を理解しよう！"
];

let tipsTimer = null;

export function startLoading() {
    loading.classList.add("active");

    // 重複をさけるため前回と同じものは選ばないようにする
    let prevIndex = Math.floor(Math.random() * tips.length);
    tipsText.textContent = tips[prevIndex];

    tipsTimer = setInterval(() => {
        tipsText.style.opacity = 0;

        setTimeout(() => {
            let nextIndex;
            do {
                nextIndex = Math.floor(Math.random() * tips.length);
            } while (nextIndex === prevIndex && tips.length > 1);

            prevIndex = nextIndex;
            tipsText.textContent = tips[nextIndex];
            tipsText.style.opacity = 1;
        }, 200);

    }, 2500);

}

export function hideLoading() {
    loading.classList.remove("active");
    clearInterval(tipsTimer);
}

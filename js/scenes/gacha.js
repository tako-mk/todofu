// js/scenes/gacha.js

export function initGacha() {
    const listItems = document.querySelectorAll(".gacha-list-item");
    const previewText = document.querySelector(".gacha-placeholder-text");
    const previewImg = document.getElementById("gacha-preview-img");

    listItems.forEach(item => {
        item.addEventListener("pointerdown", (e) => {
            // 他の要素から active を外す
            listItems.forEach(i => i.classList.remove("active"));
            // クリックされた要素に active をつける
            e.currentTarget.classList.add("active");

            const gachaName = e.currentTarget.textContent;

            // 右側のプレビュー切り替えロジック
            if (gachaName === "ノーマルガチャ") {
                // ノーマルガチャの場合、画像を表示してテキストを隠す
                if (previewImg) {
                    previewImg.src = "assets/images/normal_gacha.png";
                    previewImg.style.display = "block";
                }
                if (previewText) previewText.style.display = "none";
            } else {
                // それ以外（未作成）の場合、画像を隠してテキストを表示する
                if (previewImg) previewImg.style.display = "none";
                if (previewText) {
                    previewText.style.display = "block";
                    previewText.textContent = `${gachaName}（未作成）`;
                }
            }
        });
    });
}

import { initTitle, hideTitle } from "./scenes/title.js";
import { startLoading, hideLoading } from "./scenes/loading.js";

let started = false;

function startFlow() {
    if (started) return;
    started = true;

    hideTitle();

    setTimeout(() => {
        startLoading();

            // 仮ロード時間（実際はここで画像・音声などロード）
            setTimeout(() => {
                hideLoading();
                startGame();
            }, 6000);

    }, 600); // フェードアウト時間
}

function startGame() {
    console.log("GAME START");
    // ここで game.js の initGame() を呼ぶ想定
}

document.addEventListener("keydown", startFlow);
document.addEventListener("click", startFlow);

initTitle();

// ==============================
// main.js
// ゲーム全体の流れと画面スケーリングを管理
// ==============================

import { initTitle, hideTitle } from "./scenes/title.js";
import { startLoading, hideLoading } from "./scenes/loading.js";

// ゲーム開始済みフラグ（多重起動防止）
let started = false;

// 基準解像度（16:9 固定）
const BASE_WIDTH = 1280;
const BASE_HEIGHT = 720;

/**
 * 画面サイズに応じてゲーム画面を等倍スケーリング
 * アスペクト比 16:9 を維持したまま最大表示
 */
function resizeGame() {
    const scale = Math.min(
        window.innerWidth / BASE_WIDTH,
        window.innerHeight / BASE_HEIGHT
    );

    const root = document.getElementById("game-root");
    root.style.transform = `scale(${scale})`;
}

/**
 * タイトル → ローディング → ゲーム開始
 * までの全体フローを制御
 */
function startFlow() {
    if (started) return; // 二重起動防止
    started = true;

    // タイトル画面をフェードアウト
    hideTitle();

    // フェード完了後にローディング開始
    setTimeout(() => {
        startLoading();

        // 仮ロード時間（実際はここで画像・音声などのロードを行う）
        setTimeout(() => {
            hideLoading();
            startGame();
        }, 6000);

    }, 600); // タイトルフェード時間
}

/**
 * ゲーム本編スタート
 * 今後 game.js の initGame() を呼ぶ想定
 */
function startGame() {
    console.log("GAME START");
    // initGame();
}

// リサイズ時にスケーリングを更新
window.addEventListener("resize", resizeGame);
resizeGame();

// 入力受付（クリック or キー入力で開始）
document.addEventListener("keydown", (e) => {
    if (e.code === "Enter" || e.code === "Space") {
        startFlow();
    }
});
document.addEventListener("click", startFlow);

// タイトル初期化
initTitle();

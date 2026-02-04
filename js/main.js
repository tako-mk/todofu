// ==============================
// main.js
// ゲーム全体の流れと画面スケーリングを管理
// ==============================

import { initTitle, hideTitle } from "./scenes/title.js";
import { startLoading, hideLoading } from "./scenes/loading.js";
import { initHome } from "./scenes/home.js";

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

const titleScreen = document.getElementById("title-screen");
const loadingScreen = document.getElementById("loading-screen");
const homeScreen = document.getElementById("home-screen");

function showScreen(name) {
    // 全部一旦非表示
    titleScreen.style.display = "none";
    loadingScreen.classList.remove("active");
    homeScreen.style.display = "none";

    // 指定画面だけ表示
    if (name === "title") titleScreen.style.display = "flex";
    if (name === "loading") loadingScreen.classList.add("active");
    if (name === "home") homeScreen.style.display = "flex";
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
        showScreen("loading");
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
    initHome();
    showScreen("home");
    // initGame();
}

// リサイズ時にスケーリングを更新
window.addEventListener("resize", resizeGame);
resizeGame();

// 入力受付
document.addEventListener("keydown", (e) => {
    if (e.repeat) return;
    if (e.code === "Enter" || e.code === "Space") {
        startFlow();
    }
});
titleScreen.addEventListener("pointerdown", startFlow);

// タイトル初期化
showScreen("title");
initTitle();

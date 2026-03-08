// ==============================
// main.js
// ゲーム全体の流れと画面スケーリングを管理
// ==============================

import { initTitle, hideTitle } from "./scenes/title.js";
import { startLoading, hideLoading } from "./scenes/loading.js";
import { initHome } from "./scenes/home.js";
import { initGacha } from "./scenes/gacha.js";
import { initTodofu } from "./scenes/todofu.js";
import { initSystemMenu } from "./scenes/system.js";
import { initTraining } from "./scenes/training.js";

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
const gachaScreen = document.getElementById("gacha-screen");
const todofuScreen = document.getElementById("todofu-screen");

function showScreen(name) {
    // 全部一旦非表示
    titleScreen.style.display = "none";
    loadingScreen.classList.remove("active");
    homeScreen.style.display = "none";
    if (gachaScreen) gachaScreen.style.display = "none";
    if (todofuScreen) todofuScreen.style.display = "none";

    // 指定画面だけ表示
    if (name === "title") titleScreen.style.display = "flex";
    if (name === "loading") loadingScreen.classList.add("active");
    if (name === "home") homeScreen.style.display = "flex";
    if (name === "gacha") gachaScreen.style.display = "flex";
    if (name === "todofu") todofuScreen.style.display = "flex";
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

/**
 * 汎用的なローディング遷移関数
 */
function transitionTo(targetScreen, loadTime = 2000) {
    showScreen("loading");
    startLoading();

    setTimeout(() => {
        hideLoading();
        showScreen(targetScreen);
    }, loadTime);
}

// リサイズ時にスケーリングを更新
window.addEventListener("resize", resizeGame);
resizeGame();

// イベントリスナーの登録
document.addEventListener("keydown", (e) => {
    if (e.repeat) return;
    if (e.code === "Enter" || e.code === "Space") {
        startFlow();
    }
});
titleScreen.addEventListener("pointerdown", startFlow);

// ガチャボタン
const btnGacha = document.getElementById("btn-gacha");
if (btnGacha) {
    btnGacha.addEventListener("pointerdown", () => {
        transitionTo("gacha", 1500); // 1.5秒ローディングしてガチャ画面へ
    });
}

// ガチャ画面から戻る
const btnGachaBack = document.getElementById("btn-gacha-back");
if (btnGachaBack) {
    btnGachaBack.addEventListener("pointerdown", () => {
        transitionTo("home", 1000); // 1.0秒ローディングしてホーム画面へ
    });
}

// とどーふボタン
const btnTodofu = document.getElementById("btn-todofu");
if (btnTodofu) {
    btnTodofu.addEventListener("pointerdown", () => {
        transitionTo("todofu", 1800);
    });
}

// とどーふ画面からの戻り（カスタムイベント）
window.addEventListener("transition-to-home", () => {
    transitionTo("home", 1000);
});

// タイトル初期化
showScreen("title");
initTitle();
initGacha();
initTodofu();
initSystemMenu();
initTraining();

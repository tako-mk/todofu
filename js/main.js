const title = document.getElementById("title-screen");
const canvas = document.getElementById("game");

function startGame() {
    title.style.display = "none";
    canvas.style.display = "block";
    initGame();
}

function initGame() {
    const ctx = canvas.getContext("2d");
    canvas.width = 800;
    canvas.height = 600;

    ctx.fillStyle = "white";
    ctx.font = "32px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Game Start!", 400, 300);
}

document.addEventListener("keydown", startGame);
document.addEventListener("click", startGame);

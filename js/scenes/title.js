const title = document.getElementById("title-screen");

export function initTitle() {
    title.style.opacity = "1";
}

export function hideTitle() {
    title.style.transition = "opacity 1s";
    title.style.opacity = "0";

    setTimeout(() => {
        title.style.display = "none";
    }, 600);
}

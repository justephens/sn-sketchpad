
document.addEventListener("DOMContentLoaded", function(event) {
    let tb_selector = document.getElementById("toolbox-selector");
    let tb_text = document.getElementById("toolbox-text")
    let tb_draw = document.getElementById("toolbox-draw")

    // Default toolbar configuration
    tb_selector.selectedIndex = 0;
    tb_text.style.display = "block";
    tb_draw.style.display = "none";

    // Enchange toolboxes on selector updates
    tb_selector.onchange = function(event) {
        tb_text.style.display = (event.target.value == "text") ? "block" : "none";
        tb_draw.style.display = (event.target.value == "draw") ? "block" : "none";
    }
});
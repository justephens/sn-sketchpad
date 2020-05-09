/// interface.js
///
/// Manages the user interface, including swapping between toolboxes in the
/// toolbar and binding the interface buttons to actions

import {SketchPad, TextElement} from "./sketchpad.js";


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

    // Utility Functions
    document.getElementById("util-export").onclick = function() {
        var json = SketchPad.exportNoteJSON()

        var blob = new Blob([json], {type: 'txt'});
        if(window.navigator.msSaveBlob) {
            window.navigator.msSaveBlob(blob, "export");
        }
        else{
            var elem = window.document.createElement('a');
            elem.href = window.URL.createObjectURL(blob);
            elem.download = "export";
            elem.click();
        }
    }
    document.getElementById("util-import").onclick = function() {
        
    }

    // Bind toolbar buttons to TextElement methods
    //document.getElementById("tb-bold").onclick = TextElement.toggleFormatOption("bold");
});
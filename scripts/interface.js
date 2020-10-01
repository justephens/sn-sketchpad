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

        // Update the Interface members
        Interface.active_toolbox = event.target.value;
        Interface.active_tool = null;
    }

    // Draw toolbox buttons
    document.getElementById("tb-draw-pen").onclick = function(event) {
        Interface.active_tool = "pen";
    }
    document.getElementById("tb-draw-erase").onclick = function(event) {
        Interface.active_tool = "erase";
    }

    // Utility Functions
    document.getElementById("util-export").onclick = function() {
        var json = SketchPad.exportNoteJSON();

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
        let text_field = document.getElementById("util-import-text");
        SketchPad.importNoteJSON(text_field.value);
    }

    // Bind toolbar buttons to TextElement methods
    //document.getElementById("tb-bold").onclick = TextElement.toggleFormatOption("bold");
});

/// A static class that can be used in other portions of the codebase to
/// interact with the user interface.
export class Interface {

    /// Holds which of the toolboxes is active in the toolbar
    /// Valid values: ["text", "draw"]
    static active_toolbox = "text";

    /// Holds the active tool in use by the user. Null if no tool is selected.
    /// Valid values: [null, "pen", "erase"]
    static active_tool = null;

    /// Return an object holding the style attributes fetched from the interface
    static GetDrawStyle() {
        return {
            "color": "#333",
            "size": Number(document.getElementById("tb-draw-size").value),
            "fill": "none",
        };
    }

}
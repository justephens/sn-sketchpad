/// pencil.js
///
/// Implements the text tool, which allows users to insert and edit text held
/// within text boxes.
/// 
/// Layout of elements[]:
/// "text": {
///     { id, { x, y, "contents" } }, ...
/// }

import { SketchPad } from "../sketchpad.js";

export var tool = {
    name:           "Text",
    tooltip:        "Write and edit",
    tool_down:      CreateTextBox,
    tool_up:        null,
    tool_move:      null,
    tool_context:   null,
    sp_redraw:      null,
    sp_init:        Init,
    sp_recache:     null,
}

var sp = null;          // Reference to SketchPad

function Init() {
    console.log("Init text");
    sp = new SketchPad();

    document.getElementById("text_toolbar").style.display = 'none';
}

function CreateTextBox(event) {
    console.log("Create Text Box");
    
    let textdiv = document.createElement("div");
    textdiv.className = "textbox";
    textdiv.id = "textbox";
    textdiv.style.top = "100px";
    textdiv.style.left = "32px";
    textdiv.style.width = "400px";
    textdiv.style.height = "300px";
    document.getElementById("sp_contents").append(textdiv);

    var quill = new Quill('#textbox', {
        modules: {
          toolbar: '#text_toolbar'
        },
        placeholder: 'Compose an epic...',
        theme: 'snow'
    });
}
/// app.js
///
/// Handles the top-level operations of Sketchpad, namely communicating with
/// the Standard Notes API.

import * as sp from "./sketchpad.js";
import { tool as pencil } from "./tools/pencil.js";

// On load
document.addEventListener('DOMContentLoaded', function(event) {
    
    sp.initializeSketchpad()
    sp.tools.push(pencil);
});

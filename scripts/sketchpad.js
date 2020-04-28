/// sketchpad.js
/// 
/// Manages the content on the Sketchpad. References to "Sketchpad" in
/// documentation are referring to this managing file.

export var canvas = null;   // Canvas DOM object
export var ctx = null;      // 2D rendering context
export var elements = {};   // Holds sketchpad elements, subdivided by tool

// List of tools
export var tools = [
    {
        name:           "Default",
        tooltip:        "Select and move elements",
        tool_down:      null,   // Handle mouse down event
        tool_move:      null,   //    ... mouse move event
        tool_up:        null,   //    ... mouse up event
        tool_context:   null,   // Handles right-click context menu
        sp_init:        null,   // Called with application is initialized
        sp_activate:    null,   // Called when switching to tool
        sp_deactivate:  null,   // Called when switching from tool
        sp_refresh:     null,   // Called when application is re-rendering
        sp_save:        null,   // Called when application is preparing to save
    }
];
var activeTool = tools[0];


/// Initializes the Sketchpad
export function initializeSketchpad() {    
    canvas = document.getElementById("sp_canvas");
    canvas.width = screen.width;
    canvas.height = screen.height * 2;
    ctx = canvas.getContext("2d");

    // Default render style
    restoreRenderProperties({
        fillStyle: '#333',
        lineWidth: 3,
    });

    // Event bindings
    canvas.onmousedown = function () {
        if (activeTool.tool_down)
            activeTool.tool_down(event);
    }
    canvas.onmousemove = function () {
        if (activeTool.tool_move)
            activeTool.tool_move(event);
    }
    canvas.onmouseup = function () {
        if (activeTool.tool_up)
            activeTool.tool_up(event);
    }
    canvas.oncontextmenu = function () {
        if (activeTool.tool_context) {
            activeTool.tool_context(event);
            return false;
        }
        return true;
    }

    // Button actions
    document.getElementById("sp_check").onclick = function () {
        activeTool = tools[0];
    }
    document.getElementById("sp_pencil").onclick = function () {
        activeTool = tools[1];
    }
    document.getElementById("sp_eraser").onclick = function () {
        console.log(elements);
    }
}


/// Adds the given element to the sketchpad, belonging to the given tool with
/// the given name
export function addElement(tool, elem) {
    var id = 0;
    if (!elements[tool]) elements[tool] = [];
    else id = Object.values(elements[tool][elements[tool].length-1])[0]+1;
    elements[tool].push( { id, elem } );

    console.log("Adding element "+tool+"."+id+" :: "+elem);
}

/// Returns the element belonging to the given tool with the given ID
export function getElement(tool, elemID) {

}

/// Returns all the elements belonging to the given tool
export function getAllElements(tool) {

}

/// Removes the given element
export function removeElement(tool, elemId) {

}

/// Clears the canvas and refreshes each tool (allows them to rerender)
export function refresh() {
    console.log("Refresh");

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    for (var i = 0; i < tools.length; i++)
        if (tools[i].sp_refresh)
            tools[i].sp_refresh();
}

/// Returns an object holding all of the current values of various properties
/// of the CanvasRenderingContext2D
export function getRenderProperties() {
    return {
        fillStyle:  ctx.fillStyle,
        lineWidth:  ctx.lineWidth,
    }
}

/// Takes the given render properties object and sets the values of the 
/// CanvasRenderingContext2D to match those given
export function restoreRenderProperties(prop) {
    ctx.fillStyle = prop.fillStyle;
    ctx.lineWidth = prop.lineWidth;
}
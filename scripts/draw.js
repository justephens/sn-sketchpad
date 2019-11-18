/// Draw.js
/// 
/// Contains all the drawing and canvas related functionality of Sketchpad.

/// A list of all glyphs in note
var glyphHistory = new Array(); 
/// The glyph currently being draw. null if user is not drawing
var glyph = null;

/// Starts tracking glyph once mouse is pressed on the canvas
function mouseDown(event) {
    glyph = new Array();
    glyph.push(event.offsetX);
    glyph.push(event.offsetY);
}

/// Ends tracking glyph if mouse is released on canvas
function mouseUp() {
    if (glyph == null) return;

    glyphHistory.push(simplifyGlyph(glyph));
    glyph = null;
}

/// As the glyph is drawn, add change is coordinates to our array, which will
/// be saved.
function mouseMove(event) {
    if (glyph != null) {
        glyph.push(event.offsetX - mouseMove.prevX);
        glyph.push(event.offsetY - mouseMove.prevY);
        
        ctx.beginPath();
        ctx.moveTo(mouseMove.prevX, mouseMove.prevY);
        ctx.lineTo(event.offsetX, event.offsetY);
        ctx.stroke();
    }

    mouseMove.prevX = event.offsetX;
    mouseMove.prevY = event.offsetY;
}

/// Clears the canvas and redraws all glyphs (paths)
function refresh() {
    console.log("Refresh");

    var ogStyle = ctx.fillStyle;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.fillStyle = ogStyle;

    for (i = 0; i < glyphHistory.length; i++) {
        ctx.stroke(arrayToPath2D(glyphHistory[i]));
    }
}

/// Takes our arrays of points and converts it to an SVG path, then to a Path2D
/// which can be drawn
function arrayToPath2D(arr) {
    var svg = ""
    svg += "M " + arr[0] + " " + arr[1] + " ";
    for (i = 2; i < arr.length-1; i+=2) {
        svg += "l " + arr[i] + " " + arr[i+1] + " ";
    }
    console.log(svg);
    return new Path2D(svg);
}

/// Takes an array of points comprising a glyph, and geometrically simplifies
/// it to save memory.
function simplifyGlyph(arr) {

}
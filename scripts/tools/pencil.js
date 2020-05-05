/// pencil.js
///
/// Implements the pencil tool, which allows users to sketch and erase glyphs.
/// 
/// Layout of elements[]:
/// "glyph": {
///     { id, { Path[], RenderProperties } }, ...
/// }

import { SketchPad } from "../sketchpad.js";

export var tool = {
    name:           "Pencil",
    tooltip:        "Draw and doodle",
    tool_down:      BeginTrackGlyph,
    tool_up:        EndTrackGlyph,
    tool_move:      TrackGlyph,
    tool_context:   function () {},
    sp_redraw:      RenderAll,
    sp_init:        Init,
    sp_recache:     Recache,
}

var sp = null;          // Reference to SketchPad
var glyphPaths = [];    // Local cache of glyphs elements, ready to render
                        // [ { elemID, path, style }, ... ]
var glyph = null;       // Glyph currently being draw
var mode = "";          // Pencil mode. "draw" or "erase"

function Init() {
    console.log("Init pencil");
    sp = new SketchPad();
}

function BeginTrackGlyph(event) {
    if (event.button == 0) {
        glyph = new Array();
        glyph.push(event.offsetX);
        glyph.push(event.offsetY);
        mode = "draw";

        sp.ctx.lineCap = "round";
        sp.ctx.lineWidth = "2.5";
        sp.ctx.strokeStyle = '#333';    
    }
    else if (event.button == 2) {
        mode = "erase";
        
        sp.ctx.lineWidth = "20";
    }
}

function TrackGlyph(event) {
    // If in draw mode, add points to glyph
    if (mode == "draw") {
        if (glyph != null) {
            glyph.push(event.offsetX - TrackGlyph.prevX);
            glyph.push(event.offsetY - TrackGlyph.prevY);
            
            sp.ctx.beginPath();
            sp.ctx.moveTo(TrackGlyph.prevX, TrackGlyph.prevY);
            sp.ctx.lineTo(event.offsetX, event.offsetY);
            sp.ctx.stroke();
        }
    }

    // If in erase mode, check for path collisions
    if (mode == "erase") {
        var did_erase_glyph = false;
        for (var i = 0; i < glyphPaths.length; i++)
            if (sp.ctx.isPointInStroke(glyphPaths[i].path2D, event.offsetX, event.offsetY)) {
                // Remove from sketchpad element list
                sp.removeElement("glyph", glyphPaths[i].elemID);

                // Remove from local path cache
                glyphPaths.splice(i, 1);
                did_erase_glyph = true;
            }
        
        if (did_erase_glyph) sp.redraw();
    }

    // Track position regardless if drawing or not
    TrackGlyph.prevX = event.offsetX;
    TrackGlyph.prevY = event.offsetY;
}

function EndTrackGlyph() {
    if (mode == "draw") {
        if (glyph == null) return;

        // Add element and render properties to Sketchpad
        var rend_props = sp.getRenderProperties();
        var id = sp.addElement("glyph", {"data": glyph, "style": rend_props});

        // Add element to local cache
        var path = arrayToPath2D(glyph)
        glyphPaths.push({ elemID: id, path2D: path, style: rend_props } );
        
        glyph = null;
        mode = "";
    }
    else if (mode == "erase")
        mode = "";
}

function RenderAll() {
    if (typeof glyphPaths !== 'undefined') {
        for (var i = 0; i < glyphPaths.length; i++) {
            sp.restoreRenderProperties(glyphPaths[i].style);
            sp.ctx.stroke(glyphPaths[i].path2D);
        }
    }
}

function Recache() {
    glyphPaths = [];
    var glyphs = sp.getAllElements("glyph");

    for (var i = 0; i < glyphs.length; i++) {
        glyphPaths.push({
            elemID: glyphs[i].id,
            path2D: arrayToPath2D(glyphs[i].elem.data),
            style: glyphs[i].elem.style
        });
    }
}


/// Takes our arrays of points and converts it to an SVG path, then to a Path2D
/// which can be drawn
export function arrayToPath2D(arr) {
    var svg = ""
    svg += "M " + arr[0] + " " + arr[1] + " ";
    for (var i = 2; i < arr.length-1; i+=2) {
        svg += "l " + arr[i] + " " + arr[i+1] + " ";
    }
    return new Path2D(svg);
}

/// Takes an array of points comprising a glyph, and removes geometrically
/// redundant points to save memory. TODO: Implement
export function simplifyGlyph(arr) {
    return arr;
}
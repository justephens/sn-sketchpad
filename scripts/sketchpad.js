/// sketchpad.js
/// 
/// Manages the content on the Sketchpad. References to "Sketchpad" in
/// documentation are referring to this managing file.

import {Interface} from "./interface.js";

document.addEventListener('DOMContentLoaded', function(event) {
    var sp = new SketchPad();
    sp.initializeSketchpad();
});



/// Manager class for the SketchPad application
export class SketchPad {
    constructor() {
        // Singleton
        const instance = this.constructor.instance;
        if (instance) {
            return instance;
        }
        this.constructor.instance = this;

        // Background Canvas
        this.canvas = null;         // Canvas DOM object
        this.ctx = null;            // 2D rendering context
        this.glyph = null;          // Holds glyph while user is drawing

        // Elements
        this.elements = [];         // All the sketchpad elements

        // Standard Notes component interface
        this.componentManager = new ComponentManager();
    }

    /// Initializes the Sketchpad
    initializeSketchpad() {
        this.canvas = document.getElementById("sp-canvas");
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;
        this.ctx = this.canvas.getContext("2d");

        // Standard Notes callbacks
        this.componentManager.streamContextItem(function (item) {
            SketchPad.snStreamContextItem(item);
        });

        // Draw glyphs to canvas, transferring to a GlyphElement on mouseup
        this.canvas.onmousedown = (event) => {
            if (Interface.active_tool == "pen") {
                // Move canvas to top to allow drawing anywhere
                this.canvas.style.zIndex = 999999;
                GlyphBuilder.beginTrackGlyph(event);
            }
        };
        this.canvas.onmousemove = (event) => {
            if (Interface.active_tool == "pen") {
                GlyphBuilder.trackGlyph(event);
            }
        }
        this.canvas.onmouseup = (event) => {
            if (Interface.active_tool == "pen") {
                // Move canvas back down
                this.canvas.style.zIndex = 0;
                GlyphBuilder.endTrackGlyph();
                GlyphBuilder.getGlyphElement();
            }
        }

        // Create startomg TextElement
        let e = new TextElement([32, 32, 400, 200]);
    }


    /// Called every time the note is updated
    static snStreamContextItem(note) {
        let sp = new SketchPad();

        // Ignore metadata updates right now
        if (note.isMetadataUpdate) return;

        console.log("Update note:");
        console.log(note);

        sp.note = note;

        // Read in elements from note
        if (sp.note.content.text.length > 2)
            SketchPad.importNoteJSON(sp.note.content.text);
    }

    /// Call this to save the note
    static snSaveNote() {
        let sp = new SketchPad();

        if (!sp.note) return;
        console.log("Saving Note");

        sp.note.content.text = SketchPad.exportNoteJSON();
        sp.componentManager.saveItemWithPresave(sp.note, () => {
            // On complete?
        });
    }


    /// Adds the given element to the given group. Returns the element ID.
    static addElement(elem) {
        let sp = new SketchPad();
        sp.elements.push(elem);
    }

    /// Removes the given element
    /// TODO: Binary search
    static removeElement(elemId) {
        let sp = new SketchPad();

        // Find element, remove it
        for (let i = 0; i < sp.elements.length; i++) {
            if (sp.elements[i].id == elemId) {
                sp.elements.splice(i, 1);
                break;
            }
        }
    }

    /// Returns the element belonging to the given group with the given ID
    static getElement(elemID) {
        let sp = new SketchPad();

        // Find element, return it
        for (let i = 0; i < sp.elements.length; i++) {
            if (sp.elements[i].id == elemId) {
                return sp.elements[i];
            }
        }
    }

    /// Destroys all elements in the SketchPad
    static clear() {
        let sp = new SketchPad();

        for (let i = 0; i < sp.elements.length; i++) {
            sp.elements[i].destroy();
        }
        sp.elements = [];
    }


    /// Returns a JSON string containing all the elements in the SketchPad.
    /// Elements are exported in groups according to their Class type.
    static exportNoteJSON() {
        let sp = new SketchPad();
        let objs = {};

        // Export each element, grouped by class
        for (let i = 0; i < sp.elements.length; i++) {
            // Get class name
            let class_name = sp.elements[i].constructor.name;

            // Add to array group, creating if not existent
            if (!objs[class_name]) objs[class_name] = [];
            objs[class_name].push(sp.elements[i].exportObject());
        }

        return JSON.stringify(objs);
    }

    /// Reads a JSON string, building elements into the SketchPad.
    /// NOTE: Clears SketchPad
    static importNoteJSON(objs_str) {
        let sp = new SketchPad();
        SketchPad.clear()
        

        let objs = JSON.parse(objs_str);

        for (let i = 0; i < Object.keys(objs).length; i++) {
            let class_name = Object.keys(objs)[i];
            
            // For all elements in each class/group, run the import function
            // for that class
            let elems = objs[class_name];
            for (let j = 0; j < elems.length; j++) {
                eval(class_name+".importObject(elems[j])");
            }
        }
    }
}

/// Represents an Element on the Sketchpad. When created, each Element will
/// create a HTML element in the DOM tree at the specified screen location, and
/// auto-assigns a sequential ID.
export class Element {
    static id_counter = 0;

    constructor(box, elem_type="div") {
        this.id = Element.id_counter++;
        this.x = 24;
        this.y = 8;
        this.w = 200;
        this.h = 100;

        // Set coordinates based on [x,y] or [x,y,w,h] parameters
        if (box) {
            if (box.length >= 2) {
                this.x = box[0];
                this.y = box[1];
            }
            if (box.length == 4) {
                this.w = box[2];
                this.h = box[3];
            }
        }

        // Get next ID in sequence, generate an element into the dom tree
        let elem = document.createElement(elem_type);
        elem.id = "elem_" + this.id;
        elem.className = "sp-element";
        document.getElementById("sp-contents").prepend(elem);

        // Update the position and bind event handler methods to triggers
        this.updateDomStyle();
        this.bindEventHandlers();

        SketchPad.addElement(this);
    }

    /// Delete the element. Removes from DOM tree and SketchPad
    destroy() {
        this.domElement().outerHTML = "";
        SketchPad.removeElement(this.id);
    }

    /// Create an Element from an export
    static importObject(obj) {
        return new Element(obj["box"], obj["tag"]);
    }

    /// Export this Element to an object, which can be JSONified and saved.
    /// Contains only the data necessary to recreate the core Element; derived
    /// classes should append their own exported data
    exportObject() {
        return {
            tag: this.domElement().tagName.toLowerCase(),
            box: [
                this.x, this.y, this.w, this.h
            ]
        };
    }


    /// Re-binds the event handler functions. Calling this method in the
    /// constructor of inherited class will set the child class's handlers to
    /// the locally defined methods, effectively forcing "override" behavior.
    bindEventHandlers() {
        let elem = document.getElementById("elem_"+this.id);
        elem.onmouseenter = this.onmouseenter;
        elem.onmouseleave = this.onmouseleave;
        elem.onmousedown = this.onmousedown;
        elem.onmousemove = this.onmousemove;
        document.onmousemove = this.ondocmousemove;
        elem.onmouseup = this.onmouseup;
    }

    /// Returns the DOM Element represented by this Element object. Alias for
    domElement() {
        return document.getElementById("elem_" + this.id);
    }

    /// Updates the position and size of the element
    updateDomStyle() {
        let elem = this.domElement();
        elem.style.left = this.x + "px";
        elem.style.top = this.y + "px";
        elem.style.width = this.w + "px";
        elem.style.height = this.h + "px";
    }


    //////////////////////
    /// Event Handlers ///
    //////////////////////
    /// Must use arrow functions for `this` to reference this Element object
    /// instead of the DOM element.
    onmouseenter = () => {
        let elem = this.domElement();
        elem.style.border = "1px solid #CCC";
    };

    onmouseleave = () => {
        let elem = this.domElement();
        elem.style.border = "1px hidden"; 
    }

    // Handles mouse movement within the element (to update cursor appearance)
    onmousemove = (event) => {
        if (event.offsetX <= 4 || this.width - event.offsetX <= 4 ||
            event.offsetY <= 4 || this.height - event.offsetY <= 4) {
            this.domElement().style.cursor = "grab";
            this.cursor_grab = true;
        } else {
            this.domElement().style.cursor = "auto";
            this.cursor_grab = false;
        }
    }

    // Handles mouse movement outside the element (to track while dragging)
    ondocmousemove = (event) => {
        if (this.isgrabbed) {
            this.x += event.movementX;
            this.y += event.movementY;
            this.updateDomStyle();
        }
    }

    onmousedown = (event) => {
        // If mouse click was in the the unoccupied space within the <div>,
        // or on child elements within the box (i.e. <p>, <span>, etc.)
        if (event.target.tagName == "DIV") {
            console.log("Click fell through");
        } else {
            event.stopPropagation();
        }

        if (this.cursor_grab) {
            this.isgrabbed = true;
        }
    };

    onmouseup = (event) => {
        // If this element was being dragged, save note
        if (this.isgrabbed) SketchPad.snSaveNote();
        
        this.isgrabbed = false;
    }
}

/// Textbox element
export class TextElement extends Element {
    static currentQuill;

    constructor(box, text="") {
        // Create div for text
        super(box);
        this.bindEventHandlers();

        this.quill = new Quill('#elem_'+this.id, {
            modules: {
                toolbar: '#toolbox-text'
            },
            theme: 'snow'
        });
        this.quill.on('text-change', SketchPad.snSaveNote);
        this.activateQuill();
    }

    /// Delete the element. Removes from DOM tree and SketchPad
    destroy() {
        if (TextElement.currentQuill == this.quill) TextElement.currentQuill = null;
        delete this.quill;
        super.destroy();
    }

    /// Create an Element from an export
    static importObject(obj) {
        let te = new TextElement(obj["box"], obj["tag"]);
        te.quill.setContents(obj["quill"]);
        return te;
    }

    /// Export this Element to an object, which can be JSONified and saved.
    /// Contains only the data necessary to recreate the core Element; derived
    /// classes should append their own exported data
    exportObject() {
        let obj = super.exportObject();
        obj["quill"] = this.quill.getContents();
        return obj;
    }


    /// Returns true if this TextElement is active
    isActiveQuill() {
        return TextElement.currentQuill == this.quill;
    }

    /// When called, makes this Quill instance active. Sets currentQuill to
    /// this editor and currentFormat to the format of the text.
    activateQuill() {
        TextElement.currentQuill = this.quill;
    }

    /// Shorthand used to change the format of text in the active editor
    static setFormatOption(name, value) {
        TextElement.currentQuill.format(name, value);
    }

    /// Toggles the given binary format value.
    static toggleFormatOption(name, states=[true,false]) {
        if (!TextElement.currentQuill) return;

        if (TextElement.currentQuill.getFormat()[name] == states[0]) {
            TextElement.currentQuill.format("bold", states[1]);
        } else {
            TextElement.currentQuill.format("bold", states[0]);
        }
    }
}

/// Glyph element; Holds a drawn glyph
/// TODO: Need to figure out how to insert function <svg> elements into the DOM
export class GlyphElement extends Element {

    constructor(box, pathStr, style) {
        // Create div for glyph
        super(box);
        this.bindEventHandlers();

        // Create <svg> element
        let svg = document.createElement("svg");
        //svg.setAttribute("viewbox", "0 0 1000 1000");
        //svg.setAttribute("xmlns", "https://www.w3.org/2000/svg");

        // Create a <path> element
        let path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", pathStr);
        path.style.stroke = "#333";
        path.style.fill = "none"

        // Add <path> to <svg>, then <svg> to <div>
        svg.prepend(path);
        this.domElement().prepend(svg);
    }
}

/// A utility class used to track the movement of the pencil tool when a Glyph
/// is initially being drawn, drawing the movement to `#sp-canvas`. A 
/// GlyphElement can be retrieved once drawing is complete.
class GlyphBuilder {
    static isTracking = false;

    /// Called whenever a drawing tool is "placed" onto the Sketchpad
    static beginTrackGlyph(event) {
        console.log("Init GlyphBuilder");
        let sp = new SketchPad();

        // Store starting coordinates
        GlyphBuilder.glyph = new Array();
        GlyphBuilder.glyph.push(event.offsetX);
        GlyphBuilder.glyph.push(event.offsetY);

        // Set draw style
        sp.ctx.lineWidth = 10;
        sp.ctx.lineCap = "round";
        sp.ctx.strokeStyle = '#333';
        
        // Draw starting point, set tracking flag to true
        sp.ctx.moveTo(event.offsetX, event.offsetY);
        sp.ctx.lineTo(event.offsetX, event.offsetY);
        sp.ctx.stroke();
        GlyphBuilder.isTracking = true;
    }

    /// Called when a drawing tool moves. Tracks movement
    static trackGlyph(event) {
        if (!GlyphBuilder.isTracking) return;
        let sp = new SketchPad();

        // Add deltas to glyph array
        GlyphBuilder.glyph.push(event.movementX);
        GlyphBuilder.glyph.push(event.movementY);

        // Draw segment to new point
        sp.ctx.lineTo(event.offsetX, event.offsetY);
        sp.ctx.stroke();
    }

    /// Called whenever a drawing tool is "lifted" from the Sketchpad
    static endTrackGlyph() {
        GlyphBuilder.isTracking = false;
    }

    /// Returns a GlyphElement and clears the `#sp-canvas`
    static getGlyphElement() {
        // Build a string representation of the path for use in <svg>
        var pstr = "";
        pstr += "M 0 0 ";
        for (var i=2; i<GlyphBuilder.glyph.length-1; i+=2) {
            pstr += "l " + GlyphBuilder.glyph[i] + " " + GlyphBuilder.glyph[i+1] + " ";
        }

        let glyphElem = new GlyphElement({}, pstr);
        return glyphElem;
    }

}
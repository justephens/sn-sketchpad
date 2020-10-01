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
        this.selected_elems = [];   // IDs of currently-selected elements

        // Load Standard Notes component interface
        if (typeof ComponentManager !== "undefined") {
            this.componentManager = new ComponentManager();
            this.usingStandardNotes = true;
        } else {
            this.usingStandardNotes = false;
        }
    }

    /// Initializes the Sketchpad
    initializeSketchpad() {
        this.canvas = document.getElementById("sp-canvas");
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;
        this.ctx = this.canvas.getContext("2d");

        // Standard Notes callbacks
        if (this.usingStandardNotes) {
            this.componentManager.streamContextItem(function (item) {
                SketchPad.snStreamContextItem(item);
            });
        }

        // Draw glyphs to canvas, transferring to a GlyphElement on mouseup
        this.canvas.onmousedown = (event) => {
        }
        this.canvas.onmousemove = (event) => {
        }
        this.canvas.onmouseup = (event) => {
        }

        // Whenever a mouse event happens anywhere in the document, alert the
        // elements of it
        document.onmousedown = (event) => {
            // Notify all Elements
            for (let i = 0; i < this.elements.length; i++)
                this.elements[i].ondocmousedown(event);
            
            if (event.pageY > document.getElementById("toolbar").clientHeight) {
                if (Interface.active_tool == "pen") {
                    GlyphBuilder.beginTrackGlyph(event);
                }
            }
        }
        document.onmousemove = (event) => {
            // Notify all Elements
            for (let i = 0; i < this.elements.length; i++)
                this.elements[i].ondocmousemove(event);
            
            if (event.pageY > document.getElementById("toolbar").clientHeight) {
                if (Interface.active_tool == "pen") {
                    GlyphBuilder.trackGlyph(event);
                }
            }
        }
        document.onmouseup = (event) => {
            // Notify all Elements
            for (let i = 0; i < this.elements.length; i++)
                this.elements[i].ondocmouseup(event);
            
            if (Interface.active_tool == "pen" && GlyphBuilder.isTracking) {
                // Move canvas back down
                this.canvas.style.zIndex = 0;

                // Create GlyphElement from tracked path, clear canvas
                GlyphBuilder.endTrackGlyph(event);
                GlyphBuilder.optimizeGlyph();
                let g = GlyphBuilder.createGlyphElement();
                this.ctx.clearRect(g.x, g.y, g.w, g.h);

                SketchPad.snSaveNote();
            }
        }

        // Create starting TextElement
        let e = new TextElement([32, 32, 400, 200], "Lorem ipsum dolor sit amet, consectetur adipiscing elit.");
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

        // If Standard Notes bridge isn't loaded or a note hasn't been streamed
        // yet, don't attempt to save.
        if (!sp.usingStandardNotes || !sp.note) return;
        console.log("Saving Note");

        sp.note.content.text = SketchPad.exportNoteJSON();
        sp.componentManager.saveItemWithPresave(sp.note, () => {
            // On complete?
        });
    }


    /// Adds the given element to the Sketchpad
    static addElement(elem) {
        let sp = new SketchPad();
        sp.elements.push(elem);
    }

    /// Removes the given element
    /// TODO: Binary search
    static removeElement(elemID) {
        let sp = new SketchPad();

        // Find element, remove it
        for (let i = 0; i < sp.elements.length; i++) {
            if (sp.elements[i].id == elemID) {
                sp.elements.splice(i, 1);
                break;
            }
        }
    }

    /// Returns the element with the given ID
    /// TODO: Binary search
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


    /// Marks the element with the given ID as selected
    static selectElement(elemID) {
        let sp = new SketchPad();
        sp.selected_elems.push(elemID);
        sp.getElement(elemID).onSelect();
    }
    
    /// Marks the element with the given ID as unselected
    static deselectElement(elemID) {
        let sp = new SketchPad();

        for (let i = 0; i < sp.selected_elems.length; i++) {
            if (sp.selected_elems[i] == elemID) {
                sp.elements.splice(i, 1);
                sp.getElement(elemID).onDeselect();
                break;
            }
        }
    }

    /// Clears all selected elements
    static clearSelected() {
        let sp = new SketchPad();

        for (let i = 0; i < sp.selected_elems.length; i++) {
            sp.selected_elems[i].onDeselect();
        }
        sp.selected_elems = [];
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
    /// Sequential counter used to assign IDs to new Elements
    static id_counter = 0;
    /// Flag used to track if the users' mouse is 'down' or 'up'
    static mouse_down = false;

    constructor(box, elem_type="div") {

        /// Permanent member variables
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
        elem.style.zIndex = this.id+1;
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
        elem.onmouseenter = (event) => { this.onmouseenter(event); };
        elem.onmouseleave = (event) => { this.onmouseleave(event); };
        elem.onmousedown = (event) => { this.onmousedown(event); };
        elem.onmousemove = (event) => { this.onmousemove(event); };
        elem.onmouseup = (event) => { this.onmouseup(event); };
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


    ////////////////////////
    /// UI State Methods ///
    ////////////////////////
    /// Highlight the borders of this element
    uiBorderHighlight() {
        let elem = this.domElement();
        let bwmin = 1;

        // Add border, shift positions and size to compensate
        elem.style.border = bwmin + "px solid #CCC";

        elem.style.left = (this.x-bwmin) + "px";
        elem.style.top = (this.y-bwmin) + "px";
        elem.style.width = (this.w+2*bwmin) + "px";
        elem.style.height = (this.h+2*bwmin) + "px";
    }
    
    /// When this element is selected. Draws minor side borders with a large
    /// drag bar on top
    uiSelected() {
        let elem = this.domElement();
        let bwmin = 2;
        let bwmaj = 16;

        // Add border, shift positions and size to compensate
        elem.style.border = bwmin + "px solid #CCC";
        elem.style.borderTop = bwmaj + "px solid #000";

        elem.style.left = (this.x-bwmin) + "px";
        elem.style.top = (this.y-bwmaj) + "px";
        elem.style.width = (this.w+2*bwmin) + "px";
        elem.style.height = (this.h+bwmaj+bwmin) + "px";
    }

    /// Plain, no-border appearance
    uiDefault() {
        let elem = this.domElement();

        // Remove border, reset to original size and position
        this.updateDomStyle();
        elem.style.border = "none";
    }


    //////////////////////
    /// Event Handlers ///
    //////////////////////
    onmouseenter() {
        this.uiBorderHighlight();
    };

    onmouseleave() {
        this.uiDefault();
    }

    // Handles mouse movement within the element (to update cursor appearance)
    onmousemove(event) {
        // Don't move elements if a tool (i.e. pen/erase) is active
        if (Interface.active_tool == null) {
            if (event.offsetX <= 4 || this.width - event.offsetX <= 4 ||
                event.offsetY <= 4 || this.height - event.offsetY <= 4) {
                this.domElement().style.cursor = "grab";
                this.cursor_grab = true;
            } else {
                this.domElement().style.cursor = "auto";
                this.cursor_grab = false;
            }
        }
    }

    onmousedown(event) {
        // Check if mouse click was in the unoccupied space within element
        // ("DIV"), or on child elements within the box (i.e. <p>, <span>, etc.)
        /*if (event.target.tagName == "DIV") {
            console.log("Click fell through");
        } else {
            event.stopPropagation();
        }*/
        this.uiSelected();

        if (this.cursor_grab) {
            this.is_grabbed = true;
            this.grab_x = this.x;
            this.grab_y = this.y;
            this.grab_curs_x = event.x;
            this.grab_curs_y = event.y;
        }
    };

    onmouseup(event) {}

    ondocmousedown(event) {
        Element.mouse_down = true;
    }

    ondocmousemove(event) {
        if (this.is_grabbed) {
            this.x = this.grab_x + (event.x - this.grab_curs_x);
            this.y = this.grab_y + (event.y - this.grab_curs_y);
            this.updateDomStyle();
        }
    }

    ondocmouseup(event) {
        Element.mouse_down = false;

        // If this element was being dragged, save note
        if (this.is_grabbed) SketchPad.snSaveNote();
        
        this.is_grabbed = false;
        delete this.grab_x;
        delete this.grab_y;
        delete this.grab_curs_x;
        delete this.grab_curs_y;
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
        this.quill.setText(text);
        this.quill.on('text-change', SketchPad.snSaveNote);
        this.activateQuill();
    }

    destroy() {
        if (TextElement.currentQuill == this.quill) TextElement.currentQuill = null;
        delete this.quill;
        super.destroy();
    }

    static importObject(obj) {
        return new TextElement(obj["box"], obj["quill"]);
    }

    exportObject() {
        let obj = super.exportObject();
        obj["quill"] = this.quill.getContents();
        return obj;
    }


    /////////////////////
    /// Quill-Related ///
    /////////////////////
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

    /// Toggles the given binary format option in Quill
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
        let svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("width", "100%");
        svg.setAttribute("height", "100%");
        svg.setAttribute("version", "1.1");

        // Create a <path> element
        let path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", pathStr);

        // Style element
        this.style = style;
        path.style.strokeLinecap = "round";
        path.style.stroke = style["color"];
        path.style.strokeWidth = style["size"];
        path.style.fill = style["fill"];

        // Add <path> to <svg>, then <svg> to <div>
        svg.append(path);
        this.domElement().append(svg);

        // Store a Path2D of the graphic for collision checking later
        this.path2d = new Path2D(pathStr);
    }

    static importObject(obj) {
        return new GlyphElement(obj["box"], obj["svg-path"], obj["style"]);
    }

    exportObject() {
        let obj = super.exportObject();
        obj["svg-path"] = this.domElement().children[0].children[0].getAttribute("d");
        obj["style"] = this.style;
        return obj;
    }

    // Style overrides
    uiBorderHighlight() { }
    
    uiSelected() {
        super.uiSelected();
        let elem = this.domElement();

        elem.style.backgroundColor = "#ccc9";
    }

    uiDefault() {
        super.uiDefault();
        let elem = this.domElement();

        elem.style.backgroundColor = "#fff0";
    }

    //////////////////////
    /// Event Handlers ///
    //////////////////////
    onmousemove(event) {
        super.onmousemove(event);
        let sp = new SketchPad();

        if (Element.mouse_down && Interface.active_tool == "erase") {

            // Set draw size to the width of this glyph + the width of the
            // eraser tool, then check if the mouse is located in that path.
            sp.ctx.lineWidth = this.style["size"] + Interface.GetDrawStyle()["size"];

            if (sp.ctx.isPointInStroke(this.path2d, event.offsetX, event.offsetY))
                this.destroy();
        }
    }
}

/// A utility class used to track the movement of the pencil tool when a Glyph
/// is initially being drawn, drawing the movement to `#sp-canvas`. A 
/// GlyphElement can be retrieved once drawing is complete.
/// Also provides functionality for rendering the effect circle while erasing.
class GlyphBuilder {
    /// Flag to keep track of whether GlyphBuilder is actively tracking a glyph
    /// or not
    static isTracking = false;

    /// Called whenever a drawing tool is "placed" onto the Sketchpad
    static beginTrackGlyph(event) {
        let sp = new SketchPad();

        // Reset static variables used by tracking
        GlyphBuilder.toolbar_h = document.getElementById("toolbar").clientHeight;
        GlyphBuilder.glyph = new Array();
        GlyphBuilder.isTracking = true;

        // Get draw style from Interface
        GlyphBuilder.style = Interface.GetDrawStyle();
        sp.ctx.lineCap = "round";
        sp.ctx.lineWidth = GlyphBuilder.style["size"];
        sp.ctx.strokeStyle = GlyphBuilder.style["color"];

        // Starting coordinates & path bounds
        GlyphBuilder.xStart = event.pageX;
        GlyphBuilder.yStart = event.pageY-GlyphBuilder.toolbar_h;
        GlyphBuilder.xPrev = GlyphBuilder.xStart;
        GlyphBuilder.yPrev = GlyphBuilder.yStart;
        GlyphBuilder.xMax = GlyphBuilder.xStart + GlyphBuilder.style["size"]/2;
        GlyphBuilder.yMax = GlyphBuilder.yStart + GlyphBuilder.style["size"]/2;
        GlyphBuilder.xMin = GlyphBuilder.xStart - GlyphBuilder.style["size"]/2;
        GlyphBuilder.yMin = GlyphBuilder.yStart - GlyphBuilder.style["size"]/2;

        // Add starting coords to glyph array
        GlyphBuilder.glyph.push(event.pageX);
        GlyphBuilder.glyph.push(event.pageY-GlyphBuilder.toolbar_h);
        
        // Draw starting point, set tracking flag to true
        sp.ctx.beginPath();
        sp.ctx.moveTo(event.pageX, event.pageY-GlyphBuilder.toolbar_h);
        sp.ctx.lineTo(event.pageX, event.pageY-GlyphBuilder.toolbar_h);
        sp.ctx.stroke();
    }

    /// Called when a drawing tool moves.
    static trackGlyph(event) {
        if (!GlyphBuilder.isTracking) return;
        let sp = new SketchPad();

        // Get current position
        let canvasX = event.pageX;
        let canvasY = event.pageY - GlyphBuilder.toolbar_h;

        // Draw segment to new point
        sp.ctx.lineTo(canvasX, canvasY);
        sp.ctx.stroke();

        // If we haven't passed the required threshold and the force_add flag
        // isn't set, return and don't add a vertex to the glyph
        let dx = canvasX - GlyphBuilder.xPrev;
        let dy = canvasY - GlyphBuilder.yPrev;

        // Add deltas to glyph array
        GlyphBuilder.glyph.push(canvasX - GlyphBuilder.xPrev);
        GlyphBuilder.glyph.push(canvasY - GlyphBuilder.yPrev);

        // Update glyph bounds
        GlyphBuilder.xMax = Math.max(GlyphBuilder.xMax, canvasX + GlyphBuilder.style["size"]/2);
        GlyphBuilder.yMax = Math.max(GlyphBuilder.yMax, canvasY + GlyphBuilder.style["size"]/2);
        GlyphBuilder.xMin = Math.min(GlyphBuilder.xMin, canvasX - GlyphBuilder.style["size"]/2);
        GlyphBuilder.yMin = Math.min(GlyphBuilder.yMin, canvasY - GlyphBuilder.style["size"]/2);


        // Set current position as the new "previous" position
        GlyphBuilder.xPrev = canvasX;
        GlyphBuilder.yPrev = canvasY;
    }

    /// Called whenever a drawing tool is "lifted" from the Sketchpad
    static endTrackGlyph(event) {
        this.trackGlyph(event);
        GlyphBuilder.isTracking = false;
    }

    /// Returns a GlyphElement and clears the `#sp-canvas`
    static createGlyphElement() {
        if (GlyphBuilder.isTracking) return false;
        
        // Build a string representation of the path for use in <svg>
        var pstr = "";

        // Starting coordinates, leaving space for lateral movement and brush
        // width
        pstr += "M " + (GlyphBuilder.xStart - GlyphBuilder.xMin) + " "
            + (GlyphBuilder.yStart - GlyphBuilder.yMin);
        
        // Append line deltas
        for (var i=2; i<GlyphBuilder.glyph.length-1; i+=2) {
            pstr += "l " + GlyphBuilder.glyph[i] + " " + GlyphBuilder.glyph[i+1] + " ";
        }

        // Create GlyphElement
        let glyphElem = new GlyphElement(
            [   GlyphBuilder.xMin,
                GlyphBuilder.yMin,
                GlyphBuilder.xMax-GlyphBuilder.xMin,
                GlyphBuilder.yMax-GlyphBuilder.yMin
            ], pstr, GlyphBuilder.style);
        
        return glyphElem;
    }

    /// Optimizes the topology of the glyph.
    static optimizeGlyph() {
        if (GlyphBuilder.isTracking) return false;
    }
}
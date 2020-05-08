/// sketchpad.js
/// 
/// Manages the content on the Sketchpad. References to "Sketchpad" in
/// documentation are referring to this managing file.


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

        this.canvas = null;         // Canvas DOM object
        this.ctx = null;            // 2D rendering context
        this.elements = [];         // All the sketchpad elements

        // Standard Notes component interface
        this.componentManager = new ComponentManager();
    }

    /// Initializes the Sketchpad
    initializeSketchpad() {
        this.canvas = document.getElementById("sp-canvas");
        this.ctx = this.canvas.getContext("2d");

        // Pulls object into this scope so it can be referenced in the
        // functions below
        var sp = this;

        // Standard Notes callbacks
        this.componentManager.streamContextItem(function (item) {
            sp.snStreamContextItem(item);
        });

        // Input callbacks
        this.canvas.onmousedown = function () {
            console.log("Canvas captured MouseDown");
        };

        // Create temporary TextElement to initialize Quill toolbar
        let e = new TextElement([32, 32, 400, 200]);
        e.destroy();
    }


    /// Called every time the note is updated
    snStreamContextItem(note) {
        // Ignore metadata updates right now
        if (note.isMetadataUpdate) return;

        console.log("Update note:");
        console.log(note);

        this.note = note;

        // Read in elements from note
        let objs = JSON.parse(this.note.content.text);
    }

    /// Call this to save the note
    snSaveNote() {
        if (!this.note) return;
        console.log("Saving Note");

        this.note.content.text = this.exportElementJSON();
        this.componentManager.saveItemWithPresave(this.note, () => {
            // On complete?
        });
    }


    /// Adds the given element to the given group. Returns the element ID.
    static addElement(elem) {
        let sp = new SketchPad();
        sp.elements.push(elem);
        
        sp.snSaveNote();
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

        sp.snSaveNote();
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


    /// Returns a string containing JSON of all the elements
    exportNoteJSON() {
        let objs = {
            Element: [],
            TextElement: [],
        };
        for (var i = 0; i < this.elements.length; i++) {
            if (this.elements[i] instanceof TextElement) {
                objs["TextElement"].push(this.elements[i]);
            } else if (this.elements[i] instanceof Element) {
                objs["Element"].push(this.elements[i]);
            }
        }

        console.log(objs);
        return JSON.stringify(obj);
    }

    importNoteJSON(objs) {
        for (var i = 0; i < objs["TextElement"].length; i++) {
            let obj = {};
            Object.assign(obj, TextElement.prototype);
            addElement
        }
    }
}

/// Represents an Element on the Sketchpad. When created, each Element will
/// create an HTML element in the DOM tree at the specified screen location, and
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

        // Get next ID in sequence, generate an element
        let elem = document.createElement(elem_type);
        elem.style.left = this.x + "px";
        elem.style.top = this.y + "px";
        elem.style.width = this.w + "px";
        elem.style.height = this.h + "px";
        elem.id = "elem_" + this.id;
        elem.className = "sp-element";

        // Insert element into the DOM tree
        document.getElementById("sp-contents").prepend(elem);

        // Bind event handler methods to the DOM triggers
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
        return new Element(obj[box], obj[elem]);
    }
    /// Export this Element to an object, which can be JSONified and saved.
    /// Contains only the data necessary to recreate the core Element; derived
    /// classes should append their own exported data
    exportObject() {
        return {
            elem: this.domElement().tagName.toLowerCase(),
            box: [
                this.x, this.y, this.w, this.h
            ]
        };
    }

    /// Re-binds the event handler functions. Calling this method in the
    /// constructor of inherited class will reset event handler functions,
    /// effectively "overriding" them.
    bindEventHandlers() {
        let elem = document.getElementById("elem_"+this.id);
        elem.onmouseenter = this.onmouseenter;
        elem.onmouseleave = this.onmouseleave;
        elem.onmousedown = this.onmousedown;
        elem.onmousemove = this.onmousemove;
        elem.onmouseup = this.onmouseup;
    }

    /// Returns the DOM Element represented by this Element object. Alias for
    domElement = () => {
        return document.getElementById("elem_" + this.id);
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

    onmousedown = event => {
        // If mouse click was in the the unoccupied space within the <div>,
        // or on child elements within the box (i.e. <p>, <span>, etc.)
        if (event.target.tagName == "DIV") {
            console.log("Click fell through");
        } else {
            event.stopPropagation();
        }
    };
}

/// Textbox element
export class TextElement extends Element {
    constructor(box, text="") {
        // Create div for text
        super(box);
        this.bindEventHandlers();

        this.quill = new Quill('#elem_'+this.id, {
            modules: {
            toolbar: '#toolbox-text'
            },
            placeholder: 'Add text here ...',
            theme: 'snow'
        });
    }

    /*onmouseenter = () => {
        let elem = this.domElement();
        elem.style.border = "1px solid #CCC";
        this.dragtimer = setTimeout(this.createDragBar, 1500);
    };

    onmouseleave = () => {
        let elem = this.domElement();
        elem.style.border = "1px hidden";

        let dragbar = elem.getElementById("elem_" + this.id + ".drag");
        if (dragbar) elem.removeChild(dragbar);

        clearTimeout(this.dragtimer);
    }

    createDragBar = () => {
        let elem = document.createElement("div");
        elem.style.backgroundColor = "#000";
        elem.style.width = "100%";
        elem.style.height = "8px";
        elem.style.top = "-8px";
        elem.style.position = "absolute";
        elem.id = "elem_" + this.id + ".drag";

        // Insert element into the DOM tree
        this.domElement().prepend(elem);
    }*/
}

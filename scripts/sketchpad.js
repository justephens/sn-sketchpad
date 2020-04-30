/// sketchpad.js
/// 
/// Manages the content on the Sketchpad. References to "Sketchpad" in
/// documentation are referring to this managing file.

import { tool as pencil } from "./tools/pencil.js";
document.addEventListener('DOMContentLoaded', function(event) {
    var sp = new SketchPad();
    sp.initializeSketchpad();
    sp.tools.push(pencil);
    sp.activeTool = sp.tools[0];
    pencil.sp_init();
});


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
        this.elements = {};         // Holds sketchpad elements in various groups
        this.tools = [
            {
                name:           "Default",
                tooltip:        "Select and move elements",
                tool_down:      null,   // Handle mouse down event
                tool_move:      null,   //    ... mouse move event
                tool_up:        null,   //    ... mouse up event
                tool_context:   null,   // Handles right-click context menu
                sp_init:        null,   // Called with application is initialized
                sp_recache:     null,   // Called when note is streamed
                sp_redraw:      null,   // Called when application is re-rendering
                sp_activate:    null,   // PLANNED: Called when switching to tool
                sp_deactivate:  null,   // PLANNED: Called when switching from tool
            }
        ];
        this.activeTool = this.tools[0];

        this.componentManager = new ComponentManager();
    }

    /// Initializes the Sketchpad
    initializeSketchpad() {
        this.canvas = document.getElementById("sp_canvas");
        this.canvas.width = screen.width;
        this.canvas.height = screen.height * 2;
        this.ctx = this.canvas.getContext("2d");

        // Default render style
        this.restoreRenderProperties({
            fillStyle: '#333',
            lineWidth: 3,
        });

        // Pulls object into this scope so it can be referenced in the
        // functions below
        var sp = this;

        // Standard Notes callbacks
        this.componentManager.streamContextItem(function (item) {
            sp.snStreamContextItem(item);
        });

        // Input callbacks
        this.canvas.onmousedown = function () {
            if (sp.activeTool && sp.activeTool.tool_down)
                sp.activeTool.tool_down(event);
        }
        this.canvas.onmousemove = function () {
            if (sp.activeTool && sp.activeTool.tool_move)
                sp.activeTool.tool_move(event);
        }
        this.canvas.onmouseup = function () {
            if (sp.activeTool && sp.activeTool.tool_up)
                sp.activeTool.tool_up(event);
        }
        this.canvas.oncontextmenu = function () {
            if (sp.activeTool && sp.activeTool.tool_context) {
                sp.activeTool.tool_context(event);
                return false;
            }
            return true;
        }

        // UI callbacks
        document.getElementById("sp_check").onclick = function () {
            sp.activeTool = sp.tools[0];
        }
        document.getElementById("sp_pencil").onclick = function () {
            sp.activeTool = sp.tools[1];
        }
        document.getElementById("sp_eraser").onclick = function () {
            console.log(sp.elements);
        }
    }

    // Called every time the note is updated
    snStreamContextItem(note) {
        // Ignore metadata updates right now
        if (note.isMetadataUpdate) return;

        console.log("Update note:");
        console.log(note);

        this.note = note;

        // Read in elements from note
        this.elements = JSON.parse(this.note.content.text);
        
        // Recache all tools
        for (var i = 0; i < this.tools.length; i++) {
            if (this.tools[i].sp_recache) {
                this.tools[i].sp_recache();
            }
        }
        
        // Redraw sketchpad
        this.redraw();
    }

    snSaveNote() {
        if (!this.note) return;
        this.note.content.text = JSON.stringify(this.elements);
        this.componentManager.saveItemWithPresave(this.note, () => {
            // On complete?
        });
    }



    /// Adds the given element to the given group. Returns the element ID.
    addElement(group, elem) {
        if (!this.elements[group]) this.elements[group] = [];
        
        if (this.elements[group].length == 0) var id = 0;
        else var id = this.elements[group][this.elements[group].length-1].id+1;
        this.elements[group].push( { id: id, elem: elem } );

        console.log("Adding element "+group+"."+id+" :: "+elem);
        
        this.snSaveNote();
        return id;
    }

    /// Removes the given element
    /// TODO: Binary search
    removeElement(group, elemId) {
        console.log("Remove from " + group + " id " + elemId);
        var g = this.getAllElements(group);
        
        for (let i = 0; i < g.length; i++) {
            if (g[i].id == elemId)
                g.splice(i, 1);
        }

        this.elements[group] = g;
        this.snSaveNote();
    }

    /// Returns the element belonging to the given group with the given ID
    getElement(group, elemID) {

    }

    /// Returns all the elements in the given group
    getAllElements(group) {
        return this.elements[group];
    }



    /// Clears the canvas and tells all the tools to redraw
    redraw() {
        console.log("Redraw");

        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

        for (var i = 0; i < this.tools.length; i++)
            if (this.tools[i].sp_redraw)
                this.tools[i].sp_redraw();
    }

    /// Returns an object holding all of the current values of various properties
    /// of the CanvasRenderingContext2D
    getRenderProperties() {
        return {
            fillStyle:  this.ctx.fillStyle,
            lineWidth:  this.ctx.lineWidth,
        }
    }

    /// Takes the given render properties object and sets the values of the 
    /// CanvasRenderingContext2D to match those given
    restoreRenderProperties(prop) {
        this.ctx.fillStyle = prop.fillStyle;
        this.ctx.lineWidth = prop.lineWidth;
    }
}

var ctx = null;

document.addEventListener('DOMContentLoaded', function(event) {

    var canvas = document.getElementById("canvas");
    canvas.width = screen.width;
    canvas.height = screen.height * 2;
    canvas.onmousedown = mouseDown;
    canvas.onmouseup = mouseUp;
    canvas.onmousemove = mouseMove;

    ctx = canvas.getContext("2d");
    ctx.lineCap = "round";
    ctx.lineWidth = "1";
    ctx.strokeStyle = "rgba(0,0,0,1.0)";
    
});
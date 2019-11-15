

var canvas = document.getElementById("myCanvas");
canvas.width = screen.width;
canvas.height = screen.height * 2;

var ctx = canvas.getContext("2d");
ctx.beginPath();
ctx.arc(95,50,40,0,2*Math.PI);
ctx.stroke();


var draw = false;


function mouseDown() {
    draw = true;
}

function mouseUp() {
    draw = false;
}

function mouseMove(event) {
    // Initialize XY previous positions
    if( typeof mouseMove.prevX == 'undefined' ) {
        mouseMove.prevX = 0;
        mouseMove.prevY = 0;
    }

    if (draw) {
        ctx.moveTo(mouseMove.prevX, mouseMove.prevY);
        ctx.lineTo(event.offsetX, event.offsetY);
        ctx.stroke();
    }

    mouseMove.prevX = event.offsetX;
    mouseMove.prevY = event.offsetY;
}
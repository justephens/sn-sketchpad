
var pathHistory = new Array();
var path = null;

function mouseDown() {
    path = new Path2D();
    ctx.beginPath();
}

function mouseUp() {
    pathHistory.push(path);
    path = null;
}

function mouseMove(event) {
    // Initialize XY previous positions
    if( typeof mouseMove.prevX == 'undefined' ) {
        mouseMove.prevX = 0;
        mouseMove.prevY = 0;
    }

    if (path != null) {
        path.lineTo(event.offsetX, event.offsetY);
        ctx.lineTo(event.offsetX, event.offsetY);
        ctx.stroke();
    }

    mouseMove.prevX = event.offsetX;
    mouseMove.prevY = event.offsetY;
}

function refresh(){
    console.log("Refresh");

    var ogStyle = ctx.fillStyle;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.fillStyle = ogStyle;

    for (i = 0; i < pathHistory.length; i++) {
        ctx.stroke(pathHistory[i]);
    }
}
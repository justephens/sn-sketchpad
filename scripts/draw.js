
var pathHistory = new Array();
var path = null;

function mouseDown(event) {
    path = "M " + event.offsetX + " " + event.offsetY + " ";
}

function mouseUp() {
    pathHistory.push(path);
    path = null;
}

function mouseMove(event) {
    if (path != null) {
        path += "l " + (event.offsetX - mouseMove.prevX) + " " + (event.offsetY - mouseMove.prevY) + " ";
        
        ctx.beginPath();
        ctx.moveTo(mouseMove.prevX, mouseMove.prevY);
        ctx.lineTo(event.offsetX, event.offsetY);
        ctx.stroke();
    }

    mouseMove.prevX = event.offsetX;
    mouseMove.prevY = event.offsetY;
}

function refresh() {
    console.log("Refresh");

    var ogStyle = ctx.fillStyle;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.fillStyle = ogStyle;

    for (i = 0; i < pathHistory.length; i++) {
        ctx.stroke(new Path2D(pathHistory[i]));
    }
}
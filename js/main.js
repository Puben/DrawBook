var sessionHandlerRef = new Firebase('https://sessionhandler-db.firebaseio.com/');

function sessionController($scope) {

    // Statisk tilføjelse af data til seperat FireBase-db ses her!
    var usersRef = sessionHandlerRef.child("users");

    usersRef.set({
        sessionone: {
            firstName: "Session",
            lastName: "One"
        },

        sessiontwo: {
            firstName: "Session",
            lastName: "Two"
        }
    });

}

$(document).ready(function () {
    //Globale variable - Vi skal have gjort det her dynamisk!
    var pixSize = 1, lastPoint = null, currentColor = "f05", mouseDown = 0;

    // Tilføj en reference til pixel-dataen for vores tegning. FireBase-backenden skal refereres her.
    var pixelDataRef = new Firebase('https://radiant-inferno-4299.firebaseio.com/');

    // Sæt lærred op-
    var myCanvas = document.getElementById('canvas');
    var myContext = myCanvas.getContext ? myCanvas.getContext('2d') : null;
    // Er vores context == null, er HTML5 ikke understøttet af browseren
    if (myContext == null) {
        alert("You must use a browser that supports HTML5 Canvas to run this demo.");
        return;
    }

    // Tilføj handler til at rydde lærredet
    $('#clear').click(function() {
        $('#canvas').get(0).getContext('2d').clearRect(0, 0, 100, 150);
        pixelDataRef.set(null);
    });

    //Her bygger vi color-pickeren
    var colors = ["fff","000","f00","0f0","00f","88f","f8d","f88","f05","f80","0f8","cf0","08f","408","ff8","8ff"];
    for (c in colors) {
        var item = $('<div/>').css("background-color", '#' + colors[c]).addClass("colorbox");
        item.click((function () {
            var col = colors[c];
            return function () {
                currentColor = col;
            };
        })());
        item.appendTo('#colorholder');
    }

    var size = ["1","2","3","4","5","6","7","8","9","10"];
    for (s in size) {
        var item = $('<div/>').css("canvas-size", '#' + size[s]).addClass("sizeBox");
        item.click((function () {
            var tempSize = size[s];
            return function () {
                pixSize = tempSize;
            };
        })());
        item.appendTo('#sizeholder');
    }


    //Hold styr på om museknappen holdes nede eller ej
    myCanvas.onmousedown = function () {mouseDown = 1;};
    myCanvas.onmouseout = myCanvas.onmouseup = function () {
        mouseDown = 0; lastPoint = null;
    };

    //Draw a line from the mouse's last position to its current position
    var drawLineOnMouseMove = function(e) {
        if (!mouseDown) return;

        e.preventDefault();

        // Bresenham's line algorithm. We use this to ensure smooth lines are drawn
        var offset = $('canvas').offset();
        var x1 = Math.floor((e.pageX - offset.left) / pixSize - 1),
            y1 = Math.floor((e.pageY - offset.top) / pixSize - 1);
        var x0 = (lastPoint == null) ? x1 : lastPoint[0];
        var y0 = (lastPoint == null) ? y1 : lastPoint[1];
        var dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
        var sx = (x0 < x1) ? 1 : -1, sy = (y0 < y1) ? 1 : -1, err = dx - dy;
        while (true) {
            //write the pixel into Firebase, or if we are drawing white, remove the pixel
            pixelDataRef.child(x0 + ":" + y0).set(currentColor === "fff" ? null : currentColor);

            if (x0 == x1 && y0 == y1) break;
            var e2 = 2 * err;
            if (e2 > -dy) {
                err = err - dy;
                x0 = x0 + sx;
            }
            if (e2 < dx) {
                err = err + dx;
                y0 = y0 + sy;
            }
        }
        lastPoint = [x1, y1];
    };
    $(myCanvas).mousemove(drawLineOnMouseMove);
    $(myCanvas).mousedown(drawLineOnMouseMove);

    // Add callbacks that are fired any time the pixel data changes and adjusts the canvas appropriately.
    // Note that child_added events will be fired for initial pixel data as well.
    var drawPixel = function(snapshot) {
        var coords = snapshot.name().split(":");
        myContext.fillStyle = "#" + snapshot.val();
        myContext.fillRect(parseInt(coords[0]) * pixSize, parseInt(coords[1]) * pixSize, pixSize, pixSize);
    };
    var clearPixel = function(snapshot) {
        var coords = snapshot.name().split(":");
        myContext.clearRect(parseInt(coords[0]) * pixSize, parseInt(coords[1]) * pixSize, pixSize, pixSize);
    };
    pixelDataRef.on('child_added', drawPixel);
    pixelDataRef.on('child_changed', drawPixel);
    pixelDataRef.on('child_removed', clearPixel);
});

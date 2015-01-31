/*jslint browser: true*/
/*global $, jQuery, alert, io, window*/

var INTERVAL = 50,
    LINEINTERVAL = 4000,
    STARTTIME = Date.now();

$(function () {
    "use strict";

    // The URL of your web server (the port is set in app.js)
    var url = 'https://doodletwitch.herokuapp.com/', //'http://localhost:8080', 
        doc = $(document),
        win = $(window),
        canvas = $('#paper'),
        ctx = canvas[0].getContext('2d'),
        pathname = window.location.pathname,
        drawing = false,
        lastTime = 0;
    // get rid of '/'
    pathname = pathname.substring(1);

    // Generate a unique ID
    var id = Math.round($.now() * Math.random());



    var clients = {},
        cursors = {},
        lines = [];

    // Functions
    function drawLine(fromx, fromy, tox, toy, wratio, hratio, save) {
        ctx.beginPath();
        ctx.moveTo(fromx * wratio, fromy * hratio);
        ctx.lineTo(tox * wratio, toy * hratio);
        if (save) {
            lines.push({
                fx: fromx,
                fy: fromy,
                tx: tox,
                ty: toy,
                wr: wratio,
                hr: hratio,
                drawTime: Date.now()
            });
        }
        ctx.lineWidth = 3;
        ctx.stroke();
    }

    function resizeCanvas() {
        canvas.attr("width", win.width());

        // 28 offset for stream controls
        canvas.attr("height", win.height() - 28);
    }
    // set size first time, do we need this?
    resizeCanvas();

    window.addEventListener('resize', resizeCanvas, false);

    // refresh canvas
    // TODO: redraw elements that shouldn't be cleared yet with higher opacity
    function animate(highResTimestamp) {
        var l,
            offsetTime = highResTimestamp + STARTTIME;

        if (offsetTime - lastTime > INTERVAL) {
            lastTime = offsetTime;
            ctx.clearRect(0, 0, canvas.attr("width"), canvas.attr("width"));
            for (l in lines) {
                if (offsetTime - lines[l].drawTime < LINEINTERVAL) {
                    drawLine(lines[l].fx, lines[l].fy, lines[l].tx, lines[l].ty, lines[l].wr, lines[l].hr, false);
                }
                else {
                    // else delete first element which should be oldest
                    lines.shift();   
                }
            }
        }

        requestAnimationFrame(animate);
        // Animate something...
    }



    // This demo depends on the canvas element
    if (!('getContext' in document.createElement('canvas'))) {
        alert('Sorry, it looks like your browser does not support canvas!');
        return false;
    }


    // set channel source
    $('#strim').attr("src", "https://www-cdn.jtvnw.net/widgets/live_embed_player.swf?channel=" + pathname);

    var socket = io.connect(url);

    socket.emit('joinRoom', pathname);

    socket.on('moving', function (data) {
        var wratio = win.width() / data.width;
        var hratio = win.height() / data.height;

        if (!(data.id in clients)) {
            // a new user has come online. create a cursor for them
            cursors[data.id] = $('<div class="cursor">').appendTo('#cursors');
        }

        // Move the mouse pointer
        cursors[data.id].css({
            'left': data.x * wratio,
            'top': data.y * hratio
        });

        // Is the user drawing?
        if (data.drawing && clients[data.id]) {

            // Draw a line on the canvas. clients[data.id] holds
            // the previous position of this user's mouse pointer

            drawLine(clients[data.id].x, clients[data.id].y, data.x, data.y, wratio, hratio, true);
        }

        // Saving the current client state
        clients[data.id] = data;
        clients[data.id].updated = $.now();
    });

    var prev = {};

    canvas.on('mousedown', function (e) {
        e.preventDefault();
        drawing = true;
        prev.x = e.pageX;
        prev.y = e.pageY;
    });

    doc.bind('mouseup mouseleave', function () {
        drawing = false;
    });

    var lastEmit = $.now();

    doc.on('mousemove', function (e) {
        if ($.now() - lastEmit > 30) {
            socket.emit('mousemove', {
                'x': e.pageX,
                'y': e.pageY,
                'drawing': drawing,
                'width': win.width(),
                'height': win.height(),
                'id': id
            });
            lastEmit = $.now();
        }

        // Draw a line for the current user's movement, as it is
        // not received in the socket.on('moving') event above

        if (drawing) {

            drawLine(prev.x, prev.y, e.pageX, e.pageY, 1, 1, true);

            prev.x = e.pageX;
            prev.y = e.pageY;
        }
    });

    // Remove inactive clients after 10 seconds of inactivity
    setInterval(function () {
        var ident;

        for (ident in clients) {
            if ($.now() - clients[ident].updated > 10000) {

                // Last update was more than 10 seconds ago. 
                // This user has probably closed the page
                cursors[ident].remove();
                delete clients[ident];
                delete cursors[ident];
            }
        }

    }, 10000);

    animate(0);
});
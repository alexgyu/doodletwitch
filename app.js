var express = require('express'),
	path    = require('path'),
	app = express(),
	http = require('http'),
	io = require('socket.io').listen(app.listen(8080));

app.use(express.static(path.join(__dirname, '/static')));

app.get('/:id', function(req, res) {
	console.log(req.params.id);
	res.sendFile(path.join(__dirname, '/views/index.html'));
});

io.sockets.on('connection', function (socket) {

	socket.on('joinRoom', function(room) {
		socket.room = room;
	    socket.join(room);
	});

	// Start listening for mouse move events
	socket.on('mousemove', function (data) {
		// This line sends the event (broadcasts it)
		// to everyone except the originating client.
		socket.broadcast.to(socket.room).emit('moving', data);
	});
});

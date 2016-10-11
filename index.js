/*
https://github.com/rauchg/chat-example
*/
var app = require('express')();


//Express initializes app to be a function handler that you can supply to an HTTP server
var http = require('http').Server(app);

//A server that integrates with (or mounts on) the Node.JS HTTP Server: socket.io
var io = require('socket.io')(http);


var port = 8000; 
var ip = '10.10.10.100'

//required for serving locally when testing
var serveStatic = require('serve-static')
app.use(serveStatic(__dirname + '/static/css'))
app.use(serveStatic(__dirname + '/static/lib'))
app.use(serveStatic(__dirname + '/static/js'))
app.use(serveStatic(__dirname + '/node_static'))
app.use(serveStatic(__dirname + '/static/three.js/examples/js/controls'))
app.use(serveStatic(__dirname + '/static/three.js/build'))
app.use(serveStatic(__dirname + '/static/ammo.js/builds/'))


//serve HTML to initial get request
app.get('/', function(request, response){
	response.sendFile(__dirname+'/node_static/game1.html');
});

//socketio listener for 'connection'
io.on('connection', function(socket){
  console.log('a user connected');
  socket.on('chat message',function(msg){
	  console.log(msg);
	  io.emit('chat message',msg);
  });
});

http.listen(port,ip, function(){
	console.log('At '+ip+' listening on port: '+port);
	console.log('serving files from: '+__dirname);
	});		
	
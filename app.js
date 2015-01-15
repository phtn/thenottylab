var express = require('express'),
    app = express();

var mongoose = require('mongoose');
var s = require('http').Server(app),
    port = 3000;

s.listen(port, function () {
    console.log('listening to port: ' + port);
});

var io = require('socket.io').listen(s);

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

io.sockets.on('connection', function (socket) {
    
    socket.on('new user', function (d, cb) {
        if (d in users) {
            cb(false);
        } else {
            cb(true);
            socket.nickname = d;
            users[socket.nickname] = socket;
            updateNick();
        }
    });

    socket.on('send message', function (d, cb) {
        var msg = d.trim();
        if (msg.substr(0,3) === ':: ') {
            msg = msg.substr(3);
            var ind = msg.indexOf(' ');
            if (ind !== -1){
                var name = msg.substring(0, ind);
                var msg = msg.substring(ind + 1);
                if (name in users){
                    users[name].emit('whisper', {msg: msg, nick: socket.nickname});
                    console.log('whisper');
                } else {
                    cb('error: not a valid user');   
                }
            } else {
                cb('error: not valid whisper');
            }
        } else {
            io.sockets.emit('new message', {msg: d, nick: socket.nickname});
        }
    });
    
    function updateNick(){
        io.sockets.emit('users', Object.keys(users));
    }
    
    socket.on('disconnect', function(data){
        if(!socket.nickname) return;
        delete users[socket.nickname];
        updateNick();
    });

});

var users = {};

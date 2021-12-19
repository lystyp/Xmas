const express = require('express');
const app = express();

const server = require('http').Server(app);
const io = require('socket.io')(server);
 
app.get('/', (req, res) => {
  console.log('login !'); 
  res.sendFile( __dirname + '/login.html');
});

app.get('/user', (req, res) => {
  console.log('get user request, name = ' + req.query.name); 
  res.sendFile( __dirname + '/chat.html');
});

app.get('/manager', (req, res) => {
  console.log('get manager request'); 
  res.sendFile( __dirname + '/manager.html');
});

let clients = [];
let sendMsg = function(msgInfo) {
  for (let c of clients) {
    c.emit("newMsg", msgInfo);
  }
}

io.on('connection', (socket) => {
    console.log('socket connection !'); 
    clients.push(socket);
    socket.on("send", (msgInfo) => {
      console.log('send, user = ' + msgInfo.name + ", msg = " + msgInfo.msg);
      sendMsg(msgInfo);
    });
});
 
server.listen(process.env.PORT || 8000, () => {
  console.log("Server created.")   
});

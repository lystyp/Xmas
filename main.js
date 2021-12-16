const express = require('express');
const app = express();

const server = require('http').Server(app);
const io = require('socket.io')(server);
 
app.get('/', (req, res) => {
  console.log('get request !'); 
  res.sendFile( __dirname + '/chat.html');
});

io.on('connection', (socket) => {
    console.log('socket connection !'); 
 
    socket.on('disconnect', () => {
        console.log('socket disconnect~'); 
    });

    socket.on("send", (msgInfo) => {
      console.log('send' + msgInfo);
      socket.emit("newMsg", msgInfo);
    });
});
 
server.listen(process.env.PORT || 8000, () => {
  console.log("Server created.")   
});
 
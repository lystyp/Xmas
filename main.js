const express = require('express');
const app = express();

const server = require('http').Server(app);
const io = require('socket.io')(server);
 
let RANK_MAX = 10
let reward_points = [10,9,8,7,6,5,4,3,2,1]
let basic_points = 1

var answer = ""
var rank = 0
var userMap = {}

app.get('/', (req, res) => {
  console.log('login !'); 
  res.sendFile( __dirname + '/login.html');
});

app.get('/user', (req, res) => {
  console.log('get user request, name = ' + req.query.name); 
  userMap[req.query.name] = 
  {
    name: req.query.name,
    score: 0
  }
  res.sendFile( __dirname + '/chat.html');
});

app.get('/manager', (req, res) => {
  console.log('get manager request'); 
  //TODO: When starting next round remember to reset rank; get answer value 
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
      if(msgInfo.msg == "answer") {
        if(rank < RANK_MAX) {
          userMap[msgInfo.name].score = userMap[msgInfo.name].score + reward_points[rank]
        }else {
          userMap[msgInfo.name].score = userMap[msgInfo.name].score + basic_points
        }
        msgInfo.msg = "答對囉!!!"
        rank++
      }
      console.log("score: " + userMap[msgInfo.name].score)
      sendMsg(msgInfo);
    });
});
 
server.listen(8000, () => {
  console.log("Server created.")   
});

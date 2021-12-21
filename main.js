const express = require('express');
const app = express();

const server = require('http').Server(app);
const io = require('socket.io')(server);
 
let RANK_MAX = 10
let reward_points = [10,9,8,7,6,5,4,3,2,1]
let basic_points = 1

var answer = ""
var stop = false;
var rank = 0
var userMap = {}
var currentImage = ""
var answeredUser = {};

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
  //TODO: When starting next round remember to reset rank; get answer value 
  res.sendFile( __dirname + '/manager.html');
});

app.get('/image', (req, res) => {
  console.log('get image url'); 
  res.sendFile( __dirname + '/image/' + req.query.image_name);
});

let clients = [];
let sendMsg = function(msgInfo) {
  for (let c of clients) {
    c.emit("newMsg", msgInfo);
  }
}

let userScoreChanged = function() {
  for (let c of clients) {
    c.emit("userScoreChanged", userMap);
  }
}

io.on('connection', (socket) => {
    console.log('socket connection !'); 
    clients.push(socket);

    socket.on("send", (msgInfo) => {
      console.log('send, user = ' + msgInfo.name + ", msg = " + msgInfo.msg);
      if (stop) {
        sendMsg({name:"主持人", msg: msgInfo.name + "!不要再猜了~~"});
        return;
      }

      if(msgInfo.msg != "" && msgInfo.msg == answer) {
        if (answeredUser[answer].includes(msgInfo.name) ) {
          msgInfo.msg = "不要洗分數!!!"
        } else {
          msgInfo.msg = "答對囉!!!"
          if (answeredUser[answer])
            answeredUser[answer].push(msgInfo.name);
          else
            answeredUser[answer] = [msgInfo.name];
          for (let c of clients) {
            c.emit("someoneAnswered", answeredUser);
          }

          if(rank < RANK_MAX) {
            userMap[msgInfo.name].score = userMap[msgInfo.name].score + reward_points[rank]
          }else {
            userMap[msgInfo.name].score = userMap[msgInfo.name].score + basic_points
          }
          rank++
          userScoreChanged();
        }
      }
      sendMsg(msgInfo);
    });

    socket.on("next_round", (data) => {
      console.log('next_round : ' + JSON.stringify(data));
      if (Object.keys(answeredUser).includes(data.answer)) {
        let a = currentImage.split('=');
        let imagename = a[a.length-1];
        answeredUser[answer + "-" + imagename ] = answeredUser[answer]
      }

      currentImage = data.image;
      answer = data.answer;
      answeredUser[answer] = [];
      rank = 0;
      stop = false;
      for (let c of clients) {
        c.emit("someoneAnswered", answeredUser);
        c.emit("next_round", currentImage);
      }
      sendMsg({name:"主持人", msg:"開始猜題~~~~~"});
    });

    socket.on("joinGame", (name) => {
      console.log('joinGame :' + name);
      if (name != null && name != undefined && !userMap[name] ) {
        userMap[name] = 
        {
          name: name,
          score: 0,
        }
        userScoreChanged();
      }
      let debug = process.env.DEBUG == "1";
      socket.emit("initData", {image:currentImage, score:userMap, debug:debug, answeredUser:answeredUser});
    });

    
    socket.on("stop", () => {
      console.log('stop ');
      stop = true;
      sendMsg({name:"主持人", msg: "請停止猜題~~~~~"});
    });

    socket.on("test", () => {
      console.log('test ');
      for (let c of clients) {
        c.emit("testClient", answer);
      }
    });

    socket.on("stopTest", () => {
      console.log('stopTest ');
      for (let c of clients) {
        c.emit("stopTestClient");
      }
    });

    socket.on('reset', () => {
      console.log('reset'); 
      answer = ""
      rank = 0
      userMap = {}
      stop = false;
      currentImage = ""
      answeredUser = {};
      for (let c of clients) {
        c.disconnect();
      }
    });

    socket.on('resetScore', () => {
      console.log('resetScore');
      for (let i of Object.values(userMap)) {
        i.score = 0;
      }
      answeredUser = {};
      answer = ""
      rank = 0;
      userScoreChanged();
    });
});
 
server.listen(process.env.PORT || 8000, () => {
  console.log("Server created.")   
});

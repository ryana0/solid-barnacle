const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const fs = require('fs')

app.set('port', 3000)

app.use(express.static(__dirname))

let readyNum = 0

io.on('connection', (socket) => {
    socket.on('join', (args) => {
      args.socketId = socket.id
      io.emit('userJoined', args)
      users = JSON.parse(fs.readFileSync(__dirname + '/users.json'))
      users.users.push(args)
      fs.writeFileSync(__dirname + '/users.json', JSON.stringify(users))
    })
    socket.on('userRequest', (id) => {
      users = JSON.parse(fs.readFileSync(__dirname + '/users.json')).users
      io.to(id).emit('userArray', users)
    })
    socket.on('disconnect', () => {
      users = JSON.parse(fs.readFileSync(__dirname + '/users.json'))
      for(i = 0; i < users.users.length; i++) {
        if(users.users[i].socketId == socket.id) {
          users.users.splice(i, 1)
        }
      }
      io.emit('userDisconnect', users.users)
      fs.writeFileSync(__dirname + '/users.json', JSON.stringify(users))
    })
    socket.on('ready', () => {
      users = JSON.parse(fs.readFileSync(__dirname + '/users.json'))
      usersNum = users.users.length
      readyNum++
      if(usersNum == readyNum) {
        io.emit('startGame')
        io.emit('readyFraction', readyNum + '/' + usersNum)
      } else {
        io.emit('readyFraction', readyNum + '/' + usersNum)
      }
    })
});

server.listen(process.env.PORT || 3000, () => {
  console.log('go to http://localhost:3000/startPage/')
  empty = {
    users: []
  }
  fs.writeFileSync(__dirname + '/users.json', JSON.stringify(empty))
})
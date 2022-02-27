const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const fs = require('fs')

app.set('port', 3000)

app.use(express.static(__dirname))

app.get('/', (req, res) => {
  res.send('Hello World!');
});

let readyNum = 0

function game() {
  fuseTime = ((Math.ceil(Math.random() * 3) + 6) * 10) + (Math.ceil(Math.random() * 9))

  fractionTimes = {
    halfTime: Math.round(fuseTime / 2),
    quarterTime: Math.round(fuseTime / 4),
    eighthTime: Math.round(fuseTime / 8)
  }

  gameTime = fuseTime
  timePass = setInterval(() => {
    gameTime--
  }, 1000);

  gameTick = setInterval(() => {
    if(gameTime == fractionTimes.halfTime) {
      io.emit('halfTime')

    } else if (gameTime == fractionTimes.quarterTime) {
      io.emit('quarterTime')

    } else if (gameTime == fractionTimes.eighthTime) {
      io.emit('eighthTime')

    } else if (gameTime == 0) {
      io.emit('explosion')
      clearInterval(gameTick)
      clearInterval(timePass)

    }
  }, 100);

}

io.on('connection', (socket) => {
    socket.on('join', (args) => {
      args.socketId = socket.id
      console.log(args)
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
        game()
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
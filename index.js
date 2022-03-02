const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const fs = require('fs')
const Typo = require('typo-js')
const dictionary = new Typo(["en_US"])
const letterPairs = ['th', 'he', 'an', 'in', 'er', 'nd', 're', 'ed', 'es', 'ou', 'to', 'ha', 'en', 'ea', 'st', 'nt', 'on', 'at', 'hi', 'as', 'it', 'ng', 'is', 'or', 'et', 'of', 'ti', 'ar', 'te', 'se', 'me', 'sa', 'ne', 'wa', 've', 'le', 'no', 'ta', 'al', 'de', 'ot', 'so', 'dt', 'll', 'tt', 'el', 'ro', 'ad', 'di', 'ew', 'ra', 'ri', 'sh' ]
// 53 pairs
function randomLetterPair() {
  return letterPairs[Math.round(Math.random() * 52)]
}

app.set('port', 3000)

app.use(express.static(__dirname))

app.get('/', (req, res) => {
  res.send('Hello World!');
});

let readyNum = 0

function game() {
  fuseTime = ((Math.ceil(Math.random() * 3) + 6) * 10) + (Math.ceil(Math.random() * 9))
  users = JSON.parse(fs.readFileSync(__dirname + '/users.json'))
  userCount = users.users.length
  turn = 0

  io.emit('nextTurn', users.users[0])
  io.emit('letterPair', randomLetterPair())
  io.to(users.users[0].socketId).emit('yourTurn')

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
    users = JSON.parse(fs.readFileSync(__dirname + '/users.json'))
    userCount = users.users.length
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
    socket.on('typing', (args) => {
        wordPkg = {
          word: args,
          valid: true
        }
        io.emit('userTyping', wordPkg)
      
    })
});

server.listen(process.env.PORT || 3000, () => {
  console.log('go to http://localhost:3000/startPage/')
  empty = {
    users: []
  }
  fs.writeFileSync(__dirname + '/users.json', JSON.stringify(empty))
})
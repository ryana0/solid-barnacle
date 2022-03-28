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

function nextTurn(users, turn, keypair) {
      io.emit('nextTurn', {
        user: users.users[turn],
        key1: keypair.split('')[0],
        key2: keypair.split('')[1]
      })
      io.to(users.users[turn].socketId).emit('yourTurn', keypair)
}

function game() {
  fuseTime = ((Math.ceil(Math.random() * 3) + 6) * 10) + (Math.ceil(Math.random() * 9))
  users = JSON.parse(fs.readFileSync(__dirname + '/users.json'))
  userCount = users.users.length
  turn = 0

  nextTurn(users, turn, randomLetterPair())
  turn++ 

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
      io.emit('explosion', users.users[turn])
      clearInterval(gameTick)
      clearInterval(timePass)
      console.log(users.users)
      fs.writeFileSync(__dirname + '/users.json', JSON.stringify(users))
      winObj = {
        users: JSON.parse(fs.readFileSync(__dirname + '/users.json')).users
      }
      io.emit('winner', winObj)
    }
  }, 100);

  
}

io.on('connection', (socket) => {
    socket.on('join', (args) => {
      args.socketId = socket.id
      args.score = 0
      args.done = false
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
        readyNum = 0
        io.emit('startGame', users)
        game()
        io.emit('readyFraction', readyNum + '/' + usersNum)
      } else {
        io.emit('readyFraction', readyNum + '/' + usersNum)
      }
    })
    socket.on('typing', (args) => {
      if(dictionary.check(args.value.toString())) {
        wordPkg = {
          word: args.value,
          valid: true,
          spellCheck: true
        }
        turnWord = args.value.toString().split('')
        if(turnWord.includes(args.keypair.split('')[0])) {
          if(turnWord.includes(args.keypair.split('')[1]) && turnWord.indexOf(args.keypair.split('')[0]) + 1 == turnWord.indexOf(args.keypair.split('')[1])) {
            users = JSON.parse(fs.readFileSync(__dirname + '/users.json'))
            wordPkg.indexKey1 = turnWord.indexOf(args.keypair.split('')[0])
            wordPkg.indexKey2 = turnWord.indexOf(args.keypair.split('')[1])
            io.emit('userTyping', wordPkg)

          } else {
            wordPkg.indexKey1 = turnWord.indexOf(args.keypair.split('')[0])
            wordPkg.indexKey2 = undefined
            io.emit('userTyping', wordPkg)
          }
        }
      } else {
        wordPkg = {
          word: args.value,
          valid: false,
          spellCheck: false
        }
        io.emit('userTyping', wordPkg)
      }
    })
    socket.on('turnDone', () => {
      users = JSON.parse(fs.readFileSync(__dirname + '/users.json'))
      for(i = 0; i < users.users.length; i++) {
        if(users.users[i].socketId == socket.id) {
          users.users[i].done = true
          fs.writeFileSync(__dirname + '/users.json', JSON.stringify(users))
        }
      }
  
    })
  
    socket.on('turnConfirm', (args) => {
      words = JSON.parse(fs.readFileSync(__dirname + '/words.json'))
      users = JSON.parse(fs.readFileSync(__dirname + '/users.json'))

      for(i = 0; i < users.users.length; i++) {
        if(users.users[i].done == true && users.users[i].socketId == socket.id) {
          if (JSON.parse(fs.readFileSync(__dirname + '/words.json')).words.includes(args.toString())) {
            io.to(socket.id).emit('alreadySaidThatWord')
            users.users[i].done = false
            return;
          }

          if(turn == userCount) {
            turn = 0
            nextTurn(users, turn, randomLetterPair())
            turn++
          } else {
            nextTurn(users, turn, randomLetterPair())
            turn++
          }

          words.words.push(args)
          fs.writeFileSync(__dirname + '/words.json', JSON.stringify(words))
      
          for(j = 0; j < users.users.length; j++) {
            if(users.users[j].socketId == socket.id) {
              users.users[j].score = users.users[j].score + 10
              users.users[j].done = false
              console.log('added 10 points to ' + users.users[j].name + '!')
            }
          }
          fs.writeFileSync(__dirname + '/users.json', JSON.stringify(users))
        }
      }
    })
});

server.listen(process.env.PORT || 3000, () => {
  console.log('go to http://localhost:3000/play/')
  empty = {
    users: []
  }
  emptyWords = {
    words: []
  }
  fs.writeFileSync(__dirname + '/words.json', JSON.stringify(emptyWords))
  fs.writeFileSync(__dirname + '/users.json', JSON.stringify(empty))
})
const socket = io()
const avatar = document.querySelector('#avatar')

function generateSeed() {
    seed = []
    for(i = 0; i < 10; i++) {
        seed.push(Math.round(Math.random() * 9))
    }
    return seed.join("")
}

socket.on("connect", () => {
    if(document.querySelector('#sidebar').childElementCount == 0) {
        socket.emit('userRequest', socket.id)
    }
});

socket.on('userArray', (args) => {
    for(i = 0; i < args.length; i++) {
        avatarImg = document.createElement('img')
        if(args[i].socketId == socket.id) {
            avatarImg.classList.add('userAvatar')
        }
        avatarImg.src = args[i].avatar
        avatarImg.classList.add('avatar')
        document.querySelector('#sidebar').append(avatarImg)
    }
})

socket.on('userDisconnect', (args) => {
    document.querySelector('#sidebar').innerHTML = ''
    for(i = 0; i < args.length; i++) {
        avatarImg = document.createElement('img')
        if(args[i].socketId == socket.id) {
            avatarImg.classList.add('userAvatar')
        }
        avatarImg.src = args[i].avatar
        avatarImg.classList.add('avatar')
        document.querySelector('#sidebar').append(avatarImg)
    }
})

avatar.setAttribute('seed', generateSeed())
avatar.src = "https://avatars.dicebear.com/api/bottts/" + avatar.getAttribute('seed') + ".png?textureChance=0"

const generateNew = document.querySelector('#genNew')
generateNew.addEventListener('click', () => {
    avatar.setAttribute('seed', generateSeed())
    avatar.src = "https://avatars.dicebear.com/api/bottts/" + avatar.getAttribute('seed') + ".png?textureChance=0"
})

const contentInit = document.querySelector('#contentInit')
const content = document.querySelector('#content')
const header = document.querySelector('#header')
const sidebar = document.querySelector('#sidebar')
const main = document.querySelector('#main')
const join = document.querySelector('#join')
const bomb = document.querySelector('#bomb')
join.addEventListener('click', () => {
    user = {
        name: document.querySelector('#nameInput').value,
        avatar: document.querySelector('#avatar').src,
        seed: document.querySelector('#avatar').getAttribute('seed')
    }

    socket.emit("join", user)
    main.classList.add('side')
    contentInit.classList.add('contentOut')
    sidebar.classList.add('sideIn')
    header.classList.add('headerCorner')
    content.classList.add('contentIn')
    bomb.classList.add('showBomb')

    setTimeout(() => {
        contentInit.remove()
    }, 100);
})

const notification = document.querySelector('#notif')
socket.on('userJoined', (args) => {
        notification.querySelector('h1').textContent = args.name + ' has joined the game!'
        notification.classList.toggle('popup')
        setTimeout(() => {
            notification.querySelector('h1').textContent = ''
            notification.classList.toggle('popup')
        }, 2700);
        avatarImg = document.createElement('img')
        if(args.socketId == socket.id) {
            avatarImg.classList.add('userAvatar')
        }
        avatarImg.src = args.avatar
        avatarImg.classList.add('avatar')
        avatarImg.title = args.name
        document.querySelector('#sidebar').append(avatarImg)
})

const readyBtn = document.querySelector('#ready')
const readyNum = document.querySelector('#readyNum')
readyBtn.addEventListener('click', () => {
    if(!readyBtn.classList.contains('isReady')) {
        readyBtn.classList.add('isReady')
        socket.emit('ready', '')
    }
})

socket.on('readyFraction', (args) => {
    readyNum.textContent = args
})

const input = document.querySelector('#wordsInput')
const boom = document.querySelector('#boom')

socket.on('startGame', () => {
    readyBtn.classList.add('readyOut1')
    readyNum.classList.add('readyOut2')
    bomb.classList.add('tick')
})

socket.on('halfTime', () => {
    bomb.classList.remove('tick')
    bomb.classList.add('tickHalf')
})

socket.on('quarterTime', () => {
    bomb.classList.remove('tickHalf')
    bomb.classList.add('tickQuarter')
})

socket.on('eighthTime', () => {
    bomb.classList.remove('tickQuarter')
    bomb.classList.add('tickEighth')
})

socket.on('explosion', () => {
    main.classList.add('shake')
    boom.style.visibility = 'visible'
    setTimeout(() => {
        bomb.style.display = 'none'
        setTimeout(() => {
            boom.style.visibility = 'hidden'
        }, 300);
    }, 100);
})

const avatarImage = document.querySelector('#avatarImage')
const currentUser = document.querySelector('#currentUser')
socket.on('nextTurn', (args) => {
    avatarImage.setAttribute('href', "https://avatars.dicebear.com/api/bottts/" + args.seed + ".svg?textureChance=0")
    currentUser.textContent = args.name
})

socket.on('yourTurn', () => {
    input.style.background = '#292d36 !important'
    input.disabled = false
    input.addEventListener('keyup', () => {
        socket.emit('typing', input.value)
        console.log(input.value)
    })
})

let keypair = ''

socket.on('letterPair', (args) => {
    keypair = args
})

socket.on('userTyping', (args) => {
    document.querySelector('#typing').innerHTML = ''
    turnWord = args.word.split("")
    if(turnWord.includes(keypair.split('')[0])) {
        if(turnWord.includes(keypair.split('')[1]) && turnWord.indexOf(keypair.split('')[0]) == turnWord.indexOf(keypair.split('')[1])--) {

        } else {

        }
    } else {
        turnWord.forEach(value => {
            letterBox = document.createElement('h1')
            letterBox.textContent = value
            letterBox.classList.add('letter')
            document.querySelector('#typing').appendChild(letterBox)
        })
    }
})
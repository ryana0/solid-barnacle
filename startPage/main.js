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

avatar.src = "https://avatars.dicebear.com/api/bottts/" + generateSeed() + ".png?textureChance=0"

const generateNew = document.querySelector('#genNew')
generateNew.addEventListener('click', () => {
    avatar.src = "https://avatars.dicebear.com/api/bottts/" + generateSeed() + ".png?textureChance=0"
})

const contentInit = document.querySelector('#contentInit')
const content = document.querySelector('#content')
const header = document.querySelector('#header')
const sidebar = document.querySelector('#sidebar')
const main = document.querySelector('#main')
const join = document.querySelector('#join')
join.addEventListener('click', () => {
    user = {
        name: document.querySelector('#nameInput').value,
        avatar: document.querySelector('#avatar').src
    }

    socket.emit("join", user)
    main.classList.add('side')
    contentInit.classList.add('contentOut')
    sidebar.classList.add('sideIn')
    header.classList.add('headerCorner')
    content.classList.add('contentIn')
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
    readyBtn.classList.add('isReady')
    socket.emit('ready', '')
})

socket.on('readyFraction', (args) => {
    readyNum.textContent = args
})

socket.on('startGame', () => {
    readyBtn.classList.add('readyOut1')
    readyNum.classList.add('readyOut2')
})
const socket = io()
const avatar = document.querySelector('#avatar')
const sessionStorage = window.sessionStorage

window.onload = () => {
    window.moveTo(0, 0);
    window.resizeTo(screen.availWidth, screen.availHeight);
}

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
const bomb = document.querySelector('.bomb')
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
socket.on('startGame', (args) => {
    readyBtn.classList.add('readyOut1')
    readyNum.classList.add('readyOut2')
    bomb.classList.add('tick')
    sessionStorage.setItem('users', JSON.stringify(args))
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

socket.on('explosion', (args) => {
    users = JSON.parse(sessionStorage.getItem('users'))
    main.classList.add('shake')
    boom.style.visibility = 'visible'
    for(i = 0; i < users.length; i++) {
        for(j = 0; j < users.length; j++) {
            if(document.querySelector('#sidebar').children[j] == users[i]) {
                document.querySelector('#sidebar').children[j].style.opacity = '0.5'
            }
        }
    }
    setTimeout(() => {
        bomb.style.display = 'none'
        setTimeout(() => {
            boom.style.visibility = 'hidden'
        }, 300);
    }, 100);
})

const keypair1 = document.querySelector('#key1')
const keypair2 = document.querySelector('#key2')
const avatarImage = document.querySelector('#avatarImage')
const currentUser = document.querySelector('#currentUser')
socket.on('nextTurn', (args) => {
    keypair1.style.display = 'block'
    keypair2.style.display = 'block'
    avatarImage.setAttribute('href', "https://avatars.dicebear.com/api/bottts/" + args.user.seed + ".svg?textureChance=0")
    currentUser.textContent = args.user.name
    keypair1.textContent = args.key1
    keypair2.textContent = args.key2
    document.querySelector('#typing').innerHTML = ''
    input.value = ''
    input.disabled = true
})

socket.on('yourTurn', (args) => {
    keypair1.textContent = args.split('')[0]
    keypair2.textContent = args.split('')[1]
    input.style.background = '#292d36 !important'
    input.disabled = false
    input.style.border  = 'none'
    input.addEventListener('keyup', (e) => {
        e.preventDefault()
        socket.emit('typing', {
            value: input.value,
            keypair: args
        })
        if(e.keyCode == 13) {
            socket.emit('turnConfirm', input.value)
        } else if (e.keyCode == 8) {
            console.log('asedfiouahebfp')
        }
    })
})

socket.on('userTyping', (args) => {
    document.querySelector('#typing').innerHTML = ''
    turnWord = args.word.split('')

    if(args.spellCheck == true) {
        input.style.border  = 'none'
    } else {
        input.style.border  = 'solid 5px red'
    }
    if(args.indexKey1 && !args.indexKey2) {
        turnWord.forEach(value => {
            letterBox = document.createElement('h1')
            letterBox.textContent = value
            letterBox.classList.add('letter')
            if(turnWord.indexOf(value) == args.indexKey1) {
                letterBox.classList.add('letterPairValid')
            } else if (turnWord.indexOf(value) == args.indexKey1 + 1) {
                letterBox.classList.add('letterPairInvalid')
            }
            document.querySelector('#typing').appendChild(letterBox)
        })
    } else if (args.indexKey1 && args.indexKey2) {
        socket.emit('turnDone')
        turnWord.forEach(value => {
            letterBox = document.createElement('h1')
            letterBox.textContent = value
            letterBox.classList.add('letter')
            if(turnWord.indexOf(value) == args.indexKey1 || turnWord.indexOf(value) == args.indexKey2) {
                letterBox.classList.add('letterPairValid')
            }
            document.querySelector('#typing').appendChild(letterBox)
        })
    } else if (args.indexKey1 == 0) {
        socket.emit('turnDone')
        turnWord.forEach(value => {
            letterBox = document.createElement('h1')
            letterBox.textContent = value
            letterBox.classList.add('letter')
            if(turnWord.indexOf(value) == args.indexKey1 || turnWord.indexOf(value) == args.indexKey2) {
                letterBox.classList.add('letterPairValid')
            }
            document.querySelector('#typing').appendChild(letterBox)
        })
    } else {
        turnWord.forEach(value => {
            letterBox = document.createElement('h1')
            letterBox.textContent = value
            letterBox.classList.add('letter')
            document.querySelector('#typing').appendChild(letterBox)
        })
    }
})

socket.on('alreadySaidThatWord', () => {
    input.style.border = 'solid 5px #ffea00'
})

const lb = document.querySelector('#lb')
socket.on('winner', (args) => {
    console.log(args)
    args.users.forEach(value => {
        console.log(value)
        entry = document.createElement('li')
        entry.classList.add('listItem')
        entry.textContent = value.name + ' - ' + value.score + (value.dead == true ? ' (dead imagine)': '')
        lb.append(entry)
    })
})
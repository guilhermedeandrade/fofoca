const socket = io()

const $messageForm = document.querySelector('form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocationButton = document.getElementById('send-location')
const $messages = document.getElementById('messages')
const $sidebar = document.getElementById('sidebar')

const messageTemplate = document.getElementById('message-template').innerHTML
const locationMessageTemplate = document.getElementById(
  'location-message-template'
).innerHTML
const sidebarTemplate = document.getElementById('sidebar-template').innerHTML

const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true
})

const autoScroll = () => {
  const $newMessage = $messages.lastElementChild

  const newMessageStyles = getComputedStyle($newMessage)
  const newMessageMargin = parseInt(newMessageStyles.marginBottom)
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

  const visibleHeight = $messages.offsetHeight

  const containerHeight = $messages.scrollHeight
  
  const scrollOffset = $messages.scrollTop + visibleHeight

  if (containerHeight - newMessageHeight <= scrollOffset) {
    $messages.scrollTop = $messages.scrollHeight
  }
}

socket.on('message', message => {
  const html = Mustache.render(messageTemplate, {
    message: message.text,
    createdAt: moment(message.createdAt).format('h:mm a')
  })

  $messages.insertAdjacentHTML('beforeend', html)

  autoScroll()
})

socket.on('locationMessage', messsage => {
  const html = Mustache.render(locationMessageTemplate, {
    locationUrl: messsage.locationUrl,
    createdAt: moment(messsage.createdAt).format('h:mm a')
  })

  $messages.insertAdjacentHTML('beforeend', html)

  autoScroll()
})

socket.on('roomData', ({ room, users }) => {
  const html = Mustache.render(sidebarTemplate, {
    room,
    users
  })

  $sidebar.innerHTML = html
})

$messageForm.addEventListener('submit', e => {
  e.preventDefault()

  $messageFormButton.setAttribute('disabled', 'disabled')

  const message = e.target.elements.message.value

  socket.emit('sendMessage', message, error => {
    $messageFormButton.removeAttribute('disabled')
    $messageFormInput.value = ''
    $messageFormInput.focus()

    if (error) {
      return console.log(error)
    }

    console.log('Message delivered!')
  })
})

$sendLocationButton.addEventListener('click', () => {
  $sendLocationButton.setAttribute('disabled', 'disabled')

  if (!navigator.geolocation) {
    return alert('Geolocation is not supported by your browser')
  }

  navigator.geolocation.getCurrentPosition(position => {
    const { latitude, longitude } = position.coords

    socket.emit('sendLocation', { latitude, longitude }, () => {
      $sendLocationButton.removeAttribute('disabled')
      console.log('Location shared')
    })
  })
})

socket.emit('join', { username, room }, error => {
  if (error) {
    alert(error)
    location.href = '/'
  }
})

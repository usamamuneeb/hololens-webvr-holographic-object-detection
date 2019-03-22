const fs = require('fs'),
  http = require('http'),
  socketio = require('socket.io')

const readFile = file => new Promise((resolve, reject) =>
  fs.readFile(file, (err, data) => err ? reject(err) : resolve(data)))


const server = http.createServer(async(request, response) => {
  try {
    pageName = request.url.substr(1).split('?')[0]
    console.log("Requested Page: ")
    console.log(pageName)
    if (pageName == "") {
      pageName = "index.html"
    }
    data = await readFile(pageName)
    response.end(data)
  } catch (err) {
    response.end()
  }
})

let client = []

const io = socketio(server)

io.sockets.on('connection', socket => {
  clients = [...client, socket]
  socket.on('disconnect', () => clients = clients.filter(s => s !== socket))
  socket.on('to_server', data => {console.log(data); clients.forEach(s => s.emit('to_client', data))})
})

console.log('server up and running')
server.listen(8000)

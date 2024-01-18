const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);
const userNames = new Map();

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
  console.log('User connected');

  const userName = `user${Math.floor(Math.random() * 1000)}`;
  userNames.set(socket.id, userName);

  socket.emit('user connected', userName);

  socket.on('chat message', (msg) => {
    const userName = userNames.get(socket.id);
    io.emit('chat message', `${userName}: ${msg}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
    userNames.delete(socket.id);
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

app.get('/', (req, res) => {
  res.send('hi');
});
app.get('/json', (req, res) => {
  const responseObject = {
    text: 'hi',
    numbers: [1, 2, 3],
  };
  res.json(responseObject);
});

app.get('/echo', (req, res) => {
  const input = req.query.input;

  const response = {
    normal: input,
    shouty: input.toUpperCase(),
    characterCount: input.length,
    backwards: input.split('').reverse().join(''),
  };

  res.json(response);
});


app.get('/chat', (req, res) => {
  const message = req.query.message;
  io.emit('chat message', message);
  res.send('Message sent to all clients.');
});

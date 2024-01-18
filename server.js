const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);
const userNames = new Map();

app.use(express.static(path.join(__dirname, 'public')));

// Роут для / - plain text message "hi"
app.get('/', (req, res) => {
  res.send('hi');
});

// Роут для /json - JSON object с text и numbers
app.get('/json', (req, res) => {
  const responseObject = {
    text: 'hi',
    numbers: [1, 2, 3],
  };
  res.json(responseObject);
});

// Роут для /echo - эхо в различных форматах
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

// Роут для /static/* - статические файлы из "mychat" директории
app.use('/static', express.static(path.join(__dirname, 'mychat')));

// Роут для /chat - отправка 'message' события с сообщением из query параметра
app.get('/chat', (req, res) => {
  const message = req.query.message;
  io.emit('chat message', message);
  res.send('Message sent to all clients.');
});

// Роут для /sse - установка SSE соединения и отправка сообщений в реальном времени
app.get('/sse', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const sendData = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  setInterval(() => {
    sendData({ message: 'Server-Sent Event message' });
  }, 1000);
});

// Событие подключения пользователя к WebSocket
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

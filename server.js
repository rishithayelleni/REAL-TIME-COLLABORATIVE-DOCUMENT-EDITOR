// server/server.js
const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const { Server } = require('socket.io');

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  }
});

// MongoDB Setup
mongoose.connect("mongodb://127.0.0.1:27017/collab-editor", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const Document = mongoose.model('Document', new mongoose.Schema({
  _id: String,
  data: Object,
}));

// WebSocket Events
io.on('connection', socket => {
  socket.on("get-document", async documentId => {
    let document = await Document.findById(documentId);
    if (!document) {
      document = await Document.create({ _id: documentId, data: "" });
    }
    socket.join(documentId);
    socket.emit("load-document", document.data);

    socket.on("send-changes", delta => {
      socket.broadcast.to(documentId).emit("receive-changes", delta);
    });

    socket.on("save-document", async data => {
      await Document.findByIdAndUpdate(documentId, { data });
    });
  });
});

server.listen(5000, () => {
  console.log("Server listening on http://localhost:5000");
});

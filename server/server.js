const mongoose = require("mongoose");
const Document = require("./Documnet");
const express = require("express");

mongoose.connect(
  "mongodb+srv://pesfifa200020:IlA7qdORhg5AED5x@cluster0.fi3wq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
);

const io = require("socket.io")(3001, {
  cors: {
    origin: ["http://localhost:3000"],
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  socket.on("get-document", async (documentId) => {
    const document = await findOrCreateDocument(documentId);
    socket.join(documentId);
    socket.emit("load-document", {
      data: document.data,
      name: document.name,
    });

    socket.on("send-changes", (delta) => {
      socket.broadcast.to(documentId).emit("receive-changes", delta);
    });

    socket.on("save-document", async (data, callback) => {
      try {
        await Document.findByIdAndUpdate(documentId, { data });
        if (typeof callback === "function") callback({ ok: true });
      } catch (error) {
        if (typeof callback === "function")
          callback({ ok: false, message: error.message });
      }
    });

    socket.on("rename-document", async (newName, callback) => {
      try {
        await Document.findByIdAndUpdate(documentId, { name: newName });
        socket.broadcast.to(documentId).emit("document-renamed", newName);
        if (typeof callback === "function") callback({ ok: true });
      } catch (error) {
        if (typeof callback === "function")
          callback({ ok: false, message: error.message });
      }
    });
  });
});

async function findOrCreateDocument(id) {
  if (id == null) return;
  const document = await Document.findById(id);
  if (document) return document;
  return await Document.create({ _id: id });
}

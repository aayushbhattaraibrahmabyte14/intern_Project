const express = require("express");
const { Server } = require("socket.io");
let io;
const userSockets = new Map(); // Map to store multiple sockets per user
const offlineMessages = new Map(); // Map to store offline messages

const getSocketId = (receiverId) => {
  const socketIds = userSockets.get(receiverId);
  if (socketIds) {
    console.log(`Socket IDs for user ${receiverId}:`, socketIds);
    return socketIds;
  } else {
    console.error(`No sockets found for user ${receiverId}`);
    return null;
  }
};

const init = (server) => {
  io = new Server(server, {
    cors: {
      origin: "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId;

    if (userId && userId !== "undefined" && userId !== "null") {
      console.log(`User connected: ${userId} with socket ID: ${socket.id}`);

      // Register the user's socket
      if (!userSockets.has(userId)) {
        userSockets.set(userId, new Set());
      }
      userSockets.get(userId).add(socket.id);

      // Deliver any offline messages
      if (offlineMessages.has(userId)) {
        const messages = offlineMessages.get(userId);
        messages.forEach((msg) => {
          socket.emit("receiveDirectMessage", msg);
        });
        offlineMessages.delete(userId);
      }
    }

    console.log(userSockets);

    socket.on("disconnect", () => {
      if (userId && userSockets.has(userId)) {
        userSockets.get(userId).delete(socket.id);
        if (userSockets.get(userId).size === 0) {
          userSockets.delete(userId);
        }
        console.log(
          `User disconnected: ${userId} with socket ID: ${socket.id}`
        );
      }
    });

    socket.on("editMessage", (data) => {
      const { messageId, newContent, senderId, receiverId } = data;
      if (userSockets.has(receiverId)) {
        userSockets.get(receiverId).forEach((socketId) => {
          io.to(socketId).emit("messageUpdated", {
            messageId,
            newContent,
            senderId,
            updatedAt: new Date().toISOString(),
          });
        });
      }
      // Also emit to the sender's other devices
      if (userSockets.has(senderId)) {
        userSockets.get(senderId).forEach((socketId) => {
          if (socketId !== socket.id) {
            io.to(socketId).emit("messageUpdated", {
              messageId,
              newContent,
              senderId,
              updatedAt: new Date().toISOString(),
            });
          }
        });
      }
    });

    socket.on("register", (userId) => {
      if (!userSockets.has(userId)) {
        userSockets.set(userId, new Set());
      }
      userSockets.get(userId).add(socket.id);

      if (offlineMessages.has(userId)) {
        const messages = offlineMessages.get(userId);
        messages.forEach((msg) => {
          socket.emit("receiveDirectMessage", msg);
        });
        offlineMessages.delete(userId);
      }
    });

    // Join the channel room on request
    socket.on("joinChannel", (channelId) => {
      socket.join(channelId);
      console.log(`User ${userId} joined channel ${channelId}`);
    });

    socket.on("receiveMessage", (messageData) => {
      console.log("Message received:", messageData);
      // Handle the received message
    });

    // Leave the channel room on request
    socket.on("leaveChannel", (channelId) => {
      socket.leave(channelId);
      console.log(`User ${userId} left channel ${channelId}`);
    });

    

    socket.on("sendMessage", (messageData) => {
      const { channelId, content, messageType, receiverId } = messageData;
    
      if (messageType === "channel") {
        // Emit to channel
        io.to(channelId).emit("receiveMessage", messageData);
      } else if (messageType === "direct") {
        // Emit to specific user
        const receiverSocketIds = getSocketId(receiverId);
        if (receiverSocketIds) {
          receiverSocketIds.forEach(socketId => {
            io.to(socketId).emit("receiveDirectMessage", messageData);
          });
        } else {
          // Store offline messages if necessary
          if (!offlineMessages.has(receiverId)) {
            offlineMessages.set(receiverId, []);
          }
          offlineMessages.get(receiverId).push(messageData);
        }
      }
    });
    

    socket.on("sendDirectMessage", (messageData) => {
      console.log("Received sendDirectMessage event:", messageData);
      const { receiver, sender } = messageData;
    
      // Send to receiver
      sendMessageToUser(receiver, "receiveDirectMessage", messageData);
    
      // Confirm to sender
      sendMessageToUser(sender, "messageSent", messageData);
    });
    

    socket.on("offer", (data) => {
      if (io.sockets.sockets.get(data.to)) {
        io.to(data.to).emit("offer", data.offer);
      } else {
        console.log(`Socket ${data.to} not connected for offer`);
      }
    });

    socket.on("answer", (data) => {
      console.log("Received answer:", data);
      io.to(data.to).emit("answer", data.answer);
    });

    socket.on("ice-candidate", (data) => {
      console.log("Received ICE candidate:", data);
      io.to(data.to).emit("ice-candidate", data.candidate);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error("Socket.IO instance is not initialized");
  }
  return io;
};

const sendMessageToChannel = (channelId, messageData) => {
  console.log(`Emitting message to channel ${channelId}:`, messageData);
  io.to(channelId).emit("receiveMessage", messageData);
};

 

const sendMessageToUser = (userId, eventName, data) => {
  const userSocketIds = userSockets.get(userId);
  if (userSocketIds) {
    userSocketIds.forEach((socketId) => {
      io.to(socketId).emit(eventName, data);
    });
    console.log(
      `Emitted ${eventName} to user ${userId} across ${userSocketIds.size} sockets.`
    );
    return true;
  }
  console.log(
    `Failed to emit ${eventName} to user ${userId}: User not connected`
  );
  return false;
};

module.exports = {
  init,
  getIO,
  getSocketId,
  sendMessageToUser,
  sendMessageToChannel,
};
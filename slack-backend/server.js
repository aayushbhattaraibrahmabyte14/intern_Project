const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const http = require('http');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const socket = require('./socket');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socket.init(server); // Initialize Socket.IO

// CORS Configuration
app.use(cors({
    origin: ['http://localhost:3000', 'http://192.168.1.71:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));

// Middleware to make io available in req
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Ensure the uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('Directory created:', uploadsDir);
} else {
    console.log('Directory already exists:', uploadsDir);
}

// Middleware setup
app.use(express.json({ limit: '10mb' })); // Increase the limit as needed
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Increase the limit as needed
app.use('/uploads', express.static(uploadsDir));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

// Use routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/workspaces', require('./routes/workspaceRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));
app.use('/api/reactions', require('./routes/reactionRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/threads', require('./routes/threadRoutes'));
app.use('/api/calls', require('./routes/callRoutes'));
app.use('/api/webrtc', require('./routes/webRoutes'));
app.use('/api/direct-message', require('./routes/directMessageRoutes'));
app.use('/api/channels', require('./routes/channelRoutes'));
app.use('/uploads', express.static('uploads'));
app.use("/api/files", require("./routes/fileRoutes"));


// Socket.IO configuration
const userSocketMap = new Map();

io.on('connection', (socket) => {
    console.log('New client connected');

    // Register a user to a socket
    socket.on('register', (userId) => {
        userSocketMap.set(userId, socket.id);
    });

    // Disconnect handling
    socket.on('disconnect', () => {
        userSocketMap.forEach((value, key) => {
            if (value === socket.id) {
                userSocketMap.delete(key);
            }
        });
        console.log('Client disconnected');
    });

    // Join a channel
    socket.on('joinChannel', (channelId) => {
        socket.join(channelId);
        console.log(`Client joined channel: ${channelId}`);
    });

    // Leave a channel
    socket.on('leaveChannel', (channelId) => {
        socket.leave(channelId);
        console.log(`Client left channel: ${channelId}`);
    });

    // Handle sending and receiving messages
    socket.on('sendMessage', (message) => {
        console.log('Received message:', message);
        io.to(message.channelId).emit('receiveMessage', message);
    });

    // Handle direct messages
    socket.on('sendDirectMessage', (data) => {
        const { receiverId, message } = data;
        const receiverSocketId = userSocketMap.get(receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit('receiveDirectMessage', message);
        }
    });

    // WebRTC signaling
    socket.on('offer', (data) => {
        console.log('Received offer:', data);
        io.to(data.to).emit('offer', data.offer);
    });

    socket.on('answer', (data) => {
        console.log('Received answer:', data);
        io.to(data.to).emit('answer', data.answer);
    });

    socket.on('ice-candidate', (data) => {
        console.log('Received ICE candidate:', data);
        io.to(data.to).emit('ice-candidate', data.candidate);
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

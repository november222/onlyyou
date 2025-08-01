const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);

// Configure CORS for Socket.IO
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.use(cors());
app.use(express.json());

// Store active connections and room pairs
const activeConnections = new Map();
const roomPairs = new Map(); // roomCode -> { user1: socketId, user2: socketId }

// Generate unique room codes
function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    activeConnections: activeConnections.size,
    activeRooms: roomPairs.size,
    timestamp: new Date().toISOString()
  });
});

// Generate room code endpoint
app.post('/generate-room', (req, res) => {
  const roomCode = generateRoomCode();
  res.json({ roomCode });
});

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);
  
  activeConnections.set(socket.id, {
    socketId: socket.id,
    roomCode: null,
    connectedAt: new Date()
  });

  // Join room with code
  socket.on('join-room', ({ roomCode, publicKey }) => {
    console.log(`User ${socket.id} attempting to join room: ${roomCode}`);
    
    if (!roomPairs.has(roomCode)) {
      // First user in room
      roomPairs.set(roomCode, { 
        user1: { socketId: socket.id, publicKey },
        user2: null 
      });
      
      socket.join(roomCode);
      activeConnections.get(socket.id).roomCode = roomCode;
      
      socket.emit('room-joined', { 
        roomCode, 
        isFirst: true,
        message: 'Waiting for your partner to join...' 
      });
      
    } else {
      const room = roomPairs.get(roomCode);
      
      if (room.user2 === null && room.user1.socketId !== socket.id) {
        // Second user joining
        room.user2 = { socketId: socket.id, publicKey };
        
        socket.join(roomCode);
        activeConnections.get(socket.id).roomCode = roomCode;
        
        // Notify both users that room is ready
        socket.emit('room-joined', { 
          roomCode, 
          isFirst: false,
          partnerPublicKey: room.user1.publicKey,
          message: 'Connected! You can now start chatting.' 
        });
        
        socket.to(roomCode).emit('partner-joined', { 
          partnerPublicKey: room.user2.publicKey,
          message: 'Your partner has joined!' 
        });
        
        console.log(`Room ${roomCode} is now full with 2 users`);
        
      } else {
        // Room is full or user trying to rejoin
        socket.emit('room-error', { 
          message: 'Room is full or you are already in this room' 
        });
      }
    }
  });

  // WebRTC signaling
  socket.on('webrtc-offer', ({ roomCode, offer }) => {
    console.log(`WebRTC offer from ${socket.id} in room ${roomCode}`);
    socket.to(roomCode).emit('webrtc-offer', { offer, from: socket.id });
  });

  socket.on('webrtc-answer', ({ roomCode, answer }) => {
    console.log(`WebRTC answer from ${socket.id} in room ${roomCode}`);
    socket.to(roomCode).emit('webrtc-answer', { answer, from: socket.id });
  });

  socket.on('webrtc-ice-candidate', ({ roomCode, candidate }) => {
    console.log(`ICE candidate from ${socket.id} in room ${roomCode}`);
    socket.to(roomCode).emit('webrtc-ice-candidate', { candidate, from: socket.id });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    
    const connection = activeConnections.get(socket.id);
    if (connection && connection.roomCode) {
      const roomCode = connection.roomCode;
      const room = roomPairs.get(roomCode);
      
      if (room) {
        // Notify partner about disconnection
        socket.to(roomCode).emit('partner-disconnected', {
          message: 'Your partner has disconnected'
        });
        
        // Clean up room if both users are gone
        if (room.user1?.socketId === socket.id) {
          room.user1 = null;
        } else if (room.user2?.socketId === socket.id) {
          room.user2 = null;
        }
        
        // Remove room if empty
        if (!room.user1 && !room.user2) {
          roomPairs.delete(roomCode);
          console.log(`Room ${roomCode} deleted - no active users`);
        }
      }
    }
    
    activeConnections.delete(socket.id);
  });

  // Heartbeat for connection monitoring
  socket.on('ping', () => {
    socket.emit('pong');
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Only You Signaling Server running on port ${PORT}`);
  console.log(`📡 WebSocket endpoint: ws://localhost:${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
});
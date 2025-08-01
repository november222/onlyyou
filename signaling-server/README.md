# Only You - Signaling Server

A lightweight Node.js signaling server for WebRTC peer-to-peer communication.

## Features

- Room-based connection management (max 2 users per room)
- WebRTC signaling (SDP offers/answers, ICE candidates)
- Public key exchange for end-to-end encryption
- Connection monitoring and cleanup
- Health check endpoint

## Installation

```bash
cd signaling-server
npm install
```

## Running the Server

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

The server will run on port 3001 by default.

## API Endpoints

- `GET /health` - Server health check
- `POST /generate-room` - Generate a new room code

## WebSocket Events

### Client to Server
- `join-room` - Join a room with code and public key
- `webrtc-offer` - Send WebRTC offer
- `webrtc-answer` - Send WebRTC answer
- `webrtc-ice-candidate` - Send ICE candidate
- `ping` - Heartbeat

### Server to Client
- `room-joined` - Successfully joined room
- `partner-joined` - Partner joined the room
- `room-error` - Error joining room
- `partner-disconnected` - Partner disconnected
- `webrtc-offer` - Received WebRTC offer
- `webrtc-answer` - Received WebRTC answer
- `webrtc-ice-candidate` - Received ICE candidate
- `pong` - Heartbeat response

## Deployment

For production deployment, consider:

1. **Environment Variables**
   ```bash
   PORT=3001
   NODE_ENV=production
   ```

2. **Process Management**
   ```bash
   npm install -g pm2
   pm2 start server.js --name "only-you-signaling"
   ```

3. **Reverse Proxy** (nginx example)
   ```nginx
   location /socket.io/ {
     proxy_pass http://localhost:3001;
     proxy_http_version 1.1;
     proxy_set_header Upgrade $http_upgrade;
     proxy_set_header Connection "upgrade";
   }
   ```

## Security Notes

- Server only handles signaling, no user data is stored
- All actual communication happens P2P between clients
- Public keys are exchanged through server but encryption happens client-side
- Rooms are automatically cleaned up when empty
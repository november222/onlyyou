# Only You - P2P Messaging App

A secure, peer-to-peer messaging and calling app designed exclusively for two people. Built with React Native, Expo, and WebRTC.

## Features

### 🔒 **Exclusive Two-Person Design**
- Strict one-to-one connection policy
- Room-based pairing system (max 2 users per room)
- No groups, no strangers - just you and your partner

### 🛡️ **Privacy & Security**
- End-to-end encryption for all communications
- No data stored on servers
- Lightweight signaling server (only for connection setup)
- STUN server support for NAT traversal

## Architecture

### Client (React Native + Expo)
- **WebRTC Service**: Handles P2P connections, encryption, and communication
- **UI Components**: Beautiful, intimate interface with dark theme
- **Call Screen**: Full-screen calling interface with controls

### Signaling Server (Node.js + Socket.IO)
- Lightweight server for WebRTC signaling only
- Room management (max 2 users per room)
- SDP offer/answer exchange
- ICE candidate relay
- Public key exchange for encryption setup

### P2P Communication
- Direct WebRTC connection between devices
- Data channels for messaging
- Media streams for audio/video calls
- STUN servers for NAT traversal

## Installation & Setup

### 1. Install Dependencies

```bash
# Install mobile app dependencies
npm install

# Install signaling server dependencies
cd signaling-server
npm install
cd ..
```

### 2. Start the Signaling Server

```bash
cd signaling-server
npm run dev
```

The server will run on `http://localhost:3001`

### 3. Start the Mobile App

```bash
npm run dev
```

## Usage

### Connecting Two Devices

1. **First Device**: 
   - Open the Connection tab
   - Tap "Create New Room"
   - Share the generated room code with your partner

2. **Second Device**:
   - Open the Connection tab  
   - Enter the room code
   - Tap "Join"

3. **Both devices** will establish a direct P2P connection

### Messaging
- Once connected, use the Messages tab to send encrypted messages
- All messages are sent directly between devices (no server)

### Calling
- Tap the phone icon for voice calls
- Tap the video icon for video calls
- All calls are direct P2P connections

## Technical Details

### WebRTC Configuration
- **STUN Servers**: `stun.l.google.com:19302`, `stun1.l.google.com:19302`
- **Data Channels**: Ordered, reliable messaging
- **Media Constraints**: Audio always enabled, video optional

### Encryption
- **Key Exchange**: ECDH (simplified implementation for demo)
- **Message Encryption**: AES encryption with derived shared key
- **Key Storage**: Secure local storage using AsyncStorage

### Dependencies
- `react-native-webrtc`: WebRTC implementation for React Native
- `socket.io-client`: Signaling server communication
- `crypto-js`: Encryption/decryption
- `@react-native-async-storage/async-storage`: Secure local storage

## Deployment

### Mobile App
```bash
# Build for production
npm run build:web

# Or create native builds using EAS
npx eas build --platform all
```

### Signaling Server
```bash
# Production deployment
cd signaling-server
npm start

# Or use PM2 for process management
pm2 start server.js --name "only-you-signaling"
```

### Environment Variables
```bash
# Signaling server
PORT=3001
NODE_ENV=production

# Update SIGNALING_SERVER URL in WebRTCService.ts for production
```

## Security Considerations

1. **Server Security**: The signaling server only handles connection setup, no user data
2. **Key Management**: Private keys are stored locally, never transmitted
3. **Network Security**: All communication is encrypted end-to-end
4. **NAT Traversal**: STUN servers help establish direct connections
5. **Fallback**: Consider adding TURN servers for symmetric NAT scenarios

## Limitations & Future Improvements

### Current Limitations
- Simplified ECDH implementation (use proper crypto libraries in production)
- No persistent message storage
- Basic reconnection handling
- Web platform limitations (some WebRTC features)

### Future Improvements
- Proper ECDH key exchange with elliptic curve cryptography
- Message persistence with local encryption
- Advanced reconnection strategies
- TURN server integration for difficult network scenarios
- Push notifications for offline messages
- File sharing capabilities

## Contributing

This is a demonstration project showing P2P messaging architecture. For production use:

1. Implement proper cryptographic libraries
2. Add comprehensive error handling
3. Implement message persistence
4. Add push notification support
5. Enhance security auditing

## License

MIT License - See LICENSE file for details
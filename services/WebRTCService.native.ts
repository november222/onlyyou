import { Platform } from 'react-native';
import io, { Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Only import crypto on native platforms
let CryptoJS: any = null;
if (Platform.OS !== 'web') {
  CryptoJS = require('crypto-js');
}

// Dynamic imports for native WebRTC components
let RTCPeerConnection: any = null;
let RTCIceCandidate: any = null;
let RTCSessionDescription: any = null;
let mediaDevices: any = null;
let MediaStream: any = null;

// Initialize WebRTC components only on native platforms
if (Platform.OS !== 'web') {
  try {
    const webrtc = require('react-native-webrtc');
    RTCPeerConnection = webrtc.RTCPeerConnection;
    RTCIceCandidate = webrtc.RTCIceCandidate;
    RTCSessionDescription = webrtc.RTCSessionDescription;
    mediaDevices = webrtc.mediaDevices;
    MediaStream = webrtc.MediaStream;
  } catch (error) {
    console.warn('WebRTC not available:', error);
  }
}

export interface WebRTCMessage {
  id: string;
  text: string;
  timestamp: Date;
  isOwn: boolean;
  encrypted: boolean;
}

export interface ConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  roomCode: string | null;
  partnerConnected: boolean;
  error: string | null;
}

class WebRTCService {
  private peerConnection: RTCPeerConnection | null = null;
  private socket: Socket | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  
  // Encryption
  private sharedKey: string | null = null;
  private privateKey: string | null = null;
  private publicKey: string | null = null;
  
  // Configuration
  private readonly SIGNALING_SERVER = 'http://localhost:3001'; // For development on Windows
  private readonly STUN_SERVERS = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ];
  
  // Event callbacks
  public onConnectionStateChange: ((state: ConnectionState) => void) | null = null;
  public onMessageReceived: ((message: WebRTCMessage) => void) | null = null;
  public onRemoteStream: ((stream: MediaStream) => void) | null = null;
  public onLocalStream: ((stream: MediaStream) => void) | null = null;

  private connectionState: ConnectionState = {
    isConnected: false,
    isConnecting: false,
    roomCode: null,
    partnerConnected: false,
    error: null,
  };

  constructor() {
    if (Platform.OS === 'web') {
      this.updateConnectionState({
        error: 'WebRTC features are not available on web platform. Please use the mobile app for full functionality.'
      });
      return;
    } else {
      this.generateKeyPair();
    }
  }

  // Generate ECDH key pair for encryption
  private async generateKeyPair() {
    if (Platform.OS === 'web' || !CryptoJS) {
      console.warn('Crypto not available on this platform');
      return;
    }
    
    try {
      // In a real implementation, use proper ECDH key generation
      // For demo purposes, using a simplified approach
      this.privateKey = CryptoJS.lib.WordArray.random(32).toString();
      this.publicKey = CryptoJS.SHA256(this.privateKey).toString();
      
      await AsyncStorage.setItem('privateKey', this.privateKey);
      await AsyncStorage.setItem('publicKey', this.publicKey);
    } catch (error) {
      console.error('Key generation failed:', error);
    }
  }

  // Derive shared key from partner's public key
  private deriveSharedKey(partnerPublicKey: string) {
    if (!this.privateKey || Platform.OS === 'web' || !CryptoJS) return;
    
    // Simplified key derivation - in production, use proper ECDH
    this.sharedKey = CryptoJS.SHA256(this.privateKey + partnerPublicKey).toString();
  }

  // Encrypt message
  private encryptMessage(message: string): string {
    if (!this.sharedKey || Platform.OS === 'web' || !CryptoJS) return message;
    
    try {
      const encrypted = CryptoJS.AES.encrypt(message, this.sharedKey).toString();
      return encrypted;
    } catch (error) {
      console.error('Encryption failed:', error);
      return message;
    }
  }

  // Decrypt message
  private decryptMessage(encryptedMessage: string): string {
    if (!this.sharedKey || Platform.OS === 'web' || !CryptoJS) return encryptedMessage;
    
    try {
      const decrypted = CryptoJS.AES.decrypt(encryptedMessage, this.sharedKey);
      return decrypted.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error('Decryption failed:', error);
      return encryptedMessage;
    }
  }

  // Update connection state
  private updateConnectionState(updates: Partial<ConnectionState>) {
    this.connectionState = { ...this.connectionState, ...updates };
    this.onConnectionStateChange?.(this.connectionState);
  }

  // Initialize WebRTC peer connection
  private initializePeerConnection() {
    if (Platform.OS === 'web' || !RTCPeerConnection) {
      console.warn('WebRTC not available on this platform');
      return;
    }

    const configuration = {
      iceServers: this.STUN_SERVERS,
    };

    this.peerConnection = new RTCPeerConnection(configuration);

    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.socket && this.connectionState.roomCode) {
        this.socket.emit('webrtc-ice-candidate', {
          roomCode: this.connectionState.roomCode,
          candidate: event.candidate,
        });
      }
    };

    // Handle remote stream
    this.peerConnection.onaddstream = (event) => {
      this.remoteStream = event.stream;
      this.onRemoteStream?.(event.stream);
    };

    // Handle connection state changes
    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection?.connectionState;
      console.log('WebRTC connection state:', state);
      
      if (state === 'connected') {
        this.updateConnectionState({ isConnected: true, isConnecting: false });
      } else if (state === 'disconnected' || state === 'failed') {
        this.updateConnectionState({ isConnected: false, isConnecting: false });
      }
    };

    // Create data channel for messaging
    this.dataChannel = this.peerConnection.createDataChannel('messages', {
      ordered: true,
    });

    this.dataChannel.onopen = () => {
      console.log('Data channel opened');
    };

    this.dataChannel.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const decryptedText = this.decryptMessage(data.text);
        
        const message: WebRTCMessage = {
          id: data.id,
          text: decryptedText,
          timestamp: new Date(data.timestamp),
          isOwn: false,
          encrypted: true,
        };
        
        this.onMessageReceived?.(message);
      } catch (error) {
        console.error('Failed to parse message:', error);
      }
    };

    // Handle incoming data channel
    this.peerConnection.ondatachannel = (event) => {
      const channel = event.channel;
      channel.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const decryptedText = this.decryptMessage(data.text);
          
          const message: WebRTCMessage = {
            id: data.id,
            text: decryptedText,
            timestamp: new Date(data.timestamp),
            isOwn: false,
            encrypted: true,
          };
          
          this.onMessageReceived?.(message);
        } catch (error) {
          console.error('Failed to parse message:', error);
        }
      };
    };
  }

  // Connect to signaling server
  public async connectToSignalingServer(): Promise<void> {
    if (Platform.OS === 'web') {
      this.updateConnectionState({ 
        error: 'WebRTC features are not available on web platform. Please use the mobile app for full functionality.' 
      });
      throw new Error('WebRTC not supported on web platform');
    }

    return new Promise((resolve, reject) => {
      this.socket = io(this.SIGNALING_SERVER, {
        transports: ['websocket'],
        timeout: 10000,
      });

      this.socket.on('connect', () => {
        console.log('Connected to signaling server');
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('Signaling server connection failed:', error);
        this.updateConnectionState({ error: 'Failed to connect to server' });
        reject(error);
      });

      this.socket.on('room-joined', ({ roomCode, isFirst, partnerPublicKey }) => {
        console.log('Joined room:', roomCode);
        this.updateConnectionState({ roomCode, isConnecting: !isFirst });
        
        if (partnerPublicKey) {
          this.deriveSharedKey(partnerPublicKey);
          this.initializePeerConnection();
          if (!isFirst) {
            this.createOffer();
          }
        }
      });

      this.socket.on('partner-joined', ({ partnerPublicKey }) => {
        console.log('Partner joined');
        this.updateConnectionState({ partnerConnected: true });
        this.deriveSharedKey(partnerPublicKey);
        this.initializePeerConnection();
        this.createOffer();
      });

      this.socket.on('webrtc-offer', async ({ offer }) => {
        if (this.peerConnection) {
          await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
          const answer = await this.peerConnection.createAnswer();
          await this.peerConnection.setLocalDescription(answer);
          
          this.socket?.emit('webrtc-answer', {
            roomCode: this.connectionState.roomCode,
            answer,
          });
        }
      });

      this.socket.on('webrtc-answer', async ({ answer }) => {
        if (this.peerConnection) {
          await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
        }
      });

      this.socket.on('webrtc-ice-candidate', async ({ candidate }) => {
        if (this.peerConnection) {
          await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        }
      });

      this.socket.on('partner-disconnected', () => {
        console.log('Partner disconnected');
        this.updateConnectionState({ 
          partnerConnected: false, 
          isConnected: false,
          error: 'Partner disconnected' 
        });
      });

      this.socket.on('room-error', ({ message }) => {
        console.error('Room error:', message);
        this.updateConnectionState({ error: message });
      });
    });
  }

  // Join room with code
  public async joinRoom(roomCode: string): Promise<void> {
    if (Platform.OS === 'web') {
      this.updateConnectionState({ 
        isConnecting: false, 
        error: 'Room joining requires mobile platform' 
      });
      throw new Error('Room joining not supported on web platform');
    }

    if (!this.socket || !this.publicKey) {
      throw new Error('Not connected to signaling server or no public key');
    }

    this.updateConnectionState({ isConnecting: true, error: null });
    
    this.socket.emit('join-room', {
      roomCode: roomCode.toUpperCase(),
      publicKey: this.publicKey,
    });
  }

  // Create WebRTC offer
  private async createOffer() {
    if (!this.peerConnection) return;

    try {
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);
      
      this.socket?.emit('webrtc-offer', {
        roomCode: this.connectionState.roomCode,
        offer,
      });
    } catch (error) {
      console.error('Failed to create offer:', error);
    }
  }

  // Send text message
  public sendMessage(text: string): WebRTCMessage | null {
    if (Platform.OS === 'web') {
      console.warn('Message sending not available on web platform');
      return null;
    }

    if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
      console.error('Data channel not ready');
      return null;
    }

    const message: WebRTCMessage = {
      id: Date.now().toString(),
      text,
      timestamp: new Date(),
      isOwn: true,
      encrypted: true,
    };

    const encryptedText = this.encryptMessage(text);
    const messageData = {
      id: message.id,
      text: encryptedText,
      timestamp: message.timestamp.toISOString(),
    };

    try {
      this.dataChannel.send(JSON.stringify(messageData));
      return message;
    } catch (error) {
      console.error('Failed to send message:', error);
      return null;
    }
  }

  // Start audio/video call
  public async startCall(video: boolean = false): Promise<void> {
    if (Platform.OS === 'web' || !mediaDevices) {
      throw new Error('Calling not supported on web platform');
    }

    try {
      const constraints = {
        audio: true,
        video: video ? { facingMode: 'user' } : false,
      };

      this.localStream = await mediaDevices.getUserMedia(constraints);
      this.onLocalStream?.(this.localStream);

      if (this.peerConnection) {
        this.peerConnection.addStream(this.localStream);
      }
    } catch (error) {
      console.error('Failed to start call:', error);
      throw error;
    }
  }

  // End call
  public endCall(): void {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
    
    if (this.remoteStream) {
      this.remoteStream = null;
    }
  }

  // Get connection state
  public getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  // Disconnect
  public disconnect(): void {
    this.endCall();
    
    if (this.dataChannel) {
      this.dataChannel.close();
      this.dataChannel = null;
    }
    
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
    
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.updateConnectionState({
      isConnected: false,
      isConnecting: false,
      partnerConnected: false,
      roomCode: null,
      error: null,
    });
  }

  // Generate room code
  public async generateRoomCode(): Promise<string> {
    if (Platform.OS === 'web') {
      throw new Error('Room code generation not supported on web platform');
    }

    try {
      const response = await fetch(`${this.SIGNALING_SERVER}/generate-room`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      const data = await response.json();
      return data.roomCode;
    } catch (error) {
      console.error('Failed to generate room code:', error);
      throw error;
    }
  }
}

export default new WebRTCService();
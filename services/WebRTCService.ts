import { Platform } from 'react-native';

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
  // Mock data for frontend development
  private mockMessages: WebRTCMessage[] = [
    {
      id: '1',
      text: 'Hey babe! How was your day? 💕',
      timestamp: new Date(Date.now() - 3600000),
      isOwn: false,
      encrypted: true,
    },
    {
      id: '2', 
      text: 'It was good! Missing you though ❤️',
      timestamp: new Date(Date.now() - 3500000),
      isOwn: true,
      encrypted: true,
    },
    {
      id: '3',
      text: 'Can\'t wait to see you tonight! 😘',
      timestamp: new Date(Date.now() - 3000000),
      isOwn: false,
      encrypted: true,
    },
  ];

  private connectionState: ConnectionState = {
    isConnected: true, // Mock as connected
    isConnecting: false,
    roomCode: 'ABC123',
    partnerConnected: true,
    error: null,
  };

  // Event callbacks
  public onConnectionStateChange: ((state: ConnectionState) => void) | null = null;
  public onMessageReceived: ((message: WebRTCMessage) => void) | null = null;
  public onRemoteStream: ((stream: any) => void) | null = null;
  public onLocalStream: ((stream: any) => void) | null = null;

  constructor() {
    console.log('WebRTC Service: Running in frontend-only mode with mock data');
    
    // Simulate loading mock messages after a delay
    setTimeout(() => {
      this.mockMessages.forEach(message => {
        if (!message.isOwn) {
          this.onMessageReceived?.(message);
        }
      });
    }, 1000);
  }

  // Update connection state
  private updateConnectionState(updates: Partial<ConnectionState>) {
    this.connectionState = { ...this.connectionState, ...updates };
    this.onConnectionStateChange?.(this.connectionState);
  }

  // Mock: Connect to signaling server
  public async connectToSignalingServer(): Promise<void> {
    console.log('Mock: Connecting to signaling server...');
    
    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    this.updateConnectionState({
      isConnected: true,
      isConnecting: false,
      partnerConnected: true,
      roomCode: 'ABC123',
      error: null,
    });
    
    console.log('Mock: Connected to signaling server');
  }

  // Mock: Join room with code
  public async joinRoom(roomCode: string): Promise<void> {
    console.log(`Mock: Joining room ${roomCode}...`);
    
    this.updateConnectionState({ isConnecting: true, error: null });
    
    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    this.updateConnectionState({
      isConnected: true,
      isConnecting: false,
      roomCode: roomCode.toUpperCase(),
      partnerConnected: true,
      error: null,
    });
    
    console.log(`Mock: Successfully joined room ${roomCode}`);
  }

  // Mock: Send text message
  public sendMessage(text: string): WebRTCMessage | null {
    console.log(`Mock: Sending message: ${text}`);
    
    const message: WebRTCMessage = {
      id: Date.now().toString(),
      text,
      timestamp: new Date(),
      isOwn: true,
      encrypted: true,
    };

    // Simulate partner response after delay
    setTimeout(() => {
      const responses = [
        'I love you too! 💕',
        'That sounds amazing! 😍',
        'Can\'t wait! ❤️',
        'You\'re the best! 🥰',
        'Miss you so much! 💖',
        'Aww that\'s so sweet! 😘',
      ];
      
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
      const partnerMessage: WebRTCMessage = {
        id: (Date.now() + 1).toString(),
        text: randomResponse,
        timestamp: new Date(),
        isOwn: false,
        encrypted: true,
      };
      
      this.onMessageReceived?.(partnerMessage);
    }, 1000 + Math.random() * 2000);

    return message;
  }

  // Mock: Start audio/video call
  public async startCall(video: boolean = false): Promise<void> {
    console.log(`Mock: Starting ${video ? 'video' : 'audio'} call...`);
    
    // Simulate call setup delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log(`Mock: ${video ? 'Video' : 'Audio'} call started`);
  }

  // Mock: End call
  public endCall(): void {
    console.log('Mock: Call ended');
  }

  // Get connection state
  public getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  // Mock: Disconnect
  public disconnect(): void {
    console.log('Mock: Disconnecting...');
    
    this.updateConnectionState({
      isConnected: false,
      isConnecting: false,
      partnerConnected: false,
      roomCode: null,
      error: null,
    });
    
    console.log('Mock: Disconnected');
  }

  // Mock: Generate room code
  public async generateRoomCode(): Promise<string> {
    console.log('Mock: Generating room code...');
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    console.log(`Mock: Generated room code: ${roomCode}`);
    
    return roomCode;
  }
}

export default new WebRTCService();
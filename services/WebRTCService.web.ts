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
  // Event callbacks
  public onConnectionStateChange: ((state: ConnectionState) => void) | null = null;
  public onMessageReceived: ((message: WebRTCMessage) => void) | null = null;
  public onRemoteStream: ((stream: any) => void) | null = null;
  public onLocalStream: ((stream: any) => void) | null = null;

  private connectionState: ConnectionState = {
    isConnected: false,
    isConnecting: false,
    roomCode: null,
    partnerConnected: false,
    error: 'WebRTC features are not available on web platform. Please use the mobile app for full functionality.',
  };

  constructor() {
    console.warn('WebRTC Service: Web platform detected - limited functionality available');
  }

  // Update connection state
  private updateConnectionState(updates: Partial<ConnectionState>) {
    this.connectionState = { ...this.connectionState, ...updates };
    this.onConnectionStateChange?.(this.connectionState);
  }

  // Connect to signaling server - Web fallback
  public async connectToSignalingServer(): Promise<void> {
    this.updateConnectionState({ 
      error: 'WebRTC features are not available on web platform. Please use the mobile app for full functionality.' 
    });
    throw new Error('WebRTC not supported on web platform');
  }

  // Join room with code - Web fallback
  public async joinRoom(roomCode: string): Promise<void> {
    this.updateConnectionState({ 
      isConnecting: false, 
      error: 'Room joining requires mobile platform' 
    });
    throw new Error('Room joining not supported on web platform');
  }

  // Send text message - Web fallback
  public sendMessage(text: string): WebRTCMessage | null {
    console.warn('Message sending not available on web platform');
    return null;
  }

  // Start audio/video call - Web fallback
  public async startCall(video: boolean = false): Promise<void> {
    throw new Error('Calling not supported on web platform');
  }

  // End call - Web fallback
  public endCall(): void {
    console.warn('End call not available on web platform');
  }

  // Get connection state
  public getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  // Disconnect - Web fallback
  public disconnect(): void {
    this.updateConnectionState({
      isConnected: false,
      isConnecting: false,
      partnerConnected: false,
      roomCode: null,
      error: 'WebRTC features are not available on web platform. Please use the mobile app for full functionality.',
    });
  }

  // Generate room code - Web fallback
  public async generateRoomCode(): Promise<string> {
    throw new Error('Room code generation not supported on web platform');
  }
}

export default new WebRTCService();
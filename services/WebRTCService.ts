import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

export interface SavedConnection {
  roomCode: string;
  partnerName?: string;
  connectionDate: string;
  lastConnected: string;
  buzzCallsCount?: number;
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
    isConnected: false, // Start disconnected
    isConnecting: false,
    roomCode: null,
    partnerConnected: false,
    error: null,
  };

  private savedConnection: SavedConnection | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isAutoReconnecting = false;

  // Event callbacks
  public onConnectionStateChange: ((state: ConnectionState) => void) | null = null;
  public onMessageReceived: ((message: WebRTCMessage) => void) | null = null;
  public onRemoteStream: ((stream: any) => void) | null = null;
  public onLocalStream: ((stream: any) => void) | null = null;

  constructor() {
    console.log('WebRTC Service: Running in frontend-only mode with mock data');
    
    // Load saved connection and try to auto-reconnect
    this.loadSavedConnection();
  }

  // Load saved connection from storage
  private async loadSavedConnection(): Promise<void> {
    try {
      const saved = await AsyncStorage.getItem('savedConnection');
      if (saved) {
        this.savedConnection = JSON.parse(saved);
        console.log('Loaded saved connection:', this.savedConnection?.roomCode);
        
        // Auto-reconnect to saved room
        if (this.savedConnection?.roomCode) {
          this.autoReconnect();
        }
      }
    } catch (error) {
      console.error('Failed to load saved connection:', error);
    }
  }

  // Save connection to storage
  private async saveConnection(roomCode: string): Promise<void> {
    try {
      const connection: SavedConnection = {
        roomCode,
        partnerName: 'My Love',
        connectionDate: new Date().toISOString(),
        lastConnected: new Date().toISOString(),
      };
      
      await AsyncStorage.setItem('savedConnection', JSON.stringify(connection));
      this.savedConnection = connection;
      console.log('Saved connection:', roomCode);
    } catch (error) {
      console.error('Failed to save connection:', error);
    }
  }

  // Auto-reconnect to saved room
  private async autoReconnect(): Promise<void> {
    if (this.isAutoReconnecting || !this.savedConnection?.roomCode) return;
    
    this.isAutoReconnecting = true;
    console.log('Auto-reconnecting to saved room...');
    
    this.updateConnectionState({ 
      isConnecting: true, 
      error: 'Đang kết nối lại...' 
    });
    
    try {
      // Simulate reconnection delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await this.joinRoom(this.savedConnection.roomCode);
      
      // Load mock messages after successful reconnection
      setTimeout(() => {
        this.mockMessages.forEach(message => {
          if (!message.isOwn) {
            this.onMessageReceived?.(message);
          }
        });
      }, 1000);
      
    } catch (error) {
      console.error('Auto-reconnect failed:', error);
      this.updateConnectionState({ 
        isConnecting: false, 
        error: 'Kết nối lại thất bại. Vui lòng thử lại.' 
      });
      
      // Retry after 10 seconds
      this.scheduleReconnect();
    } finally {
      this.isAutoReconnecting = false;
    }
  }

  // Schedule reconnection attempt
  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    
    this.reconnectTimer = setTimeout(() => {
      if (!this.connectionState.isConnected && this.savedConnection) {
        this.autoReconnect();
      }
    }, 10000); // Retry every 10 seconds
  }

  // Simulate network disconnection and reconnection
  public simulateNetworkIssue(): void {
    if (this.connectionState.isConnected) {
      console.log('Simulating network disconnection...');
      this.updateConnectionState({
        isConnected: false,
        isConnecting: false,
        partnerConnected: false,
        error: 'Mất kết nối mạng',
      });
      
      // Try to reconnect after 3 seconds
      setTimeout(() => {
        this.autoReconnect();
      }, 3000);
    }
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
    
    console.log('Mock: Connected to signaling server');
  }

  // Mock: Join room with code
  public async joinRoom(roomCode: string): Promise<void> {
    console.log(`Mock: Joining room ${roomCode}...`);
    
    this.updateConnectionState({ isConnecting: true, error: null });
    
    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Save this connection for future auto-reconnect
    await this.saveConnection(roomCode);
    
    this.updateConnectionState({
      isConnected: true,
      isConnecting: false,
      roomCode: roomCode.toUpperCase(),
      partnerConnected: true,
      error: null,
    });
    
    // Update last connected time
    if (this.savedConnection) {
      this.savedConnection.lastConnected = new Date().toISOString();
      await AsyncStorage.setItem('savedConnection', JSON.stringify(this.savedConnection));
    }
    
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
    
    // Clear reconnect timer
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    this.updateConnectionState({
      isConnected: false,
      isConnecting: false,
      partnerConnected: false,
      roomCode: null,
      error: null,
    });
    
    console.log('Mock: Disconnected');
  }

  // Permanently remove saved connection
  public async forgetConnection(): Promise<void> {
    try {
      await AsyncStorage.removeItem('savedConnection');
      this.savedConnection = null;
      
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
      
      this.disconnect();
      console.log('Forgot saved connection');
    } catch (error) {
      console.error('Failed to forget connection:', error);
    }
  }

  // Get saved connection info
  public getSavedConnection(): SavedConnection | null {
    return this.savedConnection;
  }

  // Clear saved connection (for forget functionality)
  public async clearSavedConnection(): Promise<void> {
    try {
      await AsyncStorage.removeItem('savedConnection');
      this.savedConnection = null;
      
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
      
      this.disconnect();
      console.log('Cleared saved connection');
    } catch (error) {
      console.error('Failed to clear saved connection:', error);
    }
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
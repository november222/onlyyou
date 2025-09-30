import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isFeatureEnabled } from '@/config/features';

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
  currentSessionStart?: string;
  totalConnectedTime?: number;
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
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private isAutoReconnecting = false;
  private connectionStartTime: number | null = null;
  private backgroundTime: number | null = null;
  private totalConnectedTime: number = 0;
  private initialized = false;

  // Event callbacks
  public onConnectionStateChange: ((state: ConnectionState) => void) | null = null;
  public onMessageReceived: ((message: WebRTCMessage) => void) | null = null;
  public onRemoteStream: ((stream: any) => void) | null = null;
  public onLocalStream: ((stream: any) => void) | null = null;

  public async init(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;
    
    console.log('WebRTC Service: Running in frontend-only mode with mock data');
    
    // Load saved connection and try to auto-reconnect
    await this.loadSavedConnection();
    
    // Load total connected time
    await this.loadTotalConnectedTime();
  }

  // Load saved connection from storage
  private async loadSavedConnection(): Promise<void> {
    try {
      const saved = await AsyncStorage.getItem('savedConnection');
      if (saved) {
        this.savedConnection = JSON.parse(saved);
        console.log('Loaded saved connection:', this.savedConnection?.roomCode);
        
        // If there was an active session, calculate time spent while app was closed
        if (this.savedConnection?.currentSessionStart) {
          const sessionStart = new Date(this.savedConnection.currentSessionStart).getTime();
          const now = Date.now();
          const timeWhileClosed = Math.floor((now - sessionStart) / 1000);
          
          // Add time spent while app was closed to total
          this.totalConnectedTime = (this.savedConnection.totalConnectedTime || 0) + timeWhileClosed;
          
          console.log(`Added ${timeWhileClosed}s from background time`);
        } else {
          this.totalConnectedTime = this.savedConnection?.totalConnectedTime || 0;
        }
        
        // Auto-reconnect to saved room
        if (this.savedConnection?.roomCode) {
          this.autoReconnect();
        }
      }
    } catch (error) {
      console.error('Failed to load saved connection:', error);
    }
  }

  // Load total connected time
  private async loadTotalConnectedTime(): Promise<void> {
    try {
      const saved = await AsyncStorage.getItem('totalConnectedTime');
      if (saved) {
        this.totalConnectedTime = parseInt(saved, 10) || 0;
      }
    } catch (error) {
      console.error('Failed to load total connected time:', error);
    }
  }

  // Save total connected time
  private async saveTotalConnectedTime(): Promise<void> {
    try {
      await AsyncStorage.setItem('totalConnectedTime', this.totalConnectedTime.toString());
    } catch (error) {
      console.error('Failed to save total connected time:', error);
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
        totalConnectedTime: this.totalConnectedTime,
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
    console.log('Auto-reconnecting to saved room:', this.savedConnection.roomCode);
    
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
        console.log('Scheduled reconnect attempt...');
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
        console.log('Attempting to reconnect after network issue...');
        this.autoReconnect();
      }, 3000);
    }
  }

  // Update connection state
  private updateConnectionState(updates: Partial<ConnectionState>) {
    this.connectionState = { ...this.connectionState, ...updates };
    console.log('Connection state updated:', this.connectionState);
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
    
    // Validate room code format (basic validation)
    if (roomCode.length < 4 || roomCode.length > 8) {
      throw new Error('Mã phòng không hợp lệ');
    }
    
    // Start connection timer
    this.startConnectionTimer();
    
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
      this.savedConnection.currentSessionStart = new Date().toISOString();
      this.savedConnection.totalConnectedTime = this.totalConnectedTime;
      await AsyncStorage.setItem('savedConnection', JSON.stringify(this.savedConnection));
    }
    
    console.log(`Mock: Successfully joined room ${roomCode}`);
  }

  // Start connection timer
  private startConnectionTimer(): void {
    this.connectionStartTime = Date.now();
    console.log('Connection timer started');
  }

  // Stop connection timer and save total time
  private async stopConnectionTimer(): Promise<void> {
    if (this.connectionStartTime) {
      const sessionDuration = Math.floor((Date.now() - this.connectionStartTime) / 1000);
      this.totalConnectedTime += sessionDuration;
      
      console.log(`Session ended: ${sessionDuration}s, Total: ${this.totalConnectedTime}s`);
      
      // Save updated total time
      await this.saveTotalConnectedTime();
      
      // Update saved connection
      if (this.savedConnection) {
        this.savedConnection.totalConnectedTime = this.totalConnectedTime;
        delete this.savedConnection.currentSessionStart; // Clear active session marker
        await AsyncStorage.setItem('savedConnection', JSON.stringify(this.savedConnection));
      }
      
      this.connectionStartTime = null;
    }
  }

  // Get current session duration (in seconds)
  public getCurrentSessionDuration(): number {
    if (!this.connectionStartTime || !this.connectionState.isConnected) {
      return 0;
    }
    return Math.floor((Date.now() - this.connectionStartTime) / 1000);
  }

  // Get total connected time (in seconds)
  public getTotalConnectedTime(): number {
    return this.totalConnectedTime;
  }

  // Handle app going to background
  public handleAppStateChange(nextAppState: string): void {
    if (nextAppState === 'background' || nextAppState === 'inactive') {
      // App going to background - save current state
      this.backgroundTime = Date.now();
      console.log('App went to background, connection continues...');
    } else if (nextAppState === 'active' && this.backgroundTime) {
      // App coming back to foreground
      const timeInBackground = Date.now() - this.backgroundTime;
      console.log(`App returned from background after ${Math.floor(timeInBackground / 1000)}s`);
      this.backgroundTime = null;
    }
  }

  // Mock: Send text message
  public sendMessage(text: string): WebRTCMessage | null {
    if (!this.connectionState.isConnected) {
      console.warn('Cannot send message: not connected');
      return null;
    }
    
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
      if (!this.connectionState.isConnected) return; // Don't send response if disconnected
      
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
    if (!this.connectionState.isConnected) {
      throw new Error('Không thể gọi: chưa kết nối');
    }
    
    if (isFeatureEnabled('simpleCallLink')) {
      console.log(`Mock: System call feature enabled, skipping WebRTC call setup`);
      return;
    } else {
      console.log(`Mock: Starting ${video ? 'video' : 'audio'} call...`);
      
      // Simulate call setup delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log(`Mock: ${video ? 'Video' : 'Audio'} call started`);
    }
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
  public async disconnect(): Promise<void> {
    console.log('Mock: Disconnecting...');
    
    // Stop connection timer
    await this.stopConnectionTimer();
    
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
    
    // Show success message after state update
    setTimeout(() => {
      // This will be handled by the UI component
    }, 100);
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
      // Stop timer if running
      await this.stopConnectionTimer();
      
      await AsyncStorage.removeItem('savedConnection');
      await AsyncStorage.removeItem('totalConnectedTime');
      this.savedConnection = null;
      this.totalConnectedTime = 0;
      
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
    
    // Generate a more readable room code
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let roomCode = '';
    for (let i = 0; i < 6; i++) {
      roomCode += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    console.log(`Mock: Generated room code: ${roomCode}`);
    
    return roomCode;
  }

  // Check if connected
  public isConnected(): boolean {
    return this.connectionState.isConnected;
  }

  // Get partner info
  public getPartnerInfo(): { name?: string; roomCode?: string } | null {
    if (this.connectionState.isConnected && this.connectionState.roomCode) {
      return {
        name: 'My Love', // Mock partner name
        roomCode: this.connectionState.roomCode,
      };
    }
    return null;
  }
}

export default new WebRTCService();
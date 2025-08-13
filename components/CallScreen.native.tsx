import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, Speaker, VolumeX } from 'lucide-react-native';
import WebRTCService from '../services/WebRTCService';

// Dynamic import for RTCView only on native platforms
let RTCView: any = null;
if (Platform.OS !== 'web') {
  try {
    // Check if react-native-webrtc is available
    RTCView = require('react-native-webrtc').RTCView;
  } catch (error) {
    // Silently handle the case where WebRTC is not available
    // This is expected in Expo managed workflow
    RTCView = null;
  }
}

interface CallScreenProps {
  onEndCall: () => void;
  isVideoCall: boolean;
}

export default function CallScreen({ onEndCall, isVideoCall }: CallScreenProps) {
  const [localStream, setLocalStream] = useState<any>(null);
  const [remoteStream, setRemoteStream] = useState<any>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(isVideoCall);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  useEffect(() => {
    // Set up WebRTC event listeners
    WebRTCService.onLocalStream = (stream) => {
      setLocalStream(stream);
    };

    WebRTCService.onRemoteStream = (stream) => {
      setRemoteStream(stream);
    };

    // Start the call
    startCall();

    // Call duration timer
    const timer = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);

    return () => {
      clearInterval(timer);
      WebRTCService.onLocalStream = null;
      WebRTCService.onRemoteStream = null;
    };
  }, []);

  const startCall = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Not Supported', 'Calling is not available on web platform. Please use the mobile app.');
      onEndCall();
      return;
    }

    try {
      await WebRTCService.startCall(isVideoCall);
    } catch (error) {
      console.error('Failed to start call:', error);
      Alert.alert('Call Failed', 'Unable to start the call. Please try again.');
      onEndCall();
    }
  };

  const handleEndCall = () => {
    WebRTCService.endCall();
    onEndCall();
  };

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track: any) => {
        track.enabled = isMuted;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track: any) => {
        track.enabled = !isVideoEnabled;
      });
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  const toggleSpeaker = () => {
    // In a real implementation, you would toggle speaker/earpiece
    setIsSpeakerOn(!isSpeakerOn);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      {/* Remote Video */}
      <View style={styles.remoteVideoContainer}>
        {remoteStream && isVideoCall && RTCView && Platform.OS !== 'web' ? (
          <RTCView
            style={styles.remoteVideo}
            streamURL={remoteStream.toURL()}
            objectFit="cover"
          />
        ) : (
          <View style={styles.noVideoContainer}>
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>❤️</Text>
            </View>
            <Text style={styles.partnerName}>Your Love</Text>
            <Text style={styles.callStatus}>
              {Platform.OS === 'web' 
                ? 'Calling not available on web' 
                : remoteStream ? 'Connected' : 'Connecting...'
              }
            </Text>
          </View>
        )}
      </View>

      {/* Local Video (Picture-in-Picture) */}
      {localStream && isVideoCall && isVideoEnabled && RTCView && Platform.OS !== 'web' && (
        <View style={styles.localVideoContainer}>
          <RTCView
            style={styles.localVideo}
            streamURL={localStream.toURL()}
            objectFit="cover"
            mirror={true}
          />
        </View>
      )}

      {/* Call Info */}
      <View style={styles.callInfo}>
        <Text style={styles.callDuration}>{formatDuration(callDuration)}</Text>
        <Text style={styles.callType}>
          {isVideoCall ? 'Video Call' : 'Voice Call'}
        </Text>
      </View>

      {/* Call Controls */}
      <View style={styles.controlsContainer}>
        <View style={styles.controls}>
          {/* Mute Button */}
          <TouchableOpacity
            style={[styles.controlButton, isMuted && styles.controlButtonActive]}
            onPress={toggleMute}
          >
            {isMuted ? (
              <MicOff size={24} color="#fff" strokeWidth={2} />
            ) : (
              <Mic size={24} color="#fff" strokeWidth={2} />
            )}
          </TouchableOpacity>

          {/* End Call Button */}
          <TouchableOpacity
            style={styles.endCallButton}
            onPress={handleEndCall}
          >
            <PhoneOff size={28} color="#fff" strokeWidth={2} />
          </TouchableOpacity>

          {/* Video Toggle (only for video calls) */}
          {isVideoCall ? (
            <TouchableOpacity
              style={[styles.controlButton, !isVideoEnabled && styles.controlButtonActive]}
              onPress={toggleVideo}
            >
              {isVideoEnabled ? (
                <Video size={24} color="#fff" strokeWidth={2} />
              ) : (
                <VideoOff size={24} color="#fff" strokeWidth={2} />
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.controlButton, isSpeakerOn && styles.controlButtonActive]}
              onPress={toggleSpeaker}
            >
              {isSpeakerOn ? (
                <Speaker size={24} color="#fff" strokeWidth={2} />
              ) : (
                <VolumeX size={24} color="#fff" strokeWidth={2} />
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  remoteVideoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  remoteVideo: {
    width: '100%',
    height: '100%',
  },
  noVideoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#ff6b9d',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarText: {
    fontSize: 48,
  },
  partnerName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  callStatus: {
    fontSize: 16,
    color: '#888',
  },
  localVideoContainer: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 120,
    height: 160,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#ff6b9d',
  },
  localVideo: {
    width: '100%',
    height: '100%',
  },
  callInfo: {
    position: 'absolute',
    top: 60,
    left: 20,
    alignItems: 'flex-start',
  },
  callDuration: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  callType: {
    fontSize: 14,
    color: '#888',
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 50,
    paddingHorizontal: 20,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 40,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButtonActive: {
    backgroundColor: '#666',
  },
  endCallButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
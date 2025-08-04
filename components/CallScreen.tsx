import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, Speaker } from 'lucide-react-native';

interface CallScreenProps {
  onEndCall: () => void;
  isVideoCall: boolean;
}

export default function CallScreen({ onEndCall, isVideoCall }: CallScreenProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(isVideoCall);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [callStatus, setCallStatus] = useState('Connecting...');

  useEffect(() => {
    // Simulate call connection
    const connectTimer = setTimeout(() => {
      setCallStatus('Connected');
    }, 2000);

    // Call duration timer
    const durationTimer = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);

    return () => {
      clearTimeout(connectTimer);
      clearInterval(durationTimer);
    };
  }, []);

  const handleEndCall = () => {
    console.log('Mock: Ending call');
    onEndCall();
  };

  const toggleMute = () => {
    console.log(`Mock: ${isMuted ? 'Unmuting' : 'Muting'} microphone`);
    setIsMuted(!isMuted);
  };

  const toggleVideo = () => {
    console.log(`Mock: ${isVideoEnabled ? 'Disabling' : 'Enabling'} video`);
    setIsVideoEnabled(!isVideoEnabled);
  };

  const toggleSpeaker = () => {
    console.log(`Mock: ${isSpeakerOn ? 'Disabling' : 'Enabling'} speaker`);
    setIsSpeakerOn(!isSpeakerOn);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      {/* Remote Video Area */}
      <View style={styles.remoteVideoContainer}>
        {isVideoCall && isVideoEnabled ? (
          <View style={styles.mockVideoContainer}>
            <Text style={styles.mockVideoText}>📹</Text>
            <Text style={styles.mockVideoLabel}>Partner's Video</Text>
          </View>
        ) : (
          <View style={styles.noVideoContainer}>
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>❤️</Text>
            </View>
            <Text style={styles.partnerName}>My Love</Text>
            <Text style={styles.callStatusText}>{callStatus}</Text>
          </View>
        )}
      </View>

      {/* Local Video (Picture-in-Picture) */}
      {isVideoCall && isVideoEnabled && (
        <View style={styles.localVideoContainer}>
          <View style={styles.mockLocalVideo}>
            <Text style={styles.mockLocalVideoText}>📱</Text>
          </View>
        </View>
      )}

      {/* Call Info */}
      <View style={styles.callInfo}>
        <Text style={styles.callDuration}>{formatDuration(callDuration)}</Text>
        <Text style={styles.callType}>
          {isVideoCall ? 'Video Call' : 'Voice Call'} (Mock)
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
              <Speaker size={24} color="#fff" strokeWidth={2} />
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
  mockVideoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111',
    width: '100%',
  },
  mockVideoText: {
    fontSize: 64,
    marginBottom: 16,
  },
  mockVideoLabel: {
    fontSize: 16,
    color: '#888',
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
  callStatusText: {
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
  mockLocalVideo: {
    width: '100%',
    height: '100%',
    backgroundColor: '#222',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mockLocalVideoText: {
    fontSize: 32,
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
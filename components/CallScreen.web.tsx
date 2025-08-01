import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { CircleAlert as AlertCircle, Smartphone } from 'lucide-react-native';

interface CallScreenProps {
  onEndCall: () => void;
  isVideoCall: boolean;
}

export default function CallScreen({ onEndCall, isVideoCall }: CallScreenProps) {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <AlertCircle size={64} color="#ff6b9d" strokeWidth={2} />
        </View>
        
        <Text style={styles.title}>Calling Not Available</Text>
        <Text style={styles.subtitle}>
          {isVideoCall ? 'Video calling' : 'Voice calling'} is not supported on web platform
        </Text>
        
        <View style={styles.instructionContainer}>
          <Smartphone size={24} color="#888" strokeWidth={2} />
          <Text style={styles.instruction}>
            Please use the mobile app on iOS or Android for full calling functionality
          </Text>
        </View>
        
        <TouchableOpacity style={styles.backButton} onPress={onEndCall}>
          <Text style={styles.backButtonText}>Back to Messages</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    alignItems: 'center',
    maxWidth: 300,
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 22,
  },
  instructionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  instruction: {
    fontSize: 14,
    color: '#888',
    marginLeft: 12,
    flex: 1,
    textAlign: 'center',
    lineHeight: 20,
  },
  backButton: {
    backgroundColor: '#ff6b9d',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 25,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
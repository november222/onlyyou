import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Video, ResizeMode } from 'expo-av';

export default function IntroScreen() {
  const videoRef = useRef<Video>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Fallback in case the video never fires finish
    const t = setTimeout(() => {
      if (!ready) return;
      completeIntro();
    }, 15000);
    return () => clearTimeout(t);
  }, [ready]);

  const completeIntro = async () => {
    try {
      await AsyncStorage.setItem('hasSeenIntroVideo', 'true');
    } catch {}
    router.replace('/(tabs)/profile');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.flexCenter}>
        <Video
          ref={videoRef}
          source={require('../assets/images/enimated_logo.mp4')}
          style={styles.video}
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay
          isLooping={false}
          onLoad={() => setReady(true)}
          onError={() => completeIntro()}
          onPlaybackStatusUpdate={(status) => {
            // @ts-ignore
            if (status?.didJustFinish) completeIntro();
          }}
        />
      </View>
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.skipBtn} onPress={completeIntro}>
          <Text style={styles.skipTxt}>Bỏ qua</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  flexCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  video: { width: '85%', height: '50%' },
  bottomBar: {
    padding: 16,
    alignItems: 'center',
  },
  skipBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#444',
  },
  skipTxt: { color: '#bbb', fontWeight: '600' },
});


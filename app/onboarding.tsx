import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  Heart, 
  Shield, 
  MessageCircle, 
  Phone, 
  Video, 
  Lock,
  ChevronRight,
  ArrowRight 
} from 'lucide-react-native';
import AuthService from '@/services/AuthService';
import { useTranslation } from 'react-i18next';

const { width: screenWidth } = Dimensions.get('window');

interface OnboardingSlide {
  id: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  description: string;
  color: string;
}

const slides: OnboardingSlide[] = [
  {
    id: '1',
    icon: <Heart size={80} color="#ff6b9d" strokeWidth={1.5} fill="#ff6b9d" />,
    title: 'Only You',
    subtitle: 'Made for Two Hearts',
    description: 'A private messaging app designed exclusively for couples. No groups, no strangers - just you and your special person.',
    color: '#ff6b9d',
  },
  {
    id: '2',
    icon: <Shield size={80} color="#4ade80" strokeWidth={1.5} />,
    title: 'End-to-End Encrypted',
    subtitle: 'Your Privacy Matters',
    description: 'All your messages and calls are encrypted with military-grade security. Only you and your partner can read your conversations.',
    color: '#4ade80',
  },
  {
    id: '3',
    icon: <MessageCircle size={80} color="#3b82f6" strokeWidth={1.5} />,
    title: 'Real-time Messaging',
    subtitle: 'Stay Connected Always',
    description: 'Send messages instantly with beautiful animations and read receipts. Express your love with emojis and heartfelt words.',
    color: '#3b82f6',
  },
  {
    id: '4',
    icon: <Phone size={80} color="#f59e0b" strokeWidth={1.5} />,
    title: 'Voice & Video Calls',
    subtitle: 'Hear Each Other\'s Voice',
    description: 'Crystal clear voice and video calls with your loved one. Feel close even when you\'re apart.',
    color: '#f59e0b',
  },
  {
    id: '5',
    icon: <Lock size={80} color="#8b5cf6" strokeWidth={1.5} />,
    title: 'Completely Private',
    subtitle: 'No Data Collection',
    description: 'We don\'t store your messages or personal data. Your conversations stay between you and your partner forever.',
    color: '#8b5cf6',
  },
];

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const { t } = useTranslation();

  const slides: OnboardingSlide[] = [
    {
      id: '1',
      icon: <Heart size={80} color="#ff6b9d" strokeWidth={1.5} fill="#ff6b9d" />,
      title: t('auth:title'),
      subtitle: t('onboarding:madeForTwo'),
      description: t('onboarding:madeForTwoDesc'),
      color: '#ff6b9d',
    },
    {
      id: '2',
      icon: <Shield size={80} color="#4ade80" strokeWidth={1.5} />,
      title: t('onboarding:encrypted'),
      subtitle: 'Your Privacy Matters',
      description: t('onboarding:encryptedDesc'),
      color: '#4ade80',
    },
    {
      id: '3',
      icon: <MessageCircle size={80} color="#3b82f6" strokeWidth={1.5} />,
      title: t('onboarding:messaging'),
      subtitle: 'Stay Connected Always',
      description: t('onboarding:messagingDesc'),
      color: '#3b82f6',
    },
    {
      id: '4',
      icon: <Phone size={80} color="#f59e0b" strokeWidth={1.5} />,
      title: t('onboarding:calls'),
      subtitle: 'Hear Each Other\'s Voice',
      description: t('onboarding:callsDesc'),
      color: '#f59e0b',
    },
    {
      id: '5',
      icon: <Lock size={80} color="#8b5cf6" strokeWidth={1.5} />,
      title: t('onboarding:private'),
      subtitle: 'No Data Collection',
      description: t('onboarding:privateDesc'),
      color: '#8b5cf6',
    },
  ];

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      const nextIndex = currentIndex + 1;
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setCurrentIndex(nextIndex);
    } else {
      handleGetStarted();
    }
  };

  const handleGetStarted = async () => {
    try {
      // Mark onboarding as seen
      await AsyncStorage.setItem('hasSeenOnboarding', 'true');
      
      // Check if user is authenticated
      const authState = AuthService.getAuthState();
      
      if (authState.isAuthenticated) {
        router.replace('/(tabs)/profile');
      } else {
        router.replace('/auth/login');
      }
    } catch (error) {
      console.error('Error saving onboarding status:', error);
      // Fallback to login
      router.replace('/auth/login');
    }
  };

  const handleSkip = async () => {
    try {
      // Mark onboarding as seen
      await AsyncStorage.setItem('hasSeenOnboarding', 'true');
      
      // Check if user is authenticated
      const authState = AuthService.getAuthState();
      
      if (authState.isAuthenticated) {
        router.replace('/(tabs)/profile');
      } else {
        router.replace('/auth/login');
      }
    } catch (error) {
      console.error('Error saving onboarding status:', error);
      // Fallback to login
      router.replace('/auth/login');
    }
  };

  const renderSlide = ({ item, index }: { item: OnboardingSlide; index: number }) => (
    <View style={[styles.slide, { width: screenWidth }]}>
      <View style={styles.slideContent}>
        {/* Icon */}
        <View style={[styles.iconContainer, { backgroundColor: `${item.color}15` }]}>
          {item.icon}
        </View>

        {/* Text Content */}
        <View style={styles.textContainer}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={[styles.subtitle, { color: item.color }]}>{item.subtitle}</Text>
          <Text style={styles.description}>{item.description}</Text>
        </View>
      </View>
    </View>
  );

  const renderPagination = () => (
    <View style={styles.pagination}>
      {slides.map((_, index) => {
        const inputRange = [
          (index - 1) * screenWidth,
          index * screenWidth,
          (index + 1) * screenWidth,
        ];

        const dotWidth = scrollX.interpolate({
          inputRange,
          outputRange: [8, 24, 8],
          extrapolate: 'clamp',
        });

        const opacity = scrollX.interpolate({
          inputRange,
          outputRange: [0.3, 1, 0.3],
          extrapolate: 'clamp',
        });

        return (
          <Animated.View
            key={index}
            style={[
              styles.dot,
              {
                width: dotWidth,
                opacity,
                backgroundColor: slides[currentIndex]?.color || '#ff6b9d',
              },
            ]}
          />
        );
      })}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Skip Button */}
      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Text style={styles.skipText}>{t('common.skip')}</Text>
      </TouchableOpacity>

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
          setCurrentIndex(index);
        }}
        keyExtractor={(item) => item.id}
      />

      {/* Bottom Section */}
      <View style={styles.bottomSection}>
        {/* Pagination */}
        {renderPagination()}

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={[
              styles.nextButton,
              { backgroundColor: slides[currentIndex]?.color || '#ff6b9d' }
            ]}
            onPress={handleNext}
          >
            <Text style={styles.nextButtonText}>
              {currentIndex === slides.length - 1 ? t('getStarted') : t('next')}
            </Text>
            {currentIndex === slides.length - 1 ? (
              <ArrowRight size={20} color="#fff" strokeWidth={2} />
            ) : (
              <ChevronRight size={20} color="#fff" strokeWidth={2} />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  skipButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 16,
    color: '#888',
    fontWeight: '500',
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slideContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 60,
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  textContainer: {
    alignItems: 'center',
    maxWidth: 320,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    lineHeight: 24,
  },
  bottomSection: {
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  actionContainer: {
    alignItems: 'center',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
    minWidth: 160,
    gap: 8,
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
});
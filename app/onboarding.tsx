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
  Lock,
  ChevronRight,
  ArrowRight,
  QrCode,
  Sparkles,
  Timer,
  Zap,
  Camera,
  Calendar,
} from 'lucide-react-native';
import AuthService from '@/services/AuthService';
import { useTranslation } from 'react-i18next';
import { useTheme, useThemeColors } from '@/providers/ThemeProvider';

const { width: screenWidth } = Dimensions.get('window');

interface OnboardingSlide {
  id: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  description: string;
  color: string;
}

// Removed old static slides (avoid referencing icons not supported on this version)

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const { t } = useTranslation();
  const { theme } = useTheme();
  const colors = useThemeColors();

  // Updated slides to reflect current features and mock state
  const slides: OnboardingSlide[] = [
    {
      id: '1',
      icon: <Heart size={80} color="#ff6b9d" strokeWidth={1.5} fill="#ff6b9d" />,
      title: 'Kết nối đôi',
      subtitle: 'Chỉ dành cho 2 người',
      description:
        'Tạo phòng và kết nối an toàn giữa hai bạn. Không nhóm, không người lạ.',
      color: '#ff6b9d',
    },
    {
      id: '2',
      icon: <Zap size={80} color="#f59e0b" strokeWidth={1.5} />,
      title: 'Buzz yêu thương',
      subtitle: 'Chạm để gửi tín hiệu',
      description:
        'Gửi Buzz để nhắc nhớ và kết nối nhau mọi lúc. Nhanh gọn, đầy cảm xúc.',
      color: '#f59e0b',
    },
    {
      id: '3',
      icon: <Camera size={80} color="#10b981" strokeWidth={1.5} />,
      title: 'Chia sẻ hình ảnh',
      subtitle: 'Lưu giữ khoảnh khắc chung',
      description:
        'Chụp hoặc chọn ảnh từ thư viện, lưu vào album dùng chung để cùng xem lại.',
      color: '#10b981',
    },
    {
      id: '4',
      icon: <Calendar size={80} color="#3b82f6" strokeWidth={1.5} />,
      title: 'Lịch chung',
      subtitle: 'Hẹn hò & nhắc việc',
      description:
        'Lên lịch hẹn, ngày kỷ niệm và việc chung để không bỏ lỡ điều quan trọng.',
      color: '#3b82f6',
    },
    {
      id: '5',
      icon: <Lock size={80} color="#8b5cf6" strokeWidth={1.5} />,
      title: 'Riêng tư & bảo mật',
      subtitle: 'Bạn làm chủ dữ liệu',
      description:
        'Ứng dụng được thiết kế cho riêng hai bạn với khóa riêng tư và dữ liệu cục bộ.',
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
      await AsyncStorage.setItem('hasSeenOnboarding', 'true');
      // While focusing on UI/UX, go straight to tabs
      router.replace('/(tabs)/profile');
    } catch (error) {
      console.error('Error saving onboarding status:', error);
      router.replace('/(tabs)/profile');
    }
  };

  const handleSkip = async () => {
    try {
      await AsyncStorage.setItem('hasSeenOnboarding', 'true');
      router.replace('/(tabs)/profile');
    } catch (error) {
      console.error('Error saving onboarding status:', error);
      router.replace('/(tabs)/profile');
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
          <Text style={[styles.title, { color: colors.text }]}>{item.title}</Text>
          <Text style={[styles.subtitle, { color: item.color }]}>{item.subtitle}</Text>
          <Text style={[styles.description, { color: colors.mutedText || colors.text }]}>{item.description}</Text>
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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Skip Button */}
      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Text style={[styles.skipText, { color: colors.mutedText || colors.text }]}>{t('common.skip')}</Text>
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
              { backgroundColor: slides[currentIndex]?.color || theme.primary }
            ]}
            onPress={handleNext}
          >
            <Text style={styles.nextButtonText}>
              {currentIndex === slides.length - 1 ? t('getStarted') : t('next')}
            </Text>
            {currentIndex === slides.length - 1 ? (
              <ArrowRight size={20} color={theme.onPrimary || colors.text} strokeWidth={2} />
            ) : (
              <ChevronRight size={20} color={theme.onPrimary || colors.text} strokeWidth={2} />
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
  },
});

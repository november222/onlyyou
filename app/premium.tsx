import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { 
  Crown,
  ArrowLeft,
  Check,
  Star,
  Shield,
  History,
  Trash2,
  Sparkles,
  Heart,
  Zap,
  Lock,
  X
} from 'lucide-react-native';
import { PurchaseService, Plan } from '@/services/PurchaseService';
import { usePremium } from '@/providers/PremiumProvider';
import { useTheme, useThemeColors } from '@/providers/ThemeProvider';

interface PremiumFeature {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}

const premiumFeatures: PremiumFeature[] = [
  {
    icon: <History size={24} color="#4ade80" strokeWidth={2} />,
    title: 'Xem Chi Tiết Lịch Sử',
    description: 'Xem thông tin đầy đủ về từng phiên kết nối với timestamp chính xác',
    color: '#4ade80',
  },
  {
    icon: <Trash2 size={24} color="#ef4444" strokeWidth={2} />,
    title: 'Quản Lý Lịch Sử',
    description: 'Xóa từng phiên hoặc xóa toàn bộ lịch sử kết nối',
    color: '#ef4444',
  },
  {
    icon: <Zap size={24} color="#f59e0b" strokeWidth={2} />,
    title: 'Buzz Calls Premium',
    description: 'Tạo tin nhắn nhanh tùy chỉnh và thống kê chi tiết',
    color: '#f59e0b',
  },
  {
    icon: <Shield size={24} color="#8b5cf6" strokeWidth={2} />,
    title: 'Bảo Mật Nâng Cao',
    description: 'Mã hóa mạnh hơn và tùy chọn bảo mật bổ sung',
    color: '#8b5cf6',
  },
  {
    icon: <Star size={24} color="#3b82f6" strokeWidth={2} />,
    title: 'Giao Diện Premium',
    description: 'Theme độc quyền và tùy chỉnh giao diện nâng cao',
    color: '#3b82f6',
  },
  {
    icon: <Heart size={24} color="#ff6b9d" strokeWidth={2} />,
    title: 'Tính Năng Đặc Biệt',
    description: 'Ưu tiên truy cập các tính năng mới và độc quyền',
    color: '#ff6b9d',
  },
];

export default function PremiumScreen() {
  const { theme } = useTheme();
  const colors = useThemeColors();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [isProcessing, setIsProcessing] = useState(false);
  const { isPremium } = usePremium();
  const params = useLocalSearchParams();

  // Auto-open payment modal if openPayment param is present
  useEffect(() => {
    if (params.openPayment === '1') {
      requestAnimationFrame(() => {
        setShowPaymentModal(true);
      });
    }
  }, [params.openPayment]);

  const handleUpgrade = () => {
    // Show payment options directly
    Alert.alert(
      'Chọn Phương Thức Thanh Toán',
      'Chọn cách bạn muốn thanh toán cho gói Premier',
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Thanh Toán', 
          onPress: () => setShowPaymentModal(true)
        }
      ]
    );
  };

  const handlePurchase = async () => {
    if (isProcessing) return;
    
    try {
      setIsProcessing(true);
      
      const plan: Plan = selectedPlan;
      const result = await PurchaseService.purchase(plan);
      
      if (result.success) {
        Alert.alert(
          'Mua Thành Công! 🎉',
          'Chúc mừng! Bạn đã nâng cấp thành công lên gói Premier. Tất cả tính năng premium đã được mở khóa.',
          [
            {
              text: 'Tuyệt Vời!',
              onPress: () => {
                setShowPaymentModal(false);
                router.back();
              },
            },
          ]
        );
      } else {
        Alert.alert(
          'Thanh Toán Thất Bại',
          result.error || 'Có lỗi xảy ra trong quá trình thanh toán. Vui lòng thử lại.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert(
        'Lỗi',
        'Có lỗi xảy ra trong quá trình thanh toán. Vui lòng thử lại.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRestore = async () => {
    if (isProcessing) return;
    
    try {
      setIsProcessing(true);
      
      const result = await PurchaseService.restore();
      
      if (result.success) {
        Alert.alert(
          'Khôi Phục Thành Công! 🎉',
          'Gói Premier của bạn đã được khôi phục thành công.',
          [
            {
              text: 'Tuyệt Vời!',
              onPress: () => {
                setShowPaymentModal(false);
                router.back();
              },
            },
          ]
        );
      } else {
        Alert.alert(
          'Khôi Phục Thất Bại',
          result.error || 'Không tìm thấy gói Premium nào để khôi phục.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert(
        'Lỗi',
        'Có lỗi xảy ra trong quá trình khôi phục. Vui lòng thử lại.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const PremiumFeatureCard = ({ feature }: { feature: PremiumFeature }) => (
    <View style={styles.featureCard}>
      <View style={[styles.featureIcon, { backgroundColor: `${feature.color}15` }]}>
        {feature.icon}
      </View>
      <View style={styles.featureContent}>
        <Text style={styles.featureTitle}>{feature.title}</Text>
        <Text style={styles.featureDescription}>{feature.description}</Text>
      </View>
      <View style={styles.featureCheck}>
        <Check size={20} color="#4ade80" strokeWidth={2} />
      </View>
    </View>
  );

  return (
    <>
      <Stack.Screen options={{ headerShown: false, header: () => null }} />
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <ArrowLeft size={24} color={colors.text} strokeWidth={2} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: colors.text }]}>Premier</Text>
            <View style={styles.headerRight} />
          </View>

          {/* Hero Section */}
          <View style={styles.heroSection}>
            <View style={styles.crownContainer}>
              <Crown size={64} color="#f59e0b" strokeWidth={2} fill="#f59e0b" />
              <Sparkles size={24} color="#f59e0b" strokeWidth={2} style={styles.sparkle1} />
              <Sparkles size={16} color="#ff6b9d" strokeWidth={2} style={styles.sparkle2} />
              <Sparkles size={20} color="#4ade80" strokeWidth={2} style={styles.sparkle3} />
            </View>
            
            <Text style={[styles.heroTitle, { color: colors.text }]}>Only You Premier</Text>
            <Text style={[styles.heroSubtitle, { color: colors.mutedText || colors.text }]}>
              Nâng cấp trải nghiệm yêu xa của bạn với các tính năng độc quyền
            </Text>
          </View>

          {/* Pricing Cards */}
          <View style={styles.pricingSection}>
            <Text style={[styles.pricingSectionTitle, { color: colors.text }]}> Chọn Gói Phù Hợp</Text>
            
            <View style={styles.pricingCards}>
              {/* Monthly Plan */}
              <TouchableOpacity
                style={[
                  styles.pricingCard,
                  selectedPlan === 'monthly' && styles.selectedPricingCard
                ]}
                onPress={() => setSelectedPlan('monthly')}
              >
                <View style={styles.pricingHeader}>
                  <Text style={[styles.pricingTitle, { color: colors.text }]}>Hàng Tháng</Text>
                  {selectedPlan === 'monthly' && (
                    <View style={styles.selectedBadge}>
                      <Check size={16} color="#fff" strokeWidth={2} />
                    </View>
                  )}
                </View>
                <Text style={[styles.pricingPrice, { color: theme.secondary }]}>₫49,000</Text>
                <Text style={[styles.pricingPeriod, { color: colors.mutedText || colors.text }]}>mỗi tháng</Text>
              </TouchableOpacity>

              {/* Yearly Plan (Recommended) */}
              <TouchableOpacity
                style={[
                  styles.pricingCard,
                  styles.recommendedCard,
                  selectedPlan === 'yearly' && styles.selectedPricingCard
                ]}
                onPress={() => setSelectedPlan('yearly')}
              >
                <View style={styles.recommendedBadge}>
                  <Star size={12} color="#fff" strokeWidth={2} fill="#fff" />
                  <Text style={styles.recommendedText}>Khuyến Nghị</Text>
                </View>
                <View style={styles.pricingHeader}>
                  <Text style={[styles.pricingTitle, { color: colors.text }]}>Hàng Năm</Text>
                  {selectedPlan === 'yearly' && (
                    <View style={styles.selectedBadge}>
                      <Check size={16} color="#fff" strokeWidth={2} />
                    </View>
                  )}
                </View>
                <View style={styles.yearlyPricing}>
                  <Text style={[styles.pricingPrice, { color: theme.secondary }]}>₫399,000</Text>
                  <Text style={[styles.originalPrice, { color: colors.mutedText || colors.text }]}>₫588,000</Text>
                </View>
                <Text style={[styles.pricingPeriod, { color: colors.mutedText || colors.text }]}>mỗi năm</Text>
                <Text style={[styles.savingsText, { color: theme.success }]}>Tiết kiệm 32%</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Features List */}
          <View style={styles.featuresSection}>
            <Text style={[styles.featuresSectionTitle, { color: colors.text }]}>Tính Năng Premier</Text>
            
            {premiumFeatures.map((feature, index) => (
              <PremiumFeatureCard key={index} feature={feature} />
            ))}
          </View>

          {/* Guarantee */}
          <View style={styles.guaranteeSection}>
            <Shield size={32} color="#4ade80" strokeWidth={2} />
            <Text style={styles.guaranteeTitle}>Đảm Bảo 30 Ngày</Text>
            <Text style={styles.guaranteeDescription}>
              Không hài lòng? Chúng tôi hoàn tiền 100% trong 30 ngày đầu tiên.
            </Text>
          </View>
        </ScrollView>

        {/* Bottom CTA */}
        <View style={[styles.bottomSection, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          <TouchableOpacity style={[styles.upgradeButton, { backgroundColor: theme.secondary }]} onPress={handleUpgrade}>
            <Crown size={20} color="#fff" strokeWidth={2} />
            <Text style={[styles.upgradeButtonText, { color: theme.onSecondary || colors.text }]}>
              Nâng Cấp Premier - {selectedPlan === 'monthly' ? '₫49,000/tháng' : '₫399,000/năm'}
            </Text>
          </TouchableOpacity>
          
          <Text style={[styles.termsText, { color: colors.mutedText || colors.text }]}>
            Bằng cách nâng cấp, bạn đồng ý với Điều khoản Dịch vụ và Chính sách Bảo mật
          </Text>
        </View>
      </SafeAreaView>

      {/* Payment Modal */}
      <Modal
        visible={showPaymentModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View style={[styles.paymentModal, { backgroundColor: colors.background }]}>
          <View style={[styles.paymentHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.paymentTitle, { color: colors.text }]}>Thanh Toán</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowPaymentModal(false)}
            >
              <X size={24} color="" strokeWidth={2} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.paymentContent}>
            <View style={[styles.paymentSummary, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.paymentPlan, { color: colors.text }]}>
                Only You Premier - {selectedPlan === 'monthly' ? 'Hàng Tháng' : 'Hàng Năm'}
              </Text>
              <Text style={[styles.paymentPrice, { color: theme.secondary }]}>
                {selectedPlan === 'monthly' ? '₫49,000' : '₫399,000'}
              </Text>
              {selectedPlan === 'yearly' && (
                <Text style={[styles.paymentSavings, { color: theme.success }]}>Tiết kiệm ₫189,000</Text>
              )}
            </View>
            
            <View style={styles.paymentMethods}>
              <Text style={[styles.paymentMethodsTitle, { color: colors.text }]}>Phương Thức Thanh Toán</Text>
              
              <TouchableOpacity style={[styles.paymentMethod, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.paymentMethodText, { color: colors.text }]}>💳 Thẻ Tín Dụng/Ghi Nợ</Text>
                <Text style={[styles.paymentMethodSubtext, { color: colors.mutedText || colors.text }]}>Visa, Mastercard, JCB</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={[styles.paymentMethod, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.paymentMethodText, { color: colors.text }]}>🏦 Chuyển Khoản Ngân Hàng</Text>
                <Text style={[styles.paymentMethodSubtext, { color: colors.mutedText || colors.text }]}>Vietcombank, Techcombank, BIDV</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={[styles.paymentMethod, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.paymentMethodText, { color: colors.text }]}>📱 Ví Điện Tử</Text>
                <Text style={[styles.paymentMethodSubtext, { color: colors.mutedText || colors.text }]}>MoMo, ZaloPay, ViettelPay</Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity style={[styles.purchaseButton, { backgroundColor: theme.success }]} onPress={handlePurchase}>
              <Lock size={20} color={theme.onPrimary || colors.text} strokeWidth={2} />
              <Text style={[styles.purchaseButtonText, { color: theme.onPrimary || colors.text }]}>
                {isProcessing ? 'Đang xử lý...' : 'Thanh Toán Bảo Mật'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.restoreButton, { borderColor: colors.border }]} 
              onPress={handleRestore}
              disabled={isProcessing}
            >
              <Text style={[styles.restoreButtonText, { color: colors.mutedText || colors.text }]}>
                {isProcessing ? 'Đang khôi phục...' : 'Khôi Phục Mua Hàng'}
              </Text>
            </TouchableOpacity>
            
            <Text style={[styles.paymentNote, { color: colors.mutedText || colors.text }]}>
              Thanh toán được bảo mật bằng mã hóa SSL 256-bit
            </Text>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingBottom: 10,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  headerRight: {
    width: 40,
  },
  heroSection: {
    alignItems: 'center',
    padding: 40,
    paddingTop: 20,
  },
  crownContainer: {
    position: 'relative',
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
    width: 120,
    height: 120,
  },
  sparkle1: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  sparkle2: {
    position: 'absolute',
    bottom: 15,
    left: 15,
  },
  sparkle3: {
    position: 'absolute',
    top: 30,
    left: 5,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
    marginHorizontal: 20,
  },
  pricingSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  pricingSectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  pricingCards: {
    flexDirection: 'row',
    gap: 12,
    minHeight: 140,
  },
  pricingCard: {
    flex: 1,
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#333',
    position: 'relative',
    minHeight: 120,
    justifyContent: 'space-between',
  },
  selectedPricingCard: {
    borderColor: '#f59e0b',
    backgroundColor: '#1a1a1a',
  },
  recommendedCard: {
    borderColor: '#f59e0b',
  },
  recommendedBadge: {
    position: 'absolute',
    top: -12,
    alignSelf: 'center',
    backgroundColor: '#f59e0b',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    zIndex: 1,
  },
  recommendedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  pricingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    minHeight: 24,
  },
  pricingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
  },
  selectedBadge: {
    backgroundColor: '#4ade80',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  pricingPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: '#f59e0b',
    marginBottom: 4,
  },
  yearlyPricing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  originalPrice: {
    fontSize: 16,
    color: '#666',
    textDecorationLine: 'line-through',
  },
  pricingPeriod: {
    fontSize: 14,
    color: '#888',
    marginBottom: 8,
  },
  savingsText: {
    fontSize: 12,
    color: '#4ade80',
    fontWeight: '600',
  },
  featuresSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  featuresSectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 20,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
    minHeight: 80,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    flexShrink: 0,
  },
  featureContent: {
    flex: 1,
    paddingRight: 8,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
    lineHeight: 22,
  },
  featureDescription: {
    fontSize: 14,
    color: '#888',
    lineHeight: 20,
    flexWrap: 'wrap',
  },
  featureCheck: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  guaranteeSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  guaranteeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4ade80',
    marginTop: 12,
    marginBottom: 8,
  },
  guaranteeDescription: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 20,
  },
  bottomSection: {
    padding: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#333',
    backgroundColor: '#111',
  },
  upgradeButton: {
    backgroundColor: '#f59e0b',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  termsText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 16,
  },
  paymentModal: {
    flex: 1,
    backgroundColor: '#000',
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  paymentTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  closeButton: {
    padding: 8,
  },
  paymentContent: {
    flex: 1,
    padding: 20,
  },
  paymentSummary: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#333',
  },
  paymentPlan: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  paymentPrice: {
    fontSize: 28,
    fontWeight: '700',
    color: '#f59e0b',
    marginBottom: 4,
  },
  paymentSavings: {
    fontSize: 14,
    color: '#4ade80',
    fontWeight: '500',
  },
  paymentMethods: {
    marginBottom: 32,
  },
  paymentMethodsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  paymentMethod: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  paymentMethodText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
    marginBottom: 4,
  },
  paymentMethodSubtext: {
    fontSize: 14,
    color: '#888',
  },
  purchaseButton: {
    backgroundColor: '#4ade80',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
    opacity: 1,
  },
  purchaseButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  restoreButton: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 16,
  },
  restoreButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#888',
  },
  paymentNote: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 16,
  },
});









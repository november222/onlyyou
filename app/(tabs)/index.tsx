import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Wifi, WifiOff, Zap } from 'lucide-react-native';
import { router } from 'expo-router';
import WebRTCService, { ConnectionState } from '../../services/WebRTCService';
import { isFeatureEnabled } from '../../config/features';
import BuzzService, { BuzzTemplate } from '@/services/BuzzService';
import { usePremium } from '@/providers/PremiumProvider';
import { rateLimiter, RATE_LIMITS } from '@/services/RateLimiter';
import { useTheme, useThemeColors } from '@/providers/ThemeProvider';

export default function TouchScreen() {
  const { t } = useTranslation();
  const { isDark, theme } = useTheme();
  const colors = useThemeColors();

  const [connectionState, setConnectionState] = useState<ConnectionState>({
    isConnected: false,
    isConnecting: false,
    roomCode: null,
    partnerConnected: false,
    error: null,
    isWaitingForPartner: false,
  });
  const [buzzCooldown, setBuzzCooldown] = useState<{
    canSend: boolean;
    remainingTime: number;
  }>({
    canSend: true,
    remainingTime: 0,
  });
  const [buzzTemplates, setBuzzTemplates] = useState<BuzzTemplate[]>([]);
  const { isPremium } = usePremium();
  const [partnerName, setPartnerName] = useState<string>(t('common:touch'));

  useEffect(() => {
    WebRTCService.onConnectionStateChange = (state) => {
      setConnectionState(state);
    };

    BuzzService.onBuzzTemplatesChanged = () => {
      loadBuzzTemplates();
    };

    loadPartnerName();
    loadBuzzCooldown();
    loadBuzzTemplates();

    const cooldownTimer = setInterval(loadBuzzCooldown, 1000);

    const currentState = WebRTCService.getConnectionState();
    setConnectionState(currentState);

    return () => {
      WebRTCService.onConnectionStateChange = null;
      BuzzService.onBuzzTemplatesChanged = null;
      clearInterval(cooldownTimer);
    };
  }, []);

  const loadPartnerName = () => {
    const savedConnection = WebRTCService.getSavedConnection();
    if (savedConnection?.partnerName) {
      setPartnerName(savedConnection.partnerName);
    }
  };

  const loadBuzzCooldown = async () => {
    if (isFeatureEnabled('buzz')) {
      const rateLimitCheck = rateLimiter.canPerformAction(
        'buzz_send',
        RATE_LIMITS.BUZZ
      );
      setBuzzCooldown({
        canSend: rateLimitCheck.allowed,
        remainingTime: rateLimitCheck.waitTime
          ? rateLimitCheck.waitTime * 1000
          : 0,
      });
    }
  };

  const loadBuzzTemplates = async () => {
    if (isFeatureEnabled('buzz')) {
      const templates = await BuzzService.getQuickBuzzTemplates(isPremium);
      setBuzzTemplates(templates);
    }
  };

  const sendBuzz = async (templateId: string) => {
    if (!isFeatureEnabled('buzz')) return;

    if (!connectionState.isConnected) {
      Alert.alert(t('messages:notConnected'), t('messages:pleaseConnect'));
      return;
    }

    const recentCount = rateLimiter.getActionCount('buzz_send', 10 * 60 * 1000);
    if (recentCount >= 8 && recentCount < 10) {
      Alert.alert(
        t('touch:spamWarningTitle'),
        t('touch:spamWarningMessage', { count: recentCount }),
        [{ text: t('common:ok') }]
      );
    }

    const result = await BuzzService.sendBuzz(templateId);

    if (result.success) {
      const template = buzzTemplates.find((tpl) => tpl.id === templateId);
      Alert.alert(
        t('touch:buzzSentTitle'),
        t('touch:buzzSentMessage', { text: template?.text ?? '' })
      );
      loadBuzzCooldown();
    } else {
      Alert.alert(
        t('common:error'),
        result.error || t('touch:createBuzz.genericError')
      );
    }
  };

  // Call logic removed

  const getPartnerDisplayName = () => {
    if (connectionState.isConnected && connectionState.roomCode) {
      return t('touch:room', { code: connectionState.roomCode });
    }
    return t('messages:notConnected');
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top', 'bottom']}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerContent}>
            <View style={styles.connectionStatus}>
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor: connectionState.isConnected
                      ? theme.success
                      : theme.danger,
                  },
                ]}
              />
              <View style={styles.connectionInfo}>
                <Text style={[styles.headerTitle, { color: colors.text }]}>
                  {partnerName}
                </Text>
                <Text
                  style={[
                    styles.partnerName,
                    { color: colors.mutedText || colors.text },
                  ]}
                >
                  {getPartnerDisplayName()}
                </Text>
              </View>
            </View>
            <View style={styles.connectionStatusIcon}>
              {connectionState.isConnected ? (
                <Wifi size={20} color={theme.success} strokeWidth={2} />
              ) : (
                <WifiOff size={20} color={theme.danger} strokeWidth={2} />
              )}
            </View>
          </View>
          <Text
            style={[
              styles.headerSubtitle,
              { color: colors.mutedText || colors.text },
            ]}
          >
            {connectionState.isConnected
              ? t('messages:connectedEncrypted')
              : connectionState.isConnecting
              ? t('messages:connecting')
              : connectionState.error || t('touch:connectToUseTouch')}
          </Text>
        </View>

        {/* Buzz Buttons */}
        {isFeatureEnabled('buzz') && (
          <View
            style={[
              styles.buzzContainer,
              {
                backgroundColor: colors.card,
                borderBottomColor: colors.border,
              },
            ]}
          >
            <View style={{ alignItems: 'center', marginBottom: 12 }}>
              <TouchableOpacity
                activeOpacity={0.85}
                style={[
                  styles.bigBuzzButton,
                  {
                    backgroundColor: theme.primary,
                    shadowColor: theme.primary,
                  },
                  (!connectionState.isConnected || !buzzCooldown.canSend) &&
                    styles.bigBuzzButtonDisabled,
                ]}
                onPress={() => {
                  if (buzzTemplates[0]) {
                    sendBuzz(buzzTemplates[0].id);
                  }
                }}
                disabled={!connectionState.isConnected || !buzzCooldown.canSend}
              >
                <View style={styles.bigBuzzInnerGlow} />
                <Zap
                  size={30}
                  color={theme.onPrimary || colors.text}
                  strokeWidth={2.5}
                />
                <Text
                  style={[
                    styles.bigBuzzLabel,
                    { color: theme.onPrimary || colors.text },
                  ]}
                >
                  {t('common:sendBuzz')}
                </Text>
              </TouchableOpacity>
              {!buzzCooldown.canSend && (
                <Text style={styles.cooldownLargeText}>
                  {t('touch:cooldownWait', {
                    seconds: Math.ceil(buzzCooldown.remainingTime / 1000),
                  })}
                </Text>
              )}
            </View>
            <Text style={[styles.buzzTitle, { color: theme.primary }]}>
              {t('touch:quickBuzz')}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.buzzButtons}
            >
              {buzzTemplates
                .slice(0, isPremium ? buzzTemplates.length : 5)
                .map((template) => (
                  <TouchableOpacity
                    key={template.id}
                    style={[
                      styles.buzzButton,
                      {
                        backgroundColor: theme.primary + '1A',
                        borderColor: theme.primary + '33',
                      },
                      !buzzCooldown.canSend && styles.buzzButtonDisabled,
                    ]}
                    onPress={() => sendBuzz(template.id)}
                    disabled={!buzzCooldown.canSend}
                  >
                    <Text style={styles.buzzButtonText}>
                      {template.emoji || '✨'}
                    </Text>
                    <Text
                      style={[styles.buzzButtonLabel, { color: colors.text }]}
                      numberOfLines={2}
                    >
                      {template.text}
                    </Text>
                    {template.type === 'custom' && (
                      <Text style={styles.customBadge}>
                        {t('touch:customBadge')}
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
            </ScrollView>
            {!buzzCooldown.canSend && (
              <Text
                style={[styles.cooldownMessage, { color: theme.secondary }]}
              >
                {buzzCooldown.remainingTime > 60000
                  ? t('touch:cooldownLocked', {
                      minutes: Math.floor(buzzCooldown.remainingTime / 60000),
                      seconds: Math.ceil(
                        (buzzCooldown.remainingTime % 60000) / 1000
                      ),
                    })
                  : t('touch:cooldownWait', {
                      seconds: Math.ceil(buzzCooldown.remainingTime / 1000),
                    })}
              </Text>
            )}
          </View>
        )}

        {/* Touch Navigation */}
        <View style={styles.touchNavigation}>
          <Text style={[styles.touchTitle, { color: colors.text }]}>
            {t('touch:title')}
          </Text>
          <Text
            style={[
              styles.touchSubtitle,
              { color: colors.mutedText || colors.text },
            ]}
          >
            {connectionState.isConnected
              ? t('touch:chooseInteraction')
              : t('touch:connectToUnlock')}
          </Text>

          <View style={styles.touchButtons}>
            <TouchableOpacity
              style={[
                styles.touchButton,
                { backgroundColor: colors.card, borderColor: colors.border },
                (!connectionState.isConnected || !isPremium) &&
                  styles.touchButtonDisabled,
              ]}
              onPress={() => {
                if (!isPremium) {
                  Alert.alert(
                    t('touch:premiumFeatureTitle'),
                    t('touch:customBuzzPremiumMessage'),
                    [
                      { text: t('common:cancel'), style: 'cancel' },
                      {
                        text: t('touch:createBuzz.upgrade'),
                        onPress: () => router.push('/premium'),
                      },
                    ]
                  );
                } else {
                  router.push('/touch/buzz-call');
                }
              }}
              disabled={!connectionState.isConnected}
            >
              <Text style={styles.touchButtonIcon}>💬</Text>
              <Text style={[styles.touchButtonText, { color: colors.text }]}>
                {t('touch:customBuzz')}
              </Text>
              {!isPremium && (
                <Text style={styles.touchButtonPremiumBadge}>
                  âœ¨ {t('common:premium')}
                </Text>
              )}
              {!connectionState.isConnected && (
                <Text
                  style={[
                    styles.touchButtonDisabledText,
                    { color: colors.mutedText || colors.text },
                  ]}
                >
                  {t('touch:needConnection')}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.touchButton,
                { backgroundColor: colors.card, borderColor: colors.border },
                (!connectionState.isConnected || !isPremium) &&
                  styles.touchButtonDisabled,
              ]}
              onPress={() => {
                if (!isPremium) {
                  Alert.alert(
                    t('touch:premiumFeatureTitle'),
                    t('touch:calendarPremiumMessage'),
                    [
                      { text: t('common:cancel'), style: 'cancel' },
                      {
                        text: t('touch:createBuzz.upgrade'),
                        onPress: () => router.push('/premium'),
                      },
                    ]
                  );
                } else {
                  router.push('/touch/calendar');
                }
              }}
              disabled={!connectionState.isConnected}
            >
              <Text style={styles.touchButtonIcon}>📅</Text>
              <Text style={[styles.touchButtonText, { color: colors.text }]}>
                {t('common:calendar')}
              </Text>
              {!isPremium && (
                <Text style={styles.touchButtonPremiumBadge}>
                  âœ¨ {t('common:premium')}
                </Text>
              )}
              {!connectionState.isConnected && (
                <Text
                  style={[
                    styles.touchButtonDisabledText,
                    { color: colors.mutedText || colors.text },
                  ]}
                >
                  {t('touch:needConnection')}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.touchButton,
                { backgroundColor: colors.card, borderColor: colors.border },
                (!connectionState.isConnected || !isPremium) &&
                  styles.touchButtonDisabled,
              ]}
              onPress={() => {
                if (!isPremium) {
                  Alert.alert(
                    t('touch:premiumFeatureTitle'),
                    t('touch:galleryPremiumMessage'),
                    [
                      { text: t('common:cancel'), style: 'cancel' },
                      {
                        text: t('touch:createBuzz.upgrade'),
                        onPress: () => router.push('/premium'),
                      },
                    ]
                  );
                } else {
                  router.push('/touch/shared-gallery');
                }
              }}
              disabled={!connectionState.isConnected}
            >
              <Text style={styles.touchButtonIcon}>🖼️</Text>
              <Text style={[styles.touchButtonText, { color: colors.text }]}>
                {t('common:sharedGallery')}
              </Text>
              {!isPremium && (
                <Text style={styles.touchButtonPremiumBadge}>
                  âœ¨ {t('common:premium')}
                </Text>
              )}
              {!connectionState.isConnected && (
                <Text
                  style={[
                    styles.touchButtonDisabledText,
                    { color: colors.mutedText || colors.text },
                  ]}
                >
                  {t('touch:needConnection')}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  connectionInfo: {
    flexDirection: 'column',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  partnerName: {
    fontSize: 12,
  },
  connectionStatusIcon: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerSubtitle: {
    fontSize: 14,

    marginLeft: 16,
  },
  touchNavigation: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  touchTitle: {
    fontSize: 24,
    fontWeight: '700',

    marginBottom: 8,
    textAlign: 'center',
  },
  touchSubtitle: {
    fontSize: 16,

    marginBottom: 40,
    textAlign: 'center',
  },
  touchButtons: {
    width: '100%',
    gap: 20,
  },
  touchButton: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
  },
  touchButtonDisabled: {
    opacity: 0.5,
  },
  touchButtonIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  touchButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  touchButtonDisabledText: {
    fontSize: 12,

    marginTop: 4,
  },
  touchButtonPremiumBadge: {
    fontSize: 11,

    marginTop: 4,
    fontWeight: '600',
  },
  buzzContainer: {
    borderBottomWidth: 1,

    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  buzzTitle: {
    fontSize: 14,
    fontWeight: '600',

    marginBottom: 12,
    textAlign: 'center',
  },
  buzzButtons: {
    paddingHorizontal: 10,
    gap: 12,
  },
  buzzButton: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,

    minWidth: 80,
    maxWidth: 100,
    borderWidth: 1,

    position: 'relative',
  },
  buzzButtonDisabled: {
    opacity: 0.5,
  },
  buzzButtonText: {
    fontSize: 24,
    marginBottom: 4,
  },
  buzzButtonLabel: {
    fontSize: 11,

    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 14,
    marginTop: 4,
  },
  customBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
    fontSize: 8,

    fontWeight: '600',
  },
  cooldownMessage: {
    fontSize: 12,

    textAlign: 'center',
    marginTop: 8,
  },
  bigBuzzButton: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.55,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  bigBuzzInnerGlow: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  bigBuzzLabel: {
    marginTop: 6,

    fontWeight: '700',
    fontSize: 14,
  },
  bigBuzzButtonDisabled: {
    opacity: 0.6,
  },
  cooldownLargeText: {
    marginTop: 6,

    fontSize: 12,
  },
});

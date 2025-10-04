import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { rateLimiter, RATE_LIMITS } from '@/services/RateLimiter';

interface RateLimitIndicatorProps {
  actionType: 'buzz' | 'calendar_add' | 'calendar_delete' | 'photo_upload' | 'photo_delete';
  showLabel?: boolean;
}

const ACTION_CONFIGS = {
  buzz: {
    label: 'Buzz',
    config: RATE_LIMITS.BUZZ,
    actionKey: 'buzz_send',
  },
  calendar_add: {
    label: 'Add Event',
    config: RATE_LIMITS.CALENDAR_ADD,
    actionKey: 'calendar_add',
  },
  calendar_delete: {
    label: 'Delete Event',
    config: RATE_LIMITS.CALENDAR_DELETE,
    actionKey: 'calendar_delete',
  },
  photo_upload: {
    label: 'Upload Photo',
    config: RATE_LIMITS.PHOTO_UPLOAD,
    actionKey: 'photo_upload',
  },
  photo_delete: {
    label: 'Delete Photo',
    config: RATE_LIMITS.PHOTO_DELETE,
    actionKey: 'photo_delete',
  },
};

export function RateLimitIndicator({ actionType, showLabel = false }: RateLimitIndicatorProps) {
  const [remaining, setRemaining] = useState<number>(0);
  const [max, setMax] = useState<number>(0);

  useEffect(() => {
    const updateQuota = () => {
      const actionConfig = ACTION_CONFIGS[actionType];
      const remainingQuota = rateLimiter.getRemainingQuota(
        actionConfig.actionKey,
        actionConfig.config
      );
      setRemaining(remainingQuota);
      setMax(actionConfig.config.maxActions);
    };

    updateQuota();

    const interval = setInterval(updateQuota, 1000);

    return () => clearInterval(interval);
  }, [actionType]);

  const percentage = max > 0 ? (remaining / max) * 100 : 0;

  const getColor = () => {
    if (percentage >= 60) return '#4ade80';
    if (percentage >= 30) return '#f59e0b';
    return '#ef4444';
  };

  if (!showLabel && remaining === max) {
    return null;
  }

  return (
    <View style={styles.container}>
      {showLabel && (
        <Text style={styles.label}>
          {ACTION_CONFIGS[actionType].label}: {remaining}/{max}
        </Text>
      )}
      <View style={styles.barContainer}>
        <View
          style={[
            styles.barFill,
            {
              width: `${percentage}%`,
              backgroundColor: getColor(),
            },
          ]}
        />
      </View>
      {remaining === 0 && (
        <Text style={styles.warningText}>Đã đạt giới hạn, vui lòng đợi</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  barContainer: {
    height: 4,
    backgroundColor: '#333',
    borderRadius: 2,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 2,
  },
  warningText: {
    fontSize: 11,
    color: '#ef4444',
    marginTop: 4,
  },
});

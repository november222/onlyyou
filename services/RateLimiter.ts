interface RateLimitConfig {
  maxActions: number;
  windowMs: number;
  cooldownMs?: number;
  spamThreshold?: number;
  spamPenaltyMs?: number;
}

interface ActionRecord {
  timestamp: number;
  count: number;
}

class RateLimiter {
  private static instance: RateLimiter;
  private actionRecords: Map<string, ActionRecord[]> = new Map();
  private cooldowns: Map<string, number> = new Map();
  private spamWarnings: Map<string, boolean> = new Map();

  private constructor() {}

  static getInstance(): RateLimiter {
    if (!RateLimiter.instance) {
      RateLimiter.instance = new RateLimiter();
    }
    return RateLimiter.instance;
  }

  canPerformAction(actionKey: string, config: RateLimitConfig): { allowed: boolean; reason?: string; waitTime?: number; isSpamWarning?: boolean } {
    const now = Date.now();

    const cooldownEnd = this.cooldowns.get(actionKey);
    if (cooldownEnd && now < cooldownEnd) {
      const waitTime = Math.ceil((cooldownEnd - now) / 1000);
      const isLongCooldown = (cooldownEnd - now) > 60000;
      return {
        allowed: false,
        reason: isLongCooldown
          ? `⚠️ Bạn đã spam quá nhiều! Vui lòng đợi ${Math.ceil(waitTime / 60)} phút ${waitTime % 60} giây`
          : `Vui lòng đợi ${waitTime} giây trước khi thực hiện lại`,
        waitTime
      };
    }

    const records = this.actionRecords.get(actionKey) || [];

    const recentRecords = records.filter(
      record => now - record.timestamp < config.windowMs
    );

    const totalActions = recentRecords.reduce((sum, record) => sum + record.count, 0);

    if (totalActions >= config.maxActions) {
      if (config.cooldownMs) {
        this.cooldowns.set(actionKey, now + config.cooldownMs);
      }

      const oldestRecord = recentRecords[0];
      const waitTime = oldestRecord
        ? Math.ceil((config.windowMs - (now - oldestRecord.timestamp)) / 1000)
        : Math.ceil(config.windowMs / 1000);

      return {
        allowed: false,
        reason: `Bạn đã vượt quá giới hạn (${config.maxActions} lần/${Math.ceil(config.windowMs / 1000)}s). Vui lòng đợi ${waitTime} giây`,
        waitTime
      };
    }

    return { allowed: true };
  }

  recordAction(actionKey: string, config?: RateLimitConfig): { isSpamWarning?: boolean } {
    const now = Date.now();
    const records = this.actionRecords.get(actionKey) || [];

    records.push({
      timestamp: now,
      count: 1
    });

    this.actionRecords.set(actionKey, records);

    let isSpamWarning = false;

    if (config?.spamThreshold && config?.spamPenaltyMs) {
      const spamWindow = 10 * 60 * 1000;
      const recentActions = records.filter(r => now - r.timestamp < spamWindow);

      if (recentActions.length >= config.spamThreshold) {
        this.cooldowns.set(actionKey, now + config.spamPenaltyMs);
        isSpamWarning = true;
        this.spamWarnings.set(actionKey, true);
      }
    }

    this.cleanup(actionKey, now);

    return { isSpamWarning };
  }

  private cleanup(actionKey: string, now: number): void {
    const records = this.actionRecords.get(actionKey);
    if (!records) return;

    const maxAge = 5 * 60 * 1000;
    const filtered = records.filter(record => now - record.timestamp < maxAge);

    if (filtered.length === 0) {
      this.actionRecords.delete(actionKey);
    } else {
      this.actionRecords.set(actionKey, filtered);
    }
  }

  getRemainingQuota(actionKey: string, config: RateLimitConfig): number {
    const now = Date.now();
    const records = this.actionRecords.get(actionKey) || [];

    const recentRecords = records.filter(
      record => now - record.timestamp < config.windowMs
    );

    const totalActions = recentRecords.reduce((sum, record) => sum + record.count, 0);
    return Math.max(0, config.maxActions - totalActions);
  }

  getActionCount(actionKey: string, windowMs: number): number {
    const now = Date.now();
    const records = this.actionRecords.get(actionKey) || [];
    return records.filter(r => now - r.timestamp < windowMs).length;
  }

  reset(actionKey?: string): void {
    if (actionKey) {
      this.actionRecords.delete(actionKey);
      this.cooldowns.delete(actionKey);
      this.spamWarnings.delete(actionKey);
    } else {
      this.actionRecords.clear();
      this.cooldowns.clear();
      this.spamWarnings.clear();
    }
  }
}

export const rateLimiter = RateLimiter.getInstance();

export const RATE_LIMITS = {
  BUZZ: {
    maxActions: 1,
    windowMs: 30 * 1000,
    cooldownMs: 0,
    spamThreshold: 10,
    spamPenaltyMs: 10 * 60 * 1000,
  },
  CALENDAR_ADD: {
    maxActions: 10,
    windowMs: 60 * 1000,
  },
  CALENDAR_DELETE: {
    maxActions: 20,
    windowMs: 60 * 1000,
  },
  PHOTO_UPLOAD: {
    maxActions: 20,
    windowMs: 60 * 1000,
    cooldownMs: 60 * 1000,
  },
  PHOTO_DELETE: {
    maxActions: 30,
    windowMs: 60 * 1000,
  },
} as const;

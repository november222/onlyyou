import AsyncStorage from '@react-native-async-storage/async-storage';
import pingsData from '@/data/pings.json';

export interface PingQuestion {
  id: string;
  question: string;
  category: string;
}

export interface PingAnswer {
  id: string;
  questionId: string;
  question: string;
  answer: string;
  date: string; // YYYY-MM-DD format
  timestamp: number;
  userId: string;
}

export interface PingEvent {
  id: string;
  type: 'ping';
  questionId: string;
  question: string;
  answer: string;
  timestamp: number;
  userId: string;
}

class PingService {
  private readonly DAILY_STORAGE_KEY = 'onlyyou_daily';
  private readonly EVENTS_STORAGE_KEY = 'onlyyou_events';

  // Get today's question based on date hash
  public getTodaysQuestion(): PingQuestion {
    const today = new Date();
    const dateString = today.toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Simple hash function to get consistent question for the day
    let hash = 0;
    for (let i = 0; i < dateString.length; i++) {
      const char = dateString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    const questionIndex = Math.abs(hash) % pingsData.length;
    return pingsData[questionIndex];
  }

  // Check if user has answered today's ping
  public async hasAnsweredToday(): Promise<boolean> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const dailyData = await AsyncStorage.getItem(this.DAILY_STORAGE_KEY);
      
      if (!dailyData) return false;
      
      const answers = JSON.parse(dailyData);
      return answers.some((answer: PingAnswer) => answer.date === today);
    } catch (error) {
      console.error('Failed to check daily ping status:', error);
      return false;
    }
  }

  // Save user's answer to today's ping
  public async answerTodaysPing(answer: string): Promise<{ success: boolean; error?: string }> {
    try {
      const todaysQuestion = this.getTodaysQuestion();
      const today = new Date().toISOString().split('T')[0];
      const timestamp = Date.now();
      
      // Check if already answered today
      const alreadyAnswered = await this.hasAnsweredToday();
      if (alreadyAnswered) {
        return {
          success: false,
          error: 'Bạn đã trả lời câu hỏi hôm nay rồi!',
        };
      }

      // Create ping answer
      const pingAnswer: PingAnswer = {
        id: `ping_answer_${timestamp}`,
        questionId: todaysQuestion.id,
        question: todaysQuestion.question,
        answer: answer.trim(),
        date: today,
        timestamp,
        userId: 'current_user',
      };

      // Save to daily answers
      await this.saveDailyAnswer(pingAnswer);

      // Create event for timeline
      const pingEvent: PingEvent = {
        id: `ping_event_${timestamp}`,
        type: 'ping',
        questionId: todaysQuestion.id,
        question: todaysQuestion.question,
        answer: answer.trim(),
        timestamp,
        userId: 'current_user',
      };

      // Save to events timeline
      await this.saveToTimeline(pingEvent);

      console.log('Daily ping answered:', todaysQuestion.question, '→', answer);

      return { success: true };
    } catch (error) {
      console.error('Failed to answer daily ping:', error);
      return {
        success: false,
        error: 'Không thể lưu câu trả lời. Vui lòng thử lại.',
      };
    }
  }

  // Get all daily ping answers
  public async getDailyAnswers(): Promise<PingAnswer[]> {
    try {
      const dailyData = await AsyncStorage.getItem(this.DAILY_STORAGE_KEY);
      if (!dailyData) return [];
      
      const answers = JSON.parse(dailyData);
      return answers.sort((a: PingAnswer, b: PingAnswer) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('Failed to get daily answers:', error);
      return [];
    }
  }

  // Get today's answer if exists
  public async getTodaysAnswer(): Promise<PingAnswer | null> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const answers = await this.getDailyAnswers();
      
      return answers.find(answer => answer.date === today) || null;
    } catch (error) {
      console.error('Failed to get today\'s answer:', error);
      return null;
    }
  }

  // Private: Save daily answer to storage
  private async saveDailyAnswer(answer: PingAnswer): Promise<void> {
    try {
      const dailyData = await AsyncStorage.getItem(this.DAILY_STORAGE_KEY);
      const answers = dailyData ? JSON.parse(dailyData) : [];
      
      answers.unshift(answer); // Add to beginning (newest first)
      
      // Keep only last 365 days to prevent storage bloat
      if (answers.length > 365) {
        answers.splice(365);
      }
      
      await AsyncStorage.setItem(this.DAILY_STORAGE_KEY, JSON.stringify(answers));
    } catch (error) {
      console.error('Failed to save daily answer:', error);
      throw error;
    }
  }

  // Private: Save ping event to timeline
  private async saveToTimeline(event: PingEvent): Promise<void> {
    try {
      const eventsData = await AsyncStorage.getItem(this.EVENTS_STORAGE_KEY);
      const events = eventsData ? JSON.parse(eventsData) : [];
      
      events.unshift(event); // Add to beginning (newest first)
      
      // Keep only last 1000 events
      if (events.length > 1000) {
        events.splice(1000);
      }
      
      await AsyncStorage.setItem(this.EVENTS_STORAGE_KEY, JSON.stringify(events));
    } catch (error) {
      console.error('Failed to save ping event to timeline:', error);
      throw error;
    }
  }

  // Get ping streak (consecutive days answered)
  public async getPingStreak(): Promise<number> {
    try {
      const answers = await this.getDailyAnswers();
      if (answers.length === 0) return 0;
      
      let streak = 0;
      const today = new Date();
      
      for (let i = 0; i < answers.length; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(today.getDate() - i);
        const checkDateString = checkDate.toISOString().split('T')[0];
        
        const hasAnswerForDate = answers.some(answer => answer.date === checkDateString);
        
        if (hasAnswerForDate) {
          streak++;
        } else {
          break;
        }
      }
      
      return streak;
    } catch (error) {
      console.error('Failed to calculate ping streak:', error);
      return 0;
    }
  }
}

export default new PingService();
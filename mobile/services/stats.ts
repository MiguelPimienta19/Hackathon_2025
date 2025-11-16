import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserStats {
  totalXP: number;
  currentStreak: number;
  lastPracticeDate: string;
  quizCompletions: number;
  interviewCompletions: number;
  bestQuizScore: number;
}

const STATS_KEY = '@user_stats';

const DEFAULT_STATS: UserStats = {
  totalXP: 0,
  currentStreak: 0,
  lastPracticeDate: '',
  quizCompletions: 0,
  interviewCompletions: 0,
  bestQuizScore: 0,
};

export const statsService = {
  /**
   * Get current user stats
   */
  async getStats(): Promise<UserStats> {
    try {
      const data = await AsyncStorage.getItem(STATS_KEY);
      if (data) {
        return JSON.parse(data);
      }
      return DEFAULT_STATS;
    } catch (error) {
      console.error('Error loading stats:', error);
      return DEFAULT_STATS;
    }
  },

  /**
   * Save stats to storage
   */
  async saveStats(stats: UserStats): Promise<void> {
    try {
      await AsyncStorage.setItem(STATS_KEY, JSON.stringify(stats));
    } catch (error) {
      console.error('Error saving stats:', error);
    }
  },

  /**
   * Update streak based on last practice date
   */
  updateStreak(stats: UserStats): UserStats {
    const today = new Date().toDateString();
    const lastDate = stats.lastPracticeDate;

    if (lastDate === today) {
      // Already practiced today, no change
      return stats;
    }

    if (lastDate === '') {
      // First time practicing
      return {
        ...stats,
        currentStreak: 1,
        lastPracticeDate: today,
      };
    }

    // Check if yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    if (lastDate === yesterdayStr) {
      // Streak continues
      return {
        ...stats,
        currentStreak: stats.currentStreak + 1,
        lastPracticeDate: today,
      };
    }

    // Streak broken
    return {
      ...stats,
      currentStreak: 1,
      lastPracticeDate: today,
    };
  },

  /**
   * Award XP for quiz completion
   */
  async completeQuiz(score: number, totalQuestions: number): Promise<UserStats> {
    const stats = await this.getStats();
    const percentage = (score / totalQuestions) * 100;

    // Calculate XP
    let xpEarned = score * 10; // 10 XP per correct answer
    xpEarned += 50; // Bonus for completing quiz

    // Perfect score bonus
    if (percentage === 100) {
      xpEarned += 50;
    }

    // Update stats
    const updatedStats: UserStats = {
      ...this.updateStreak(stats),
      totalXP: stats.totalXP + xpEarned,
      quizCompletions: stats.quizCompletions + 1,
      bestQuizScore: Math.max(stats.bestQuizScore, percentage),
    };

    await this.saveStats(updatedStats);
    return updatedStats;
  },

  /**
   * Award XP for interview completion
   */
  async completeInterview(averageScore: number): Promise<UserStats> {
    const stats = await this.getStats();

    // Base XP for completing interview
    let xpEarned = 100;

    // Bonus based on average score (0-5)
    xpEarned += averageScore * 20;

    // Update stats
    const updatedStats: UserStats = {
      ...this.updateStreak(stats),
      totalXP: stats.totalXP + xpEarned,
      interviewCompletions: stats.interviewCompletions + 1,
    };

    await this.saveStats(updatedStats);
    return updatedStats;
  },

  /**
   * Reset all stats (for testing)
   */
  async resetStats(): Promise<void> {
    await AsyncStorage.removeItem(STATS_KEY);
  },
};

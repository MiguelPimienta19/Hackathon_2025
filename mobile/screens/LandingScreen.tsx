import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { statsService, UserStats } from '../services/stats';

type Screen = 'Landing' | 'ModeSelection' | 'Quiz' | 'Interview';

interface LandingScreenProps {
  onNavigate: (screen: Screen) => void;
}

export const LandingScreen: React.FC<LandingScreenProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState<UserStats | null>(null);

  useEffect(() => {
    // Load stats when component mounts
    statsService.getStats().then(setStats);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.headerContainer}>
          <Text style={styles.appName}>TechPrep</Text>
          <Text style={styles.tagline}>Master Technical Interviews</Text>
        </View>

        {stats && (stats.totalXP > 0 || stats.currentStreak > 0) && (
          <View style={styles.statsCard}>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.currentStreak}</Text>
                <Text style={styles.statLabel}>Day Streak</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.totalXP}</Text>
                <Text style={styles.statLabel}>Total XP</Text>
              </View>
            </View>
            <View style={styles.statsRowSecondary}>
              <View style={styles.statItemSecondary}>
                <Text style={styles.statValueSecondary}>{stats.quizCompletions}</Text>
                <Text style={styles.statLabelSecondary}>Quizzes</Text>
              </View>
              <View style={styles.statItemSecondary}>
                <Text style={styles.statValueSecondary}>{stats.interviewCompletions}</Text>
                <Text style={styles.statLabelSecondary}>Interviews</Text>
              </View>
              {stats.bestQuizScore > 0 && (
                <View style={styles.statItemSecondary}>
                  <Text style={styles.statValueSecondary}>{stats.bestQuizScore.toFixed(0)}%</Text>
                  <Text style={styles.statLabelSecondary}>Best Score</Text>
                </View>
              )}
            </View>
          </View>
        )}

        <View style={styles.featureContainer}>
          <View style={styles.feature}>
            <Ionicons name="library" size={32} color="#FFD60A" style={styles.featureIcon} />
            <Text style={styles.featureText}>Practice Questions</Text>
          </View>
          <View style={styles.feature}>
            <Ionicons name="checkmark-circle" size={32} color="#34C759" style={styles.featureIcon} />
            <Text style={styles.featureText}>Instant Feedback</Text>
          </View>
          <View style={styles.feature}>
            <Ionicons name="trending-up" size={32} color="#007AFF" style={styles.featureIcon} />
            <Text style={styles.featureText}>Track Progress</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.getStartedButton}
          onPress={() => onNavigate('ModeSelection')}
        >
          <Text style={styles.getStartedText}>Get Started</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 24,
  },
  headerContainer: {
    marginTop: 60,
    alignItems: 'center',
  },
  appName: {
    fontSize: 56,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -2,
  },
  tagline: {
    fontSize: 18,
    color: '#a1a1a6',
    marginTop: 8,
    letterSpacing: 0.5,
  },
  statsCard: {
    backgroundColor: '#1c1c1e',
    borderRadius: 16,
    padding: 20,
    marginTop: 32,
    borderWidth: 2,
    borderColor: '#2c2c2e',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#007AFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#a1a1a6',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#2c2c2e',
  },
  statsRowSecondary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#2c2c2e',
  },
  statItemSecondary: {
    alignItems: 'center',
  },
  statValueSecondary: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  statLabelSecondary: {
    fontSize: 11,
    color: '#8e8e93',
    fontWeight: '600',
  },
  featureContainer: {
    gap: 20,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c1c1e',
    padding: 20,
    borderRadius: 16,
  },
  featureIcon: {
    marginRight: 16,
  },
  featureText: {
    fontSize: 18,
    color: '#ffffff',
    fontWeight: '600',
  },
  getStartedButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 20,
  },
  getStartedText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
});

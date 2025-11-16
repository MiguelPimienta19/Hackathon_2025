import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

type Screen = 'Landing' | 'ModeSelection' | 'Quiz' | 'Interview';

interface ModeSelectionScreenProps {
  onNavigate: (screen: Screen) => void;
  onGoBack: () => void;
}

export const ModeSelectionScreen: React.FC<ModeSelectionScreenProps> = ({ onNavigate, onGoBack }) => {

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Choose Your Mode</Text>
          <Text style={styles.subtitle}>Select how you want to practice</Text>
        </View>

        <View style={styles.modesContainer}>
          <TouchableOpacity
            style={[styles.modeCard, styles.fastCard]}
            onPress={() => onNavigate('Quiz')}
          >
            <Ionicons name="flash" size={48} color="#FFD60A" style={styles.modeIcon} />
            <Text style={styles.modeTitle}>Quick Review</Text>
            <Text style={styles.modeDescription}>
              Quick multiple choice questions to test your knowledge
            </Text>
            <View style={styles.modeBadge}>
              <Text style={styles.badgeText}>5 min</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeCard, styles.longCard]}
            onPress={() => onNavigate('Interview')}
          >
            <Ionicons name="mic" size={48} color="#007AFF" style={styles.modeIcon} />
            <Text style={styles.modeTitle}>Deep Dive</Text>
            <Text style={styles.modeDescription}>
              In-depth interview practice with AI voice feedback
            </Text>
            <View style={styles.modeBadge}>
              <Text style={styles.badgeText}>10-15 min</Text>
            </View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.backButton}
          onPress={onGoBack}
        >
          <Text style={styles.backText}>← Back</Text>
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
    padding: 24,
  },
  header: {
    marginTop: 20,
    marginBottom: 40,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    color: '#a1a1a6',
    marginTop: 8,
  },
  modesContainer: {
    flex: 1,
    gap: 20,
  },
  modeCard: {
    backgroundColor: '#1c1c1e',
    padding: 28,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  fastCard: {
    borderColor: '#FFD60A',
  },
  longCard: {
    borderColor: '#007AFF',
  },
  modeIcon: {
    marginBottom: 12,
  },
  modeTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  modeDescription: {
    fontSize: 16,
    color: '#a1a1a6',
    lineHeight: 22,
    marginBottom: 16,
  },
  modeBadge: {
    backgroundColor: '#2c2c2e',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#a1a1a6',
  },
  backButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  backText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
});

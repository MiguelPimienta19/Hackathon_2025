import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

type Screen = 'Landing' | 'ModeSelection' | 'Quiz' | 'Interview';

interface LandingScreenProps {
  onNavigate: (screen: Screen) => void;
}

export const LandingScreen: React.FC<LandingScreenProps> = ({ onNavigate }) => {

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.headerContainer}>
          <Text style={styles.appName}>TechPrep</Text>
          <Text style={styles.tagline}>Master Technical Interviews</Text>
        </View>

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

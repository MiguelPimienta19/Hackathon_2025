import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native';
import { DuoButton } from '../components/DuoButton';

const { width, height } = Dimensions.get('window');

export const LandingScreen: React.FC = () => {
  const handleGetStarted = () => {
    console.log('Get Started pressed');
    // Navigation will be implemented later
  };

  const handleSignIn = () => {
    console.log('Sign In pressed');
    // Navigation will be implemented later
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F7F7" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          {/* Mascot Character */}
          <View style={styles.mascotContainer}>
            <View style={styles.mascot}>
              <Text style={styles.mascotEmoji}>🎤</Text>
            </View>
            <View style={[styles.mascot, styles.mascotSecondary, { top: 20, left: -30 }]}>
              <Text style={styles.mascotEmoji}>💻</Text>
            </View>
            <View style={[styles.mascot, styles.mascotTertiary, { top: 40, right: -20 }]}>
              <Text style={styles.mascotEmoji}>🧠</Text>
            </View>
          </View>

          {/* Title */}
          <Text style={styles.title}>Ace Your Tech Interviews</Text>
          <Text style={styles.subtitle}>
            Practice with AI-powered coaching, just like learning a language
          </Text>

          {/* Features Grid */}
          <View style={styles.featuresGrid}>
            <View style={styles.featureCard}>
              <View style={styles.featureIconContainer}>
                <Text style={styles.featureIcon}>⚡</Text>
              </View>
              <Text style={styles.featureTitle}>5-Min Lessons</Text>
              <Text style={styles.featureText}>Quick daily practice sessions</Text>
            </View>

            <View style={styles.featureCard}>
              <View style={styles.featureIconContainer}>
                <Text style={styles.featureIcon}>🎯</Text>
              </View>
              <Text style={styles.featureTitle}>Smart AI Coach</Text>
              <Text style={styles.featureText}>Get instant feedback</Text>
            </View>

            <View style={styles.featureCard}>
              <View style={styles.featureIconContainer}>
                <Text style={styles.featureIcon}>🔥</Text>
              </View>
              <Text style={styles.featureTitle}>Build Streaks</Text>
              <Text style={styles.featureText}>Stay motivated daily</Text>
            </View>

            <View style={styles.featureCard}>
              <View style={styles.featureIconContainer}>
                <Text style={styles.featureIcon}>🗣️</Text>
              </View>
              <Text style={styles.featureTitle}>Voice Practice</Text>
              <Text style={styles.featureText}>Explain out loud</Text>
            </View>
          </View>
        </View>

        {/* How it Works Section */}
        <View style={styles.howItWorksSection}>
          <Text style={styles.sectionTitle}>How It Works</Text>

          <View style={styles.stepContainer}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepNumber}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Choose Your Track</Text>
              <Text style={styles.stepText}>
                Data Structures, Algorithms, System Design, or Behavioral
              </Text>
            </View>
          </View>

          <View style={styles.stepContainer}>
            <View style={[styles.stepBadge, styles.stepBadgeBlue]}>
              <Text style={styles.stepNumber}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Practice Daily</Text>
              <Text style={styles.stepText}>
                Mix of multiple-choice, code review, and voice questions
              </Text>
            </View>
          </View>

          <View style={styles.stepContainer}>
            <View style={[styles.stepBadge, styles.stepBadgePurple]}>
              <Text style={styles.stepNumber}>3</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Get AI Feedback</Text>
              <Text style={styles.stepText}>
                Your AI coach evaluates and speaks feedback back to you
              </Text>
            </View>
          </View>
        </View>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>1000+</Text>
            <Text style={styles.statLabel}>Interview Questions</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>AI</Text>
            <Text style={styles.statLabel}>Powered Coaching</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>5min</Text>
            <Text style={styles.statLabel}>Per Day</Text>
          </View>
        </View>

        {/* CTA Section */}
        <View style={styles.ctaSection}>
          <Text style={styles.ctaTitle}>Ready to level up?</Text>
          <Text style={styles.ctaSubtitle}>
            Join thousands preparing for their dream job
          </Text>

          <DuoButton
            title="Get Started"
            onPress={handleGetStarted}
            variant="primary"
            style={styles.ctaButton}
          />

          <DuoButton
            title="I Already Have an Account"
            onPress={handleSignIn}
            variant="outline"
            style={styles.signInButton}
          />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Practice makes perfect. Start your journey today!
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  heroSection: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  mascotContainer: {
    width: 200,
    height: 160,
    marginBottom: 24,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mascot: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#58CC02',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    position: 'absolute',
  },
  mascotSecondary: {
    backgroundColor: '#1CB0F6',
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  mascotTertiary: {
    backgroundColor: '#CE82FF',
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  mascotEmoji: {
    fontSize: 40,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#3C3C3C',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 18,
    color: '#777777',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 8,
  },
  featureCard: {
    width: (width - 64) / 2,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderBottomWidth: 3,
    borderBottomColor: '#E5E5E5',
  },
  featureIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFF5E6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  featureIcon: {
    fontSize: 28,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3C3C3C',
    marginBottom: 4,
    textAlign: 'center',
  },
  featureText: {
    fontSize: 13,
    color: '#777777',
    textAlign: 'center',
    lineHeight: 18,
  },
  howItWorksSection: {
    paddingHorizontal: 24,
    paddingVertical: 40,
    backgroundColor: 'white',
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#3C3C3C',
    marginBottom: 32,
    textAlign: 'center',
  },
  stepContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    alignItems: 'flex-start',
  },
  stepBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#58CC02',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    shadowColor: '#58CC02',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  stepBadgeBlue: {
    backgroundColor: '#1CB0F6',
    shadowColor: '#1CB0F6',
  },
  stepBadgePurple: {
    backgroundColor: '#CE82FF',
    shadowColor: '#CE82FF',
  },
  stepNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: 'white',
  },
  stepContent: {
    flex: 1,
    paddingTop: 4,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#3C3C3C',
    marginBottom: 4,
  },
  stepText: {
    fontSize: 15,
    color: '#777777',
    lineHeight: 22,
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 24,
    paddingVertical: 40,
    backgroundColor: '#F7F7F7',
  },
  statCard: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '800',
    color: '#58CC02',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#777777',
    textAlign: 'center',
  },
  ctaSection: {
    paddingHorizontal: 24,
    paddingVertical: 40,
    alignItems: 'center',
    backgroundColor: 'white',
  },
  ctaTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#3C3C3C',
    marginBottom: 8,
    textAlign: 'center',
  },
  ctaSubtitle: {
    fontSize: 16,
    color: '#777777',
    marginBottom: 32,
    textAlign: 'center',
  },
  ctaButton: {
    width: width - 48,
    marginBottom: 16,
  },
  signInButton: {
    width: width - 48,
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#AFAFAF',
    textAlign: 'center',
  },
});

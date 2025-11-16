import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  StatusBar,
  Platform,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export const LandingScreen: React.FC = () => {
  const scrollY = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleGetStarted = () => {
    console.log('Get Started pressed');
  };

  const handleSignIn = () => {
    console.log('Sign In pressed');
  };

  const navOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

        {/* Hero Section */}
        <LinearGradient
          colors={['#000000', '#1a1a1a', '#2d2d2d']}
          style={styles.heroSection}
        >
          <Animated.View style={[styles.heroContent, { opacity: fadeAnim }]}>
            <Text style={styles.heroTitle}>
              Master tech interviews.{'\n'}One day at a time.
            </Text>
            <Text style={styles.heroSubtitle}>
              Coaching that adapts to you. Practice like pro,
              ace interviews like a 10x engineer.
            </Text>

            <Text style={styles.finalCTATitle}>Ready to level up?</Text>
          <TouchableOpacity style={styles.finalCTAButton} onPress={handleGetStarted}>
            <Text style={styles.finalCTAButtonText}>Get Started for Free</Text>
          </TouchableOpacity>
          <Text style={styles.finalCTANote}>No credit card required</Text>
          </Animated.View>
        </LinearGradient>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },

  // Hero Section
  heroSection: {
    paddingTop: Platform.OS === 'ios' ? 150 : 100,
    paddingBottom: 150,
    paddingHorizontal: 20,
    minHeight: height * 0.9,
    justifyContent: 'center',
  },
  heroContent: {
    alignItems: 'center',
    marginBottom: 60,
  },
  heroSupertitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#86868b',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: 48,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 52,
    letterSpacing: -1,
  },
  heroSubtitle: {
    fontSize: 19,
    color: '#a1a1a6',
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 40,
    maxWidth: 600,
    letterSpacing: -0.2,
  },
  heroCTAContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  primaryButton: {
    backgroundColor: '#0071e3',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 980,
    shadowColor: '#0071e3',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#ffffff',
    letterSpacing: -0.4,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 980,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  secondaryButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#0071e3',
    letterSpacing: -0.4,
  },

  // Final CTA
  finalCTA: {
    paddingVertical: 150,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  finalCTATitle: {
    fontSize: 48,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 35,
    letterSpacing: -1,
  },
  finalCTASubtitle: {
    fontSize: 21,
    color: '#a1a1a6',
    textAlign: 'center',
    marginBottom: 40,
    letterSpacing: -0.2,
  },
  finalCTAButton: {
    backgroundColor: '#0071e3',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 980,
    marginBottom: 16,
    shadowColor: '#0071e3',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  finalCTAButtonText: {
    fontSize: 19,
    fontWeight: '600',
    color: '#ffffff',
    letterSpacing: -0.4,
  },
  finalCTANote: {
    fontSize: 14,
    color: '#86868b',
  },
});
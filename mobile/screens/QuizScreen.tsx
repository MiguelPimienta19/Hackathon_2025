import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Animated,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { apiService, Question } from '../services/api';
import { statsService } from '../services/stats';

const { height, width } = Dimensions.get('window');

type AnswerOption = 'A' | 'B' | 'C' | 'D';

interface QuizScreenProps {
  onGoBack: () => void;
}

const TOPICS = [
  "Operating Systems & Concurrency",
  "Programming Languages & Software Engineering",
  "Memory, Pointers & Architecture",
  "Data Structures & Algorithms"
] as const;

export const QuizScreen: React.FC<QuizScreenProps> = ({ onGoBack }) => {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<AnswerOption | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [correctAnswer, setCorrectAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [progressAnim] = useState(new Animated.Value(0));
  const [scaleAnims] = useState({
    A: new Animated.Value(1),
    B: new Animated.Value(1),
    C: new Animated.Value(1),
    D: new Animated.Value(1),
  });
  const [statsUpdated, setStatsUpdated] = useState(false);

  useEffect(() => {
    if (questions.length > 0) {
      // Animate progress bar
      Animated.timing(progressAnim, {
        toValue: ((currentIndex + 1) / questions.length) * 100,
        duration: 500,
        useNativeDriver: false,
      }).start();
    }
  }, [currentIndex, questions.length]);

  // Update stats when quiz is completed
  useEffect(() => {
    if (
      questions.length > 0 &&
      currentIndex === questions.length - 1 &&
      submitted &&
      !statsUpdated
    ) {
      // Quiz is complete, update stats
      statsService.completeQuiz(score, questions.length).then(() => {
        setStatsUpdated(true);
        console.log('[Stats] Quiz completion recorded');
      });
    }
  }, [currentIndex, submitted, questions.length, score, statsUpdated]);

  const loadQuestions = async (topic: string) => {
    try {
      setLoading(true);
      setStatsUpdated(false); // Reset stats flag for new quiz
      const data = await apiService.getQuestions({
        topic,
        limit: 10,
        randomize: true
      });
      setQuestions(data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load questions:', error);
      setLoading(false);
    }
  };

  const handleTopicSelect = (topic: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedTopic(topic);
    loadQuestions(topic);
  };

  const handleSelectAnswer = (option: AnswerOption) => {
    if (!submitted) {
      // Haptic feedback
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      setSelectedAnswer(option);
      // Animate button press
      Animated.sequence([
        Animated.timing(scaleAnims[option], {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnims[option], {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  const handleSubmit = async () => {
    if (!selectedAnswer) return;

    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const currentQuestion = questions[currentIndex];
      const result = await apiService.checkAnswer(currentQuestion.id, selectedAnswer);

      setSubmitted(true);
      setIsCorrect(result.correct);

      if (result.correct) {
        setScore(score + 1);
      } else {
        setCorrectAnswer(result.correct_option || null);
      }
    } catch (error) {
      console.error('Failed to check answer:', error);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      // Haptic feedback
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setSubmitted(false);
      setIsCorrect(null);
      setCorrectAnswer(null);
      // Reset all scale animations
      Object.values(scaleAnims).forEach((anim) => anim.setValue(1));
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    const lower = difficulty?.toLowerCase();
    if (lower === 'easy') return '#34C759';
    if (lower === 'medium') return '#FFD60A';
    if (lower === 'hard') return '#FF3B30';
    return '#8E8E93';
  };

  // Topic Selection Screen
  if (!selectedTopic) {
    return (
      <View style={[styles.container, { backgroundColor: '#000000' }]}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.topicSelectionContainer}>
            <TouchableOpacity onPress={onGoBack} style={styles.backButton}>
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>

            <Text style={styles.topicTitle}>Choose a Topic</Text>
            <Text style={styles.topicSubtitle}>Select one to start your quiz</Text>

            <View style={styles.topicGrid}>
              {TOPICS.map((topic, index) => {
                const iconName =
                  index === 0 ? 'cog' :
                  index === 1 ? 'laptop' :
                  index === 2 ? 'brain' :
                  'chart-bar';

                const borderColor =
                  index === 0 ? '#8E2DE2' :
                  index === 1 ? '#00D4FF' :
                  index === 2 ? '#FF6B6B' :
                  '#58CC02';

                const iconColor =
                  index === 0 ? '#8E2DE2' :
                  index === 1 ? '#00D4FF' :
                  index === 2 ? '#FF6B6B' :
                  '#58CC02';

                return (
                  <TouchableOpacity
                    key={topic}
                    style={[styles.topicCard, { borderColor }]}
                    onPress={() => handleTopicSelect(topic)}
                    activeOpacity={0.8}
                  >
                    <MaterialCommunityIcons
                      name={iconName}
                      size={36}
                      color={iconColor}
                      style={styles.topicIcon}
                    />
                    <Text style={styles.topicText}>{topic}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: '#000000' }]}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <View style={styles.loadingCard}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingText}>Loading questions...</Text>
              <Text style={styles.loadingHint}>Preparing your quiz</Text>
            </View>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (questions.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: '#000000' }]}>
        <BlurView intensity={80} tint="dark" style={styles.errorContainer}>
          <Text style={styles.errorText}>No questions found</Text>
          <Text style={styles.errorHint}>Make sure backend is running on http://localhost:8000</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => selectedTopic && loadQuestions(selectedTopic)}>
            <LinearGradient colors={['#00D4FF', '#0099CC']} style={styles.gradientButton}>
              <Text style={styles.retryText}>Retry</Text>
            </LinearGradient>
          </TouchableOpacity>
        </BlurView>
      </View>
    );
  }

  const question = questions[currentIndex];
  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[styles.container, { backgroundColor: '#000000' }]}>
      <SafeAreaView style={styles.safeArea}>
        {/* Top Bar with Progress */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={onGoBack} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBackground}>
              <Animated.View
                style={[
                  styles.progressBarFill,
                  { width: progressWidth }
                ]}
              />
            </View>
          </View>
          <View style={styles.scoreContainer}>
            <Text style={styles.scoreText}>{score}</Text>
          </View>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Question Number */}
          <Text style={styles.questionNumber}>
            {currentIndex + 1} / {questions.length}
          </Text>

          {/* Question Card */}
          <View style={styles.questionCard}>
            {question.difficulty && (
              <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(question.difficulty) }]}>
                <Text style={styles.difficultyText}>{question.difficulty.toUpperCase()}</Text>
              </View>
            )}
            <Text style={styles.questionText}>{question.question_text}</Text>
          </View>

          {/* Answer Options */}
          <View style={styles.optionsContainer}>
            {(['A', 'B', 'C', 'D'] as AnswerOption[]).map((option) => {
              const optionText = question[`option_${option.toLowerCase()}` as keyof Question] as string;

              const isSelected = selectedAnswer === option && !submitted;
              const isCorrectAnswer = submitted && isCorrect && selectedAnswer === option;
              const isWrongAnswer = submitted && !isCorrect && selectedAnswer === option;
              const showCorrect = submitted && correctAnswer === option;

              let optionStyle = styles.optionButtonDefault;
              let labelStyle = styles.optionLabelDefault;

              if (isCorrectAnswer || showCorrect) {
                optionStyle = styles.optionButtonCorrect;
                labelStyle = styles.optionLabelCorrect;
              } else if (isWrongAnswer) {
                optionStyle = styles.optionButtonWrong;
                labelStyle = styles.optionLabelWrong;
              } else if (isSelected) {
                optionStyle = styles.optionButtonSelected;
                labelStyle = styles.optionLabelSelected;
              }

              return (
                <Animated.View
                  key={option}
                  style={{ transform: [{ scale: scaleAnims[option] }] }}
                >
                  <TouchableOpacity
                    onPress={() => handleSelectAnswer(option)}
                    disabled={submitted}
                    style={styles.optionWrapper}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.optionButton, optionStyle]}>
                      <View style={[styles.optionLabelContainer, labelStyle]}>
                        <Text style={styles.optionLabel}>{option}</Text>
                      </View>
                      <Text style={styles.optionText}>{optionText}</Text>
                      {(isCorrectAnswer || showCorrect) && (
                        <Text style={styles.checkmark}>✓</Text>
                      )}
                      {isWrongAnswer && (
                        <Text style={styles.crossmark}>✗</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>

          {/* Submit Button or Next/Final Score */}
          {!submitted ? (
            <TouchableOpacity
              style={styles.submitButtonWrapper}
              onPress={handleSubmit}
              disabled={!selectedAnswer}
              activeOpacity={0.8}
            >
              <View style={[
                styles.submitButton,
                !selectedAnswer && styles.submitButtonDisabled
              ]}>
                <Text style={[
                  styles.submitText,
                  !selectedAnswer && styles.submitTextDisabled
                ]}>
                  Check Answer
                </Text>
              </View>
            </TouchableOpacity>
          ) : currentIndex < questions.length - 1 ? (
            <TouchableOpacity
              style={styles.nextButtonWrapper}
              onPress={handleNext}
              activeOpacity={0.8}
            >
              <View style={styles.nextButton}>
                <Text style={styles.nextText}>Continue</Text>
              </View>
            </TouchableOpacity>
          ) : (
            <View style={styles.finalScoreContainer}>
              <MaterialCommunityIcons
                name={
                  score / questions.length >= 0.8 ? 'trophy' :
                  score / questions.length >= 0.6 ? 'hand-clap' :
                  'book-open-variant'
                }
                size={48}
                color={
                  score / questions.length >= 0.8 ? '#FFD700' :
                  score / questions.length >= 0.6 ? '#FFA500' :
                  '#8E2DE2'
                }
                style={styles.finalScoreIcon}
              />
              <Text style={styles.finalScoreTitle}>Quiz Complete!</Text>
              <Text style={styles.finalScoreText}>
                You got {score} out of {questions.length} correct
              </Text>
              <View style={styles.percentageContainer}>
                <Text style={styles.percentageText}>
                  {Math.round((score / questions.length) * 100)}%
                </Text>
              </View>
              <TouchableOpacity
                style={styles.doneButton}
                onPress={onGoBack}
                activeOpacity={0.8}
              >
                <Text style={styles.doneButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  // Main Container
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  safeArea: {
    flex: 1,
    width: '100%',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingBottom: 24,
  },

  // Top Bar with Progress
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: '#ffffff',
    fontWeight: '600',
  },
  progressBarContainer: {
    flex: 1,
  },
  progressBarBackground: {
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 6,
  },
  scoreContainer: {
    width: 50,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
  },

  // Loading State
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingCard: {
    backgroundColor: '#1c1c1e',
    borderRadius: 24,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 18,
    color: '#ffffff',
    fontWeight: '700',
    textAlign: 'center',
  },
  loadingHint: {
    marginTop: 8,
    fontSize: 14,
    color: '#a1a1a6',
    fontWeight: '600',
    textAlign: 'center',
  },

  // Error State
  errorContainer: {
    margin: 20,
    padding: 32,
    borderRadius: 24,
    overflow: 'hidden',
  },
  errorText: {
    fontSize: 20,
    color: '#FF6B6B',
    marginBottom: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  errorHint: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  gradientButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },

  // Question Number
  questionNumber: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 12,
    letterSpacing: 0.5,
  },

  // Question Card
  questionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  difficultyBadge: {
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 12,
  },
  difficultyText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 1,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    lineHeight: 26,
    textAlign: 'center',
  },

  // Options
  optionsContainer: {
    marginBottom: 12,
    gap: 10,
  },
  optionWrapper: {
    marginBottom: 0,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 2.5,
    borderColor: 'transparent',
  },
  optionButtonDefault: {
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  optionButtonSelected: {
    borderColor: '#FFD700',
    backgroundColor: '#FFFBF0',
  },
  optionButtonCorrect: {
    borderColor: '#58CC02',
    backgroundColor: '#F0FFF4',
  },
  optionButtonWrong: {
    borderColor: '#FF4B4B',
    backgroundColor: '#FFF5F5',
  },
  optionLabelContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionLabelDefault: {
    backgroundColor: 'rgba(138, 43, 226, 0.1)',
  },
  optionLabelSelected: {
    backgroundColor: '#FFD700',
  },
  optionLabelCorrect: {
    backgroundColor: '#58CC02',
  },
  optionLabelWrong: {
    backgroundColor: '#FF4B4B',
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
  },
  optionText: {
    fontSize: 15,
    color: '#1a1a1a',
    flex: 1,
    fontWeight: '600',
    lineHeight: 22,
  },
  checkmark: {
    fontSize: 22,
    color: '#58CC02',
    fontWeight: '900',
    marginLeft: 6,
  },
  crossmark: {
    fontSize: 22,
    color: '#FF4B4B',
    fontWeight: '900',
    marginLeft: 6,
  },

  // Submit Button
  submitButtonWrapper: {
    marginTop: 8,
  },
  submitButton: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#58CC02',
    shadowColor: '#58CC02',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    shadowOpacity: 0,
  },
  submitText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  submitTextDisabled: {
    color: 'rgba(255, 255, 255, 0.6)',
  },

  // Next Button
  nextButtonWrapper: {
    marginTop: 8,
  },
  nextButton: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  nextText: {
    color: '#8E2DE2',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  // Final Score
  finalScoreContainer: {
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    backgroundColor: '#1c1c1e',
    marginTop: 12,
    borderWidth: 2,
    borderColor: '#2c2c2e',
  },
  finalScoreIcon: {
    marginBottom: 12,
  },
  finalScoreTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  finalScoreText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#a1a1a6',
    marginBottom: 20,
    textAlign: 'center',
  },
  percentageContainer: {
    backgroundColor: '#2c2c2e',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 16,
    marginBottom: 20,
  },
  percentageText: {
    fontSize: 48,
    fontWeight: '900',
    color: '#58CC02',
    letterSpacing: -2,
  },
  doneButton: {
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 14,
    backgroundColor: '#007AFF',
    minWidth: 180,
  },
  doneButtonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.5,
  },

  // Topic Selection
  topicSelectionContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
  },
  topicTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: -1,
  },
  topicSubtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: '600',
  },
  topicGrid: {
    gap: 20,
  },
  topicCard: {
    backgroundColor: '#1c1c1e',
    padding: 24,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  topicIcon: {
    marginBottom: 12,
  },
  topicText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 24,
  },
});

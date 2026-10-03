import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiService, EvaluateAnswerResponse, DeepQuestion } from '../services/api';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { statsService } from '../services/stats';

// Portfolio web demo: live voice capture (expo-av recording -> Whisper ->
// Gemini -> ElevenLabs) cannot run in a static browser build, so the voice
// flow plays a pre-scripted example answer instead. The screens, grading UI,
// and interaction shape are the real app's; the spoken content is canned and
// clearly labeled as such.

interface InterviewScreenProps {
  onGoBack: () => void;
}

const TOPICS = [
  "Data Structures & Complexity (Conceptual)",
  "System Design, Backend & Data",
  "Programming Language & Debugging"
] as const;

export const InterviewScreen: React.FC<InterviewScreenProps> = ({ onGoBack }) => {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [questions, setQuestions] = useState<DeepQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [evaluation, setEvaluation] = useState<EvaluateAnswerResponse | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isRecording, setIsRecording] = useState(false); // demo: example answer is being "transcribed"
  const typingTimerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const [questionScores, setQuestionScores] = useState<number[]>([]);
  const [statsUpdated, setStatsUpdated] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];

  const loadQuestions = async (topic: string) => {
    try {
      setLoading(true);
      const data = await apiService.getDeepQuestions({
        topic,
        limit: 5,
      });
      setQuestions(data);
      setQuestionScores([]);
      setStatsUpdated(false);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load deep questions:', error);
      setLoading(false);
    }
  };

  const handleTopicSelect = async (topic: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedTopic(topic);
    await loadQuestions(topic);
  };
  const clearTypingTimer = () => {
    if (typingTimerRef.current) {
      clearInterval(typingTimerRef.current);
      typingTimerRef.current = null;
    }
  };

  // Demo feedback voice uses the browser's built-in speech synthesis (offline);
  // the live app plays ElevenLabs TTS audio returned by the backend.
  const canSpeak =
    typeof window !== 'undefined' && 'speechSynthesis' in window;

  const stopSpeech = () => {
    if (canSpeak) {
      (window as any).speechSynthesis.cancel();
    }
    setIsPlayingAudio(false);
  };

  // Cleanup timers/speech on unmount
  React.useEffect(() => {
    return () => {
      clearTypingTimer();
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        (window as any).speechSynthesis.cancel();
      }
    };
  }, []);

  // Track interview completion and update stats
  useEffect(() => {
    if (
      questions.length > 0 &&
      questionScores.length === questions.length &&
      !statsUpdated
    ) {
      // All questions answered - calculate average score and update stats
      const averageScore = questionScores.reduce((sum, score) => sum + score, 0) / questionScores.length;

      statsService.completeInterview(averageScore).then(() => {
        setStatsUpdated(true);
        console.log('[Stats] Interview completion recorded with average score:', averageScore);
      });
    }
  }, [questionScores, questions.length, statsUpdated]);

  const submitAnswer = async (answerText: string) => {
    setIsSubmitting(true);
    try {
      const result = await apiService.evaluateAnswer({
        question: currentQuestion.prompt,
        user_answer: answerText,
        ideal_answer: currentQuestion.rubric_points.join('\n• '),
      });

      setEvaluation(result);
      setQuestionScores(prev => [...prev, result.score]);
    } catch (error) {
      console.error('Evaluation error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Demo flow: "recording" types out the pre-scripted example answer a few
  // words at a time (where the live app streams mic audio to Whisper), then
  // submits it for the canned evaluation.
  const startListening = () => {
    if (isRecording || isSubmitting || evaluation || !currentQuestion) return;

    setIsRecording(true);
    setUserAnswer('');

    const answer = currentQuestion.demo_answer;
    const words = answer.split(' ');
    let index = 0;

    typingTimerRef.current = setInterval(() => {
      index += 3;
      setUserAnswer(words.slice(0, index).join(' '));
      if (index >= words.length) {
        clearTypingTimer();
        setIsRecording(false);
        submitAnswer(answer);
      }
    }, 90);
  };

  const stopRecording = () => {
    // "Skip ahead": complete the scripted answer and submit immediately
    clearTypingTimer();
    setIsRecording(false);
    if (currentQuestion) {
      setUserAnswer(currentQuestion.demo_answer);
      submitAnswer(currentQuestion.demo_answer);
    }
  };

  const playFeedbackAudio = () => {
    if (!evaluation || !canSpeak) return;

    stopSpeech();
    const utterance = new (window as any).SpeechSynthesisUtterance(evaluation.feedback);
    utterance.rate = 1.05;
    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);
    setIsPlayingAudio(true);
    (window as any).speechSynthesis.speak(utterance);
  };

  const handleNextQuestion = () => {
    stopSpeech();
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setUserAnswer('');
      setEvaluation(null);
    } else {
      // Interview complete (stats already recorded by the effect above)
      onGoBack();
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 4) return '#34C759';
    if (score >= 3) return '#FFD60A';
    return '#FF3B30';
  };

  const getTopicIcon = (topic: string) => {
    if (topic.includes('Data Structures')) return 'file-tree';
    if (topic.includes('System Design')) return 'server-network';
    if (topic.includes('Programming Language')) return 'code-braces';
    return 'help-circle';
  };

  const getTopicColor = (index: number) => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1'];
    return colors[index % colors.length];
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
            <TouchableOpacity onPress={onGoBack} style={styles.topicBackButton}>
              <Text style={styles.backButton}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.topicTitle}>Choose a Topic</Text>
            <Text style={styles.topicSubtitle}>Deep Dive Interview Practice</Text>
            <View style={styles.topicGrid}>
              {TOPICS.map((topic, index) => {
                const iconName = getTopicIcon(topic);
                const borderColor = getTopicColor(index);
                return (
                  <TouchableOpacity
                    key={topic}
                    style={[styles.topicCard, { borderColor }]}
                    onPress={() => handleTopicSelect(topic)}
                  >
                    <MaterialCommunityIcons name={iconName as any} size={36} color={borderColor} />
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

  // Loading Screen
  if (loading) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading questions...</Text>
        </SafeAreaView>
      </View>
    );
  }

  // Interview Screen
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              stopSpeech();
              clearTypingTimer();
              onGoBack();
            }}
          >
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.questionCounter}>
            Question {currentQuestionIndex + 1} / {questions.length}
          </Text>
        </View>

        <View style={styles.questionCard}>
          <Text style={styles.questionLabel}>Interview Question</Text>
          {currentQuestion?.difficulty && (
            <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(currentQuestion.difficulty) }]}>
              <Text style={styles.difficultyText}>{currentQuestion.difficulty.toUpperCase()}</Text>
            </View>
          )}
          <Text style={styles.questionText}>{currentQuestion?.prompt}</Text>
        </View>

        {!evaluation ? (
          <>
            {/* Primary Start Button - only show when not recording and not submitting */}
            {!isRecording && !isSubmitting && (
              <View style={styles.startPrompt}>
                <Text style={styles.startPromptIcon}>🎤</Text>
                <Text style={styles.startPromptTitle}>Voice Interview Mode</Text>
                <Text style={styles.startPromptText}>
                  In the live app you speak your answer and it's transcribed with
                  Whisper, graded by Gemini, and read back with ElevenLabs.
                  Microphones can't run in this web demo, so tap below to watch a
                  pre-scripted example answer go through the same flow.
                </Text>
                <TouchableOpacity style={styles.startButton} onPress={startListening}>
                  <Text style={styles.startButtonText}>▶️ Play Example Answer</Text>
                </TouchableOpacity>
                <Text style={styles.demoNote}>
                  Canned demo — not live AI
                </Text>
              </View>
            )}

            {/* Voice Listening Indicator */}
            {isRecording && (
              <View style={styles.listeningBanner}>
                <View style={styles.listeningHeader}>
                  <View style={styles.listeningPulse} />
                  <Text style={styles.listeningText}>🎤 Transcribing example answer…</Text>
                  <TouchableOpacity
                    style={styles.stopListeningButton}
                    onPress={stopRecording}
                  >
                    <Text style={styles.stopListeningText}>Skip</Text>
                  </TouchableOpacity>
                </View>
                {userAnswer ? (
                  <Text style={styles.liveTranscript}>{userAnswer}</Text>
                ) : null}
              </View>
            )}

            {isSubmitting && (
              <View style={styles.processingCard}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.processingText}>
                  Grading the example answer...
                </Text>
              </View>
            )}
          </>
        ) : (
          <View style={styles.evaluationSection}>
            <View style={styles.scoreCard}>
              <Text style={styles.scoreLabel}>Your Score</Text>
              <Text style={[styles.scoreValue, { color: getScoreColor(evaluation.score) }]}>
                {evaluation.score}/5
              </Text>
            </View>

            {/* Show what was transcribed */}
            <View style={styles.transcriptionCard}>
              <Text style={styles.transcriptionLabel}>📝 Example Answer (pre-scripted)</Text>
              <Text style={styles.transcriptionText}>
                {userAnswer || '(No transcription available)'}
              </Text>
            </View>

            <View style={styles.feedbackCard}>
              <Text style={styles.feedbackLabel}>AI Feedback (canned demo)</Text>
              <Text style={styles.feedbackText}>{evaluation.feedback}</Text>
            </View>

            {evaluation.strengths.length > 0 && (
              <View style={styles.listCard}>
                <Text style={styles.listLabel}>✓ Strengths</Text>
                {evaluation.strengths.map((strength, index) => (
                  <Text key={index} style={styles.listItem}>• {strength}</Text>
                ))}
              </View>
            )}

            {evaluation.improvements.length > 0 && (
              <View style={styles.listCard}>
                <Text style={styles.listLabel}>→ Areas to Improve</Text>
                {evaluation.improvements.map((improvement, index) => (
                  <Text key={index} style={styles.listItem}>• {improvement}</Text>
                ))}
              </View>
            )}

            {canSpeak && (
              <TouchableOpacity
                style={styles.audioButton}
                onPress={playFeedbackAudio}
                disabled={isPlayingAudio}
              >
                <Text style={styles.audioButtonText}>
                  {isPlayingAudio ? '🔊 Playing...' : '🔊 Listen to Feedback (browser voice)'}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.nextButton} onPress={handleNextQuestion}>
              <Text style={styles.nextButtonText}>
                {currentQuestionIndex < questions.length - 1
                  ? 'Next Question'
                  : 'Finish Practice'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  safeArea: {
    flex: 1,
    padding: 20,
  },
  topicSelectionContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  topicBackButton: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 1,
  },
  topicTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
  },
  topicSubtitle: {
    fontSize: 16,
    color: '#a1a1a6',
    textAlign: 'center',
    marginBottom: 40,
  },
  topicGrid: {
    gap: 16,
  },
  topicCard: {
    backgroundColor: '#1c1c1e',
    padding: 24,
    borderRadius: 16,
    borderWidth: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  topicText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    flex: 1,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  questionCounter: {
    fontSize: 14,
    color: '#a1a1a6',
    fontWeight: '600',
  },
  questionCard: {
    backgroundColor: '#1c1c1e',
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
  },
  questionLabel: {
    fontSize: 12,
    color: '#a1a1a6',
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  difficultyBadge: {
    alignSelf: 'flex-start',
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
    fontSize: 20,
    color: '#ffffff',
    fontWeight: '600',
    lineHeight: 28,
  },
  startPrompt: {
    backgroundColor: '#1c1c1e',
    padding: 24,
    borderRadius: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  startPromptIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  startPromptTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  startPromptText: {
    color: '#a1a1a6',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  startButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 12,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  startButtonText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#ffffff',
  },
  answerSection: {
    marginBottom: 20,
  },
  answerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  answerLabel: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
  },
  voiceButton: {
    backgroundColor: '#2c2c2e',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  voiceButtonActive: {
    backgroundColor: '#FF3B30',
  },
  voiceButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  recordingIndicator: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#2c2c2e',
    borderRadius: 8,
    alignItems: 'center',
  },
  recordingText: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '600',
  },
  answerInput: {
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#ffffff',
    minHeight: 200,
    borderWidth: 1,
    borderColor: '#2c2c2e',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#2c2c2e',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  evaluationSection: {
    gap: 16,
  },
  scoreCard: {
    backgroundColor: '#1c1c1e',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 14,
    color: '#a1a1a6',
    fontWeight: '600',
    marginBottom: 8,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: '800',
  },
  transcriptionCard: {
    backgroundColor: '#1c1c1e',
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  transcriptionLabel: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '700',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  transcriptionText: {
    fontSize: 16,
    color: '#ffffff',
    lineHeight: 24,
    fontStyle: 'italic',
  },
  feedbackCard: {
    backgroundColor: '#1c1c1e',
    padding: 20,
    borderRadius: 16,
  },
  feedbackLabel: {
    fontSize: 14,
    color: '#a1a1a6',
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  feedbackText: {
    fontSize: 16,
    color: '#ffffff',
    lineHeight: 24,
  },
  listCard: {
    backgroundColor: '#1c1c1e',
    padding: 20,
    borderRadius: 16,
  },
  listLabel: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '700',
    marginBottom: 12,
  },
  listItem: {
    fontSize: 15,
    color: '#a1a1a6',
    lineHeight: 22,
    marginBottom: 6,
  },
  audioButton: {
    backgroundColor: '#FFD60A',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  audioButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
  nextButton: {
    backgroundColor: '#34C759',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  listeningBanner: {
    backgroundColor: '#1c1c1e',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#FF3B30',
  },
  listeningPulse: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FF3B30',
    marginRight: 12,
  },
  listeningText: {
    fontSize: 17,
    color: '#ffffff',
    fontWeight: '600',
    flex: 1,
  },
  stopListeningButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  stopListeningText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  processingCard: {
    backgroundColor: '#1c1c1e',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  processingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#ffffff',
  },
  listeningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveTranscript: {
    marginTop: 14,
    fontSize: 15,
    lineHeight: 22,
    color: '#d1d1d6',
    fontStyle: 'italic',
  },
  demoNote: {
    marginTop: 12,
    fontSize: 13,
    color: '#8e8e93',
    textAlign: 'center',
    fontWeight: '600',
  },
});

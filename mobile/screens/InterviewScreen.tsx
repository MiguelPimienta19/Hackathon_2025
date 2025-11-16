import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiService, EvaluateAnswerResponse, API_BASE_URL, DeepQuestion } from '../services/api';
import { Audio } from 'expo-av';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface InterviewScreenProps {
  onGoBack: () => void;
}

const TOPICS = [
  "Data Structures & Complexity (Conceptual)",
  "System Design, Backend & Data",
  "Programming Language & Debugging"
] as const;

const FEEDBACK_PLAYBACK_RATE = 1.15;

export const InterviewScreen: React.FC<InterviewScreenProps> = ({ onGoBack }) => {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [questions, setQuestions] = useState<DeepQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [evaluation, setEvaluation] = useState<EvaluateAnswerResponse | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const silenceTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  const currentQuestion = questions[currentQuestionIndex];

  const loadQuestions = async (topic: string) => {
    try {
      setLoading(true);
      const data = await apiService.getDeepQuestions({
        topic,
        limit: 5,
      });
      setQuestions(data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load deep questions:', error);
      Alert.alert('Error', 'Failed to load questions. Please try again.');
      setLoading(false);
    }
  };

  const handleTopicSelect = async (topic: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedTopic(topic);
    await loadQuestions(topic);
  };
  const stopPlayback = async () => {
    if (sound) {
      try {
        await sound.stopAsync();
      } catch (error) {
        console.log('[Voice] stopAsync failed', error);
      }
      try {
        await sound.unloadAsync();
      } catch (error) {
        console.log('[Voice] unloadAsync failed', error);
      }
      setIsPlayingAudio(false);
      setSound(null);
    }
  };

  // Request audio permissions and auto-start listening on mount
  React.useEffect(() => {
    (async () => {
      const { granted } = await Audio.requestPermissionsAsync();
      if (granted) {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });
        // Permissions granted; user can manually start recording
      }
    })();

    return () => {
      // Cleanup on unmount
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
    };
  }, []);

  const startListening = async () => {
    if (isRecording || isSubmitting || evaluation) return;

    try {
      console.log('[Voice] Auto-starting voice listening...');
      setIsListening(true);

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(newRecording);
      setIsRecording(true);

      // Auto-stop after 30 seconds (safety limit)
      silenceTimerRef.current = setTimeout(() => {
        console.log('[Voice] Auto-stopping after timeout');
        stopRecording();
      }, 30000); // 30 seconds max

    } catch (error) {
      console.error('[Voice] Failed to start listening:', error);
      setIsListening(false);
    }
  };

  const startRecording = async () => {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        Alert.alert('Permission Required', 'Microphone permission is needed to record your answer.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(newRecording);
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    // Clear auto-stop timer
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    try {
      setIsRecording(false);
      setIsListening(false);
      setIsSubmitting(true);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();

      if (uri) {
        try {
          console.log('[Voice] Audio URI:', uri);

          // Send audio file directly using FormData (no deprecated APIs!)
          const formData = new FormData();
          formData.append('file', {
            uri: uri,
            type: 'audio/m4a',
            name: 'recording.m4a',
          } as any);

          console.log('[Voice] Transcribing...');
          const transcribeResponse = await fetch(`${API_BASE_URL}/api/transcribe-file`, {
            method: 'POST',
            body: formData,
          });

          if (!transcribeResponse.ok) {
            const errorText = await transcribeResponse.text();
            console.error('[Voice] Transcription error:', errorText);
            throw new Error('Transcription failed');
          }

          const transcribeData = await transcribeResponse.json();
          const transcription = transcribeData.transcription || '';
          console.log('[Voice] Transcription:', transcription);
          console.log('[Voice] Full transcribe response:', transcribeData);

          // Set user answer FIRST before evaluation
          setUserAnswer(transcription);

          // Automatically submit the answer and get voice feedback
          console.log('[Voice] Getting AI feedback...');
          console.log('[Voice] Sending user_answer to API:', transcription);
          const evaluation = await apiService.evaluateAnswer({
            question: currentQuestion.prompt,
            user_answer: transcription,
            ideal_answer: currentQuestion.rubric_points.join('\n• '),
          });

          console.log('[Voice] Got evaluation, userAnswer state should be:', transcription);
          setEvaluation(evaluation);

          // Automatically play the voice feedback
          await playFeedbackAudioFromBase64(evaluation.audio_base64);

        } catch (error) {
          console.error('[Voice] Error:', error);
          Alert.alert('Error', `Voice conversation failed: ${error}\n\nPlease try typing instead.`);
        } finally {
          setIsSubmitting(false);
        }
      }

      setRecording(null);
    } catch (error) {
      console.error('Failed to stop recording:', error);
      setIsSubmitting(false);
    }
  };

  const playFeedbackAudioFromBase64 = async (audioBase64: string) => {
    try {
      setIsPlayingAudio(true);

      // Set audio mode for playback
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });

      // Unload previous sound if exists
      if (sound) {
        await sound.unloadAsync();
      }

      console.log('[Voice] Playing audio feedback...');

      // Try using data URI directly (works on newer iOS versions)
      const soundUri = `data:audio/mpeg;base64,${audioBase64}`;

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: soundUri },
        { shouldPlay: false },
        (status) => {
          if (status.isLoaded && status.didJustFinish) {
            setIsPlayingAudio(false);
            console.log('[Voice] Audio playback finished');
          }
        }
      );

      setSound(newSound);
      await newSound.setRateAsync(FEEDBACK_PLAYBACK_RATE, true);
      await newSound.playAsync();
      console.log('[Voice] Audio playback started');
    } catch (error) {
      console.error('[Voice] Audio playback error:', error);
      setIsPlayingAudio(false);
      // Don't show alert for audio errors, just log it
    }
  };

  const handleSubmitAnswer = async () => {
    if (!userAnswer.trim()) {
      Alert.alert('Empty Answer', 'Please provide an answer before submitting.');
      return;
    }

    try {
      setIsSubmitting(true);

      const result = await apiService.evaluateAnswer({
        question: currentQuestion.prompt,
        user_answer: userAnswer,
        ideal_answer: currentQuestion.rubric_points.join('\n• '),
      });

      setEvaluation(result);
    } catch (error) {
      Alert.alert('Error', 'Failed to evaluate your answer. Please try again.');
      console.error('Evaluation error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const playFeedbackAudio = async () => {
    if (!evaluation?.audio_base64) {
      Alert.alert('No Audio', 'No audio feedback available.');
      return;
    }

    await playFeedbackAudioFromBase64(evaluation.audio_base64);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setUserAnswer('');
      setEvaluation(null);
      if (sound) {
        sound.unloadAsync();
        setSound(null);
      }
    } else {
      Alert.alert(
        'Practice Complete!',
        'You\'ve completed all interview questions. Great job!',
        [{ text: 'OK', onPress: onGoBack }]
      );
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
            onPress={async () => {
              await stopPlayback();
              if (isRecording) {
                await stopRecording();
              }
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
                  Tap the button below to start recording your answer. You'll have up to 30 seconds to speak.
                </Text>
                <TouchableOpacity style={styles.startButton} onPress={startListening}>
                  <Text style={styles.startButtonText}>🎙️ Start Recording</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Voice Listening Indicator */}
            {isRecording && (
              <View style={styles.listeningBanner}>
                <View style={styles.listeningPulse} />
                <Text style={styles.listeningText}>🎤 Listening... Speak your answer</Text>
                <TouchableOpacity
                  style={styles.stopListeningButton}
                  onPress={stopRecording}
                >
                  <Text style={styles.stopListeningText}>Stop & Submit</Text>
                </TouchableOpacity>
              </View>
            )}

            {isSubmitting && (
              <View style={styles.processingCard}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.processingText}>
                  Processing your answer...
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
              <Text style={styles.transcriptionLabel}>📝 What You Said</Text>
              <Text style={styles.transcriptionText}>
                {userAnswer || '(No transcription available)'}
              </Text>
            </View>

            <View style={styles.feedbackCard}>
              <Text style={styles.feedbackLabel}>AI Feedback</Text>
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

            <TouchableOpacity
              style={styles.audioButton}
              onPress={playFeedbackAudio}
              disabled={isPlayingAudio}
            >
              <Text style={styles.audioButtonText}>
                {isPlayingAudio ? '🔊 Playing...' : '🔊 Listen to Feedback'}
              </Text>
            </TouchableOpacity>

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
});

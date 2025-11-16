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
import { apiService, EvaluateAnswerResponse, API_BASE_URL } from '../services/api';
import { Audio } from 'expo-av';

interface InterviewScreenProps {
  onGoBack: () => void;
}

// Sample interview questions
const INTERVIEW_QUESTIONS = [
  {
    question: 'Explain how a hash table works and its time complexity.',
    ideal_answer: 'A hash table uses a hash function to compute an index into an array of buckets. It handles collisions using chaining or open addressing. Average time complexity is O(1) for insert, delete, and lookup operations.',
  },
  {
    question: 'What is the difference between a process and a thread?',
    ideal_answer: 'A process is an independent program with its own memory space, while a thread is a unit of execution within a process that shares memory with other threads. Threads are lighter weight and have faster context switching.',
  },
  {
    question: 'Explain the concept of closures in JavaScript.',
    ideal_answer: 'A closure is a function that has access to variables in its outer scope, even after the outer function has returned. It allows functions to maintain state and create private variables.',
  },
  {
    question: 'What are the differences between SQL and NoSQL databases?',
    ideal_answer: 'SQL databases are relational, use structured schemas, and support ACID transactions. NoSQL databases are non-relational, schema-flexible, and designed for horizontal scaling. SQL is best for complex queries, NoSQL for high-volume simple queries.',
  },
  {
    question: 'Explain how REST APIs work and what makes them RESTful.',
    ideal_answer: 'REST APIs use HTTP methods (GET, POST, PUT, DELETE) to perform CRUD operations on resources. RESTful principles include statelessness, client-server separation, cacheability, and a uniform interface with resource-based URLs.',
  },
];

const FEEDBACK_PLAYBACK_RATE = 1.15;

export const InterviewScreen: React.FC<InterviewScreenProps> = ({ onGoBack }) => {
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

  const currentQuestion = INTERVIEW_QUESTIONS[currentQuestionIndex];
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

          const { transcription } = await transcribeResponse.json();
          console.log('[Voice] Transcription:', transcription);
          setUserAnswer(transcription);

          // Automatically submit the answer and get voice feedback
          console.log('[Voice] Getting AI feedback...');
          const evaluation = await apiService.evaluateAnswer({
            question: currentQuestion.question,
            user_answer: transcription,
            ideal_answer: currentQuestion.ideal_answer,
          });

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
        question: currentQuestion.question,
        user_answer: userAnswer,
        ideal_answer: currentQuestion.ideal_answer,
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
    if (currentQuestionIndex < INTERVIEW_QUESTIONS.length - 1) {
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
            Question {currentQuestionIndex + 1} / {INTERVIEW_QUESTIONS.length}
          </Text>
        </View>

        <View style={styles.questionCard}>
          <Text style={styles.questionLabel}>Interview Question</Text>
          <Text style={styles.questionText}>{currentQuestion.question}</Text>
        </View>

        {!isRecording && !isSubmitting && !evaluation && (
          <View style={styles.startPrompt}>
            <Text style={styles.startPromptText}>
              Read the question carefully, then tap below when you're ready to answer.
            </Text>
            <TouchableOpacity style={styles.startButton} onPress={startListening}>
              <Text style={styles.startButtonText}>Start Answering</Text>
            </TouchableOpacity>
          </View>
        )}

        {!evaluation ? (
          <>
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

            {/* Voice-only mode - no text box */}
            {!isRecording && !isSubmitting && (
              <View style={styles.voiceOnlyPrompt}>
                <Text style={styles.voiceOnlyText}>
                  🎤 Voice Interview Mode
                </Text>
                <Text style={styles.voiceOnlySubtext}>
                  Speak your answer naturally. Tap "Stop & Submit" when you're done.
                </Text>
                <TouchableOpacity
                  style={styles.restartButton}
                  onPress={startListening}
                >
                  <Text style={styles.restartButtonText}>🔄 Start Over</Text>
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
                {currentQuestionIndex < INTERVIEW_QUESTIONS.length - 1
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
  questionText: {
    fontSize: 20,
    color: '#ffffff',
    fontWeight: '600',
    lineHeight: 28,
  },
  startPrompt: {
    backgroundColor: '#1c1c1e',
    padding: 18,
    borderRadius: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  startPromptText: {
    color: '#a1a1a6',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
  },
  startButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 12,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '700',
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
    backgroundColor: '#FF3B30',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  listeningPulse: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ffffff',
    marginRight: 8,
  },
  listeningText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '700',
    flex: 1,
  },
  stopListeningButton: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  stopListeningText: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '700',
  },
  voiceOnlyPrompt: {
    backgroundColor: '#1c1c1e',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  voiceOnlyText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  voiceOnlySubtext: {
    fontSize: 14,
    color: '#a1a1a6',
    textAlign: 'center',
    marginBottom: 12,
  },
  restartButton: {
    backgroundColor: '#FFD60A',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  restartButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
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

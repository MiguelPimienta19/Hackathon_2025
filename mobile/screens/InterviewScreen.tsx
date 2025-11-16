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
import { apiService, EvaluateAnswerResponse } from '../services/api';
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

export const InterviewScreen: React.FC<InterviewScreenProps> = ({ onGoBack }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [evaluation, setEvaluation] = useState<EvaluateAnswerResponse | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const currentQuestion = INTERVIEW_QUESTIONS[currentQuestionIndex];

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
    if (!evaluation?.audio_base64) return;

    try {
      setIsPlayingAudio(true);

      // Unload previous sound if exists
      if (sound) {
        await sound.unloadAsync();
      }

      // Convert base64 to audio and play
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: `data:audio/mp3;base64,${evaluation.audio_base64}` },
        { shouldPlay: true }
      );

      setSound(newSound);

      // Set up playback status update
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlayingAudio(false);
        }
      });
    } catch (error) {
      console.error('Error playing audio:', error);
      Alert.alert('Audio Error', 'Failed to play feedback audio.');
      setIsPlayingAudio(false);
    }
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
          <TouchableOpacity onPress={onGoBack}>
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

        {!evaluation ? (
          <>
            <View style={styles.answerSection}>
              <Text style={styles.answerLabel}>Your Answer</Text>
              <TextInput
                style={styles.answerInput}
                multiline
                numberOfLines={10}
                value={userAnswer}
                onChangeText={setUserAnswer}
                placeholder="Type your answer here..."
                placeholderTextColor="#666"
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleSubmitAnswer}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.submitButtonText}>Submit Answer</Text>
              )}
            </TouchableOpacity>
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
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
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
});

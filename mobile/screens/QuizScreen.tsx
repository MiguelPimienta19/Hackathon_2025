import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiService, Question } from '../services/api';

type AnswerOption = 'A' | 'B' | 'C' | 'D';

interface QuizScreenProps {
  onGoBack: () => void;
}

export const QuizScreen: React.FC<QuizScreenProps> = ({ onGoBack }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedAnswer, setSelectedAnswer] = useState<AnswerOption | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [correctAnswer, setCorrectAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(0);

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const data = await apiService.getQuestions({ limit: 10 });
      setQuestions(data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load questions:', error);
      setLoading(false);
    }
  };

  const handleSelectAnswer = (option: AnswerOption) => {
    if (!submitted) {
      setSelectedAnswer(option);
    }
  };

  const handleSubmit = async () => {
    if (!selectedAnswer) return;

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
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setSubmitted(false);
      setIsCorrect(null);
      setCorrectAnswer(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading questions...</Text>
      </View>
    );
  }

  if (questions.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No questions found</Text>
        <Text style={styles.errorHint}>Make sure backend is running on http://localhost:8000</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadQuestions}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const question = questions[currentIndex];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onGoBack}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerText}>
            Question {currentIndex + 1} / {questions.length}
          </Text>
          <Text style={styles.scoreText}>Score: {score}</Text>
        </View>

        <View style={styles.badge}>
          <Text style={styles.badgeText}>{question.difficulty}</Text>
        </View>

        <Text style={styles.questionText}>{question.question_text}</Text>

        <View style={styles.optionsContainer}>
          {(['A', 'B', 'C', 'D'] as AnswerOption[]).map((option) => {
            const optionText = question[`option_${option.toLowerCase()}` as keyof Question] as string;

            const isSelected = selectedAnswer === option && !submitted;
            const isCorrectAnswer = isCorrect && selectedAnswer === option;
            const isWrongAnswer = !isCorrect && selectedAnswer === option;
            const showCorrect = correctAnswer === option;

            return (
              <TouchableOpacity
                key={option}
                style={[
                  styles.optionButton,
                  isSelected && styles.selectedOption,
                  isCorrectAnswer && styles.correctOption,
                  isWrongAnswer && styles.wrongOption,
                  showCorrect && styles.correctOption,
                ]}
                onPress={() => handleSelectAnswer(option)}
                disabled={submitted}
              >
                <Text style={styles.optionLabel}>{option}</Text>
                <Text style={[
                  styles.optionText,
                  (isSelected || isCorrectAnswer || isWrongAnswer || showCorrect) && styles.selectedText,
                ]}>{optionText}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {!submitted && (
          <TouchableOpacity
            style={[styles.submitButton, !selectedAnswer && styles.disabledButton]}
            onPress={handleSubmit}
            disabled={!selectedAnswer}
          >
            <Text style={styles.submitText}>Submit Answer</Text>
          </TouchableOpacity>
        )}

        {submitted && (
          <View>
            <View style={[styles.resultBox, isCorrect ? styles.correctBox : styles.wrongBox]}>
              <Text style={styles.resultText}>
                {isCorrect ? '✓ Correct!' : '✗ Incorrect'}
              </Text>
            </View>

            {currentIndex < questions.length - 1 ? (
              <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                <Text style={styles.nextText}>Next Question</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.finalScore}>
                <Text style={styles.finalScoreText}>
                  Final Score: {score} / {questions.length}
                </Text>
                <Text style={styles.percentageText}>
                  {Math.round((score / questions.length) * 100)}%
                </Text>
              </View>
            )}
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 18,
    color: '#ff3b30',
    marginBottom: 10,
  },
  errorHint: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
  headerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  scoreText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 20,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    textTransform: 'capitalize',
  },
  questionText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 24,
    lineHeight: 28,
  },
  optionsContainer: {
    marginBottom: 20,
  },
  optionButton: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#007AFF',
    marginRight: 12,
    width: 24,
  },
  optionText: {
    fontSize: 16,
    color: '#000',
    flex: 1,
  },
  selectedOption: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  selectedText: {
    color: '#fff',
  },
  correctOption: {
    backgroundColor: '#34C759',
    borderColor: '#34C759',
  },
  correctText: {
    color: '#fff',
  },
  wrongOption: {
    backgroundColor: '#FF3B30',
    borderColor: '#FF3B30',
  },
  wrongText: {
    color: '#fff',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultBox: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  correctBox: {
    backgroundColor: '#34C759',
  },
  wrongBox: {
    backgroundColor: '#FF3B30',
  },
  resultText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  nextButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  nextText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  finalScore: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  finalScoreText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
  },
  percentageText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#007AFF',
  },
});

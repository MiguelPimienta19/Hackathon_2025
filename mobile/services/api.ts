// API service for communicating with the backend

// The default host points to your laptop's LAN IP so a phone on the same network can reach it.
// If you ever want to override (e.g., simulators running against localhost), assign
// `globalThis.__API_BASE_URL__` before this module runs.

// Campus WiFi: http://10.108.65.189:8000
// Home WiFi: http://10.0.0.98:8000
const fallbackBaseUrl = 'http://10.108.65.189:8000';
const overrideBaseUrl = (globalThis as any).__API_BASE_URL__ as string | undefined;
export const API_BASE_URL = overrideBaseUrl ?? fallbackBaseUrl;

export interface Question {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  difficulty: string;
  topic: string;
  subtopic: string;
}

export interface DeepQuestion {
  id: string;
  prompt: string;
  topic: string;
  difficulty: string;
  rubric_points: string[];
}

export interface CheckAnswerResponse {
  correct: boolean;
  correct_option?: string;
  message: string;
  error?: string;
}

export interface EvaluateAnswerRequest {
  question: string;
  user_answer: string;
  ideal_answer?: string;
}

export interface EvaluateAnswerResponse {
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  audio_base64: string;
  audio_size_bytes: number;
}

export interface GetQuestionsParams {
  difficulty?: 'easy' | 'medium' | 'hard';
  topic?: string;
  subtopic?: string;
  limit?: number;
  randomize?: boolean;
}

export interface GetDeepQuestionsParams {
  topic?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  limit?: number;
}

class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Fetch multiple choice questions from the backend
   */
  async getQuestions(params?: GetQuestionsParams): Promise<Question[]> {
    try {
      const queryParams = new URLSearchParams();

      if (params?.difficulty) queryParams.append('difficulty', params.difficulty);
      if (params?.topic) queryParams.append('topic', params.topic);
      if (params?.subtopic) queryParams.append('subtopic', params.subtopic);
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.randomize) queryParams.append('randomize', 'true');

      const url = `${this.baseUrl}/api/questions${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching questions:', error);
      throw error;
    }
  }

  /**
   * Fetch a single question by ID
   */
  async getQuestionById(questionId: string): Promise<Question> {
    try {
      const response = await fetch(`${this.baseUrl}/api/questions/${questionId}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching question:', error);
      throw error;
    }
  }

  /**
   * Check if a selected answer is correct
   */
  async checkAnswer(questionId: string, selectedOption: 'A' | 'B' | 'C' | 'D'): Promise<CheckAnswerResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/check-answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question_id: questionId,
          selected_option: selectedOption,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error checking answer:', error);
      throw error;
    }
  }

  /**
   * Test the backend connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/test`);
      return response.ok;
    } catch (error) {
      console.error('Error testing connection:', error);
      return false;
    }
  }

  /**
   * Evaluate a user's answer to an open-ended question
   */
  async evaluateAnswer(request: EvaluateAnswerRequest): Promise<EvaluateAnswerResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/evaluate-answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error evaluating answer:', error);
      throw error;
    }
  }

  /**
   * Fetch open-ended deep interview questions from the backend
   */
  async getDeepQuestions(params?: GetDeepQuestionsParams): Promise<DeepQuestion[]> {
    try {
      const queryParams = new URLSearchParams();

      if (params?.topic) queryParams.append('topic', params.topic);
      if (params?.difficulty) queryParams.append('difficulty', params.difficulty);
      if (params?.limit) queryParams.append('limit', params.limit.toString());

      const url = `${this.baseUrl}/api/deep-questions${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching deep questions:', error);
      throw error;
    }
  }
}

export const apiService = new ApiService();

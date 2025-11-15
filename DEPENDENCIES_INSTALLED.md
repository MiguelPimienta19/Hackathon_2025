# Dependencies Installed

## Mobile App Dependencies (React Native + Expo)

### Core Framework
- **expo** - Framework for building React Native apps
- **react-native** - Mobile app framework (comes with Expo)
- **typescript** - Type-safe JavaScript

### Navigation
- **@react-navigation/native** - Main navigation library
- **@react-navigation/native-stack** - Stack-based navigation (screens on top of each other)
- **react-native-screens** - Native screen primitives for better performance
- **react-native-safe-area-context** - Handles notches, status bars, etc.

### Audio Recording & Playback
- **expo-av** - Audio/Video library for recording voice answers and playing AI feedback

### State Management
- **zustand** - Lightweight state management (like Redux but simpler)
  - **What is Zustand?** A minimal state management library. Instead of using React Context or Redux, Zustand lets you create global stores with just a few lines of code.
  - **Why use it?** Perfect for tracking lesson progress, user answers, XP/streak data across different screens.
  - **Example use case:** Store the current question index, score, and user answers while navigating through a lesson.

### Backend Communication & Data
- **@supabase/supabase-js** - Client for Supabase (database, auth, storage)
- **@react-native-async-storage/async-storage** - Local storage for offline data (user preferences, cached progress)

---

## Backend Dependencies (Python + FastAPI)

### Web Framework
- **fastapi** (v0.115.0) - Modern, fast Python web framework for building APIs
- **uvicorn** (v0.32.0) - ASGI server to run FastAPI
- **python-multipart** (v0.0.12) - For handling file uploads (audio files)

### HTTP Client
- **httpx** (v0.27.2) - Modern HTTP client for calling external APIs (Gemini, ElevenLabs)

### Database & Auth
- **supabase** (v2.9.0) - Python client for Supabase (PostgreSQL database + authentication)

### AI & TTS Services
- **google-generativeai** (v0.8.3) - Google Gemini API for evaluating user answers
- **elevenlabs** (v1.9.0) - ElevenLabs API for text-to-speech feedback

### Configuration & Validation
- **python-dotenv** (v1.0.1) - Load environment variables from .env files
- **pydantic** (v2.9.2) - Data validation and settings management
- **pydantic-settings** (v2.6.0) - Configuration management using Pydantic

---

## What is Zustand?

**Zustand** is a small, fast state management library for React. Think of it as a simplified Redux.

### Why we chose Zustand for this project:

1. **Simple API** - Create a store in ~10 lines of code
2. **No boilerplate** - Unlike Redux, no actions, reducers, or providers needed
3. **TypeScript friendly** - Great type inference
4. **Perfect for our use case** - Managing lesson state, user progress, and answers

### Example of how we'll use it:

```typescript
// stores/lessonStore.ts
import { create } from 'zustand';

interface LessonStore {
  currentIndex: number;
  correctCount: number;
  questions: Question[];
  nextQuestion: () => void;
  submitAnswer: (isCorrect: boolean) => void;
}

export const useLessonStore = create<LessonStore>((set) => ({
  currentIndex: 0,
  correctCount: 0,
  questions: [],

  nextQuestion: () => set((state) => ({
    currentIndex: state.currentIndex + 1
  })),

  submitAnswer: (isCorrect) => set((state) => ({
    correctCount: state.correctCount + (isCorrect ? 1 : 0)
  }))
}));

// Use it in any component:
function LessonScreen() {
  const { currentIndex, nextQuestion } = useLessonStore();

  return (
    <Button onPress={nextQuestion}>
      Next Question (Current: {currentIndex})
    </Button>
  );
}
```

It's essentially a global store that any component can access without prop drilling!

---

## Ready to Start Building? ✅

All dependencies are installed. You can now:

1. **Run the mobile app:**
   ```bash
   cd mobile
   npm start
   ```

2. **Run the backend** (once we create main.py):
   ```bash
   cd backend
   source venv/bin/activate
   uvicorn main:app --reload
   ```

**Next step:** Set up environment variables and start building the API endpoints!

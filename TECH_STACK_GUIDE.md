# Tech Stack Guide - Complete Overview

**For developers joining this project:** This guide explains every technology we're using and how they all connect together.

---

## 🎯 The Big Picture

We're building a **Duolingo-style mobile app** for technical interview practice with AI-powered voice feedback.

**Architecture:**
```
┌─────────────────┐
│  Mobile App     │  (React Native + Expo)
│  (TypeScript)   │  - User interface
│                 │  - Audio recording
└────────┬────────┘
         │ HTTPS/JSON
         ▼
┌─────────────────┐
│  Backend API    │  (FastAPI - Python)
│                 │  - Business logic
│                 │  - API orchestration
└─────┬───┬───┬───┘
      │   │   │
      │   │   └──────────┐
      │   │              │
      ▼   ▼              ▼
┌─────────┐  ┌────────────┐  ┌─────────────┐
│Supabase │  │   Gemini   │  │ ElevenLabs  │
│(Database│  │    (AI)    │  │    (TTS)    │
│  + Auth)│  │ Evaluation │  │Voice Feedback│
└─────────┘  └────────────┘  └─────────────┘
```

---

## 📱 Mobile App Tech Stack

### **React Native + Expo**
- **What it is:** Framework for building native iOS/Android apps using JavaScript/TypeScript
- **Why we use it:** Write once, run on both iOS and Android
- **What Expo adds:** Development tools, easy testing, pre-built modules (camera, audio, etc.)
- **Our use case:** The entire mobile interface that users interact with

### **TypeScript**
- **What it is:** JavaScript with type checking
- **Why we use it:** Catch bugs before runtime, better autocomplete, safer code
- **Example:**
  ```typescript
  interface Question {
    id: string;
    prompt: string;
    type: 'mcq' | 'code' | 'voice';
  }
  // TypeScript won't let you set type to 'invalid-type'
  ```

### **React Navigation**
- **What it is:** Routing/navigation library for React Native
- **Why we use it:** Move between screens (Home → Lesson → Results)
- **Two packages:**
  - `@react-navigation/native` - Core navigation
  - `@react-navigation/native-stack` - Stack-based navigation (like a stack of cards)
- **Our use case:** Navigate from Home Screen → Voice Question Screen → Summary Screen

### **Expo AV**
- **What it is:** Audio and Video library built into Expo
- **Why we use it:** Record user's voice, play AI feedback audio
- **Our use case:**
  - **Record** user explaining "how to solve two-sum in O(n)"
  - **Play** the AI coach's voice feedback

### **Zustand**
- **What it is:** Lightweight state management library
- **Why we use it:** Share data across screens without prop drilling
- **Alternative to:** Redux (but much simpler)
- **Our use case:** Track lesson progress, current question index, user score, XP
- **Example:**
  ```typescript
  // Any screen can access:
  const { currentQuestion, score } = useLessonStore();
  ```

### **@supabase/supabase-js**
- **What it is:** JavaScript client for Supabase (talks to our database)
- **Why we use it:** Fetch questions, save user progress, handle authentication
- **Our use case:**
  - Fetch today's lesson questions
  - Save completed session (XP, accuracy)
  - User login/signup

### **AsyncStorage**
- **What it is:** Local storage for React Native (like browser localStorage)
- **Why we use it:** Store data offline on the device
- **Our use case:** Cache user preferences, streak count, last completed lesson

---

## 🖥️ Backend Tech Stack

### **FastAPI**
- **What it is:** Modern Python web framework for building APIs (like Express.js but Python)
- **Why we use it:** Fast, easy to write, automatic API documentation, great for async operations
- **Our use case:** The main API server that mobile app talks to
- **Example endpoint:**
  ```python
  @app.post("/api/voice-answer")
  async def voice_answer(audio: bytes, question_id: str):
      # Process voice answer
      return {"score": 4, "feedback": "..."}
  ```

### **Uvicorn**
- **What it is:** Lightning-fast ASGI server (runs FastAPI apps)
- **Why we use it:** Serves our FastAPI application
- **Our use case:** Run the backend server locally or in production
- **Command:** `uvicorn main:app --reload`

### **HTTPx**
- **What it is:** Modern HTTP client for Python (like `axios` for JavaScript)
- **Why we use it:** Make HTTP requests to external APIs
- **Our use case:** Call Gemini API, call ElevenLabs API from our backend


### **Supabase Python Client**
- **What it is:** Python library to interact with Supabase
- **Why we use it:** Database queries, authentication from backend
- **Our use case:**
  - Fetch questions from database
  - Save user answers and scores
  - Log session data

### **Google Generative AI (Gemini)**
- **What it is:** Google's AI model API
- **Why we use it:** Evaluate user's spoken answer and provide intelligent feedback
- **Our use case:**
  ```
  User says: "Use a hash map to track indices..."
  ↓
  Send to Gemini with question context
  ↓
  Gemini returns: Score (4/5) + Feedback text
  ```

### **ElevenLabs**
- **What it is:** Text-to-speech API with realistic AI voices
- **Why we use it:** Convert feedback text into natural-sounding speech
- **Our use case:**
  ```
  Feedback text: "Good explanation, but you missed..."
  ↓
  ElevenLabs TTS
  ↓
  Audio file (.mp3) with coach's voice
  ```

### **Pydantic**
- **What it is:** Data validation library for Python (like TypeScript but for Python)
- **Why we use it:** Validate API request/response data, manage settings
- **Our use case:**
  ```python
  class VoiceAnswerRequest(BaseModel):
      question_id: str
      audio_bytes: bytes
      user_id: str
  # FastAPI automatically validates incoming data
  ```

### **python-dotenv**
- **What it is:** Loads environment variables from `.env` files
- **Why we use it:** Keep API keys secret (not in code)
- **Our use case:** Store `GEMINI_API_KEY`, `ELEVENLABS_API_KEY`, etc.

---

## 🗄️ Database & Services

### **Supabase**
- **What it is:** Open-source Firebase alternative (PostgreSQL database + auth + storage)
- **Why we use it:** Backend-as-a-service (don't need to set up our own database server)
- **Components we use:**
  1. **PostgreSQL Database** - Store questions, users, sessions, answers
  2. **Authentication** - User login/signup (email or social)
  3. **Real-time subscriptions** - (Optional) Live updates
  4. **Storage** - (Optional) Store audio files

**Our Database Tables:**
- `questions` - Question bank (MCQ, code, voice questions)
- `profiles` - User info (username, preferred language)
- `sessions` - Completed lessons (XP earned, accuracy)
- `answers` - Individual answers (for analytics)

---

## 🔄 How Everything Connects: The Full Flow

### **Example: User Answers a Voice Question**

1. **Mobile App (React Native + Expo AV)**
   - User presses "Record" button
   - Records audio: *"To solve two-sum in O(n), use a hash map..."*
   - Sends audio to backend via HTTP POST

2. **Backend API (FastAPI)**
   - Receives audio file
   - Fetches question details from **Supabase**
   - Converts speech to text (or sends audio directly to Gemini)

3. **AI Evaluation (Gemini API)**
   - Receives: question prompt + ideal answer + user's transcript
   - Returns: score (0-5) + feedback text
   - Example: *"Score: 4/5. You correctly explained the hash map approach, but didn't mention handling duplicates."*

4. **Text-to-Speech (ElevenLabs)**
   - Receives: feedback text
   - Returns: audio URL or audio bytes
   - Sounds like a real coach speaking

5. **Backend API** (continued)
   - Saves answer to **Supabase** (user_id, question_id, score, transcript)
   - Returns to mobile app: `{ score: 4, feedback_text: "...", audio_url: "..." }`

6. **Mobile App** (continued)
   - Displays score and text feedback
   - **Expo AV** plays the audio feedback
   - **Zustand** updates global state (XP, streak)
   - Navigates to next question or summary screen

---

## 🛠️ Development Workflow

### **Running the Mobile App**
```bash
cd mobile
npm start
# Press 'i' for iOS, 'a' for Android, or scan QR code
```

### **Running the Backend**
```bash
cd backend
source venv/bin/activate  # Activate Python environment
uvicorn main:app --reload # Start server on http://localhost:8000
```

### **Project Structure**
```
Hackathon_2025/
├── mobile/
│   ├── screens/         # React Native screens (Home, Lesson, etc.)
│   ├── components/      # Reusable UI components
│   ├── stores/          # Zustand state management
│   ├── services/        # API calls, Supabase client
│   └── types/           # TypeScript type definitions
│
├── backend/
│   ├── main.py          # FastAPI app entry point
│   ├── routers/         # API route handlers
│   │   ├── questions.py
│   │   ├── voice.py
│   │   └── sessions.py
│   ├── services/        # External API integrations
│   │   ├── gemini.py
│   │   ├── elevenlabs.py
│   │   └── supabase.py
│   └── models/          # Pydantic models
│
└── .env                 # Environment variables (API keys)
```

---

## 🔑 Environment Variables Needed

### **Backend `.env`**
```bash
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_gemini_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key
```

### **Mobile `.env` (optional)**
```bash
EXPO_PUBLIC_API_URL=http://localhost:8000
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

---

## 📚 Key Concepts to Understand

### **1. REST API Communication**
- Mobile app sends HTTP requests (GET, POST) to backend
- Backend responds with JSON data
- Example: `POST /api/voice-answer` with audio → returns `{ score, feedback, audio_url }`

### **2. Async/Await Pattern**
- Both TypeScript and Python use async/await for non-blocking operations
- Important for API calls, database queries, file uploads
```typescript
// TypeScript
const response = await fetch('/api/lesson');
const data = await response.json();
```
```python
# Python
response = await gemini_api.evaluate(transcript)
```

### **3. Type Safety**
- TypeScript (frontend) + Pydantic (backend) = fewer runtime errors
- Define data shapes once, get validation everywhere

### **4. State Management Flow**
```
User Action → Update Zustand Store → UI Re-renders
                                    ↓
                            Also send to Backend API
                                    ↓
                            Save to Supabase Database
```

---

## 🎓 Learning Resources

- **React Native:** https://reactnative.dev/docs/getting-started
- **Expo:** https://docs.expo.dev/
- **FastAPI:** https://fastapi.tiangolo.com/
- **Supabase:** https://supabase.com/docs
- **Zustand:** https://docs.pmnd.rs/zustand/getting-started/introduction
- **Gemini API:** https://ai.google.dev/docs
- **ElevenLabs:** https://elevenlabs.io/docs

---

## 🚀 Quick Start Checklist

- [x] Install Node.js and npm
- [x] Install Python 3.11+
- [x] Install mobile dependencies (`npm install`)
- [x] Install backend dependencies (`pip install -r requirements.txt`)
- [ ] Get API keys (Supabase, Gemini, ElevenLabs)
- [ ] Create `.env` files
- [ ] Set up Supabase database tables
- [ ] Build backend API endpoints
- [ ] Build mobile UI screens
- [ ] Test the full voice answer flow

---

**You're now ready to start building!** Each technology has a specific role, and they all work together to create the AI-powered interview coach experience.

# TechPrep - Demo Guide for Judges

## What is TechPrep?

TechPrep is a gamified mobile app that helps developers practice for technical interviews. Think Duolingo, but for coding interviews with AI-powered voice feedback.

## Core Features

### 1. Quick Quiz Mode
- Multiple-choice questions on data structures, algorithms, and system design
- Questions tagged by difficulty (easy, medium, hard) and topic
- Instant feedback on answers
- Earn XP for correct answers with bonus points for perfect scores

### 2. Deep Dive Interview Mode
- Voice-based practice for explaining solutions
- User speaks their answer out loud (simulating real interviews)
- AI evaluates the explanation and provides:
  - Numeric score (0-5)
  - Written feedback highlighting strengths and areas for improvement
  - Audio feedback delivered in a natural voice

### 3. Gamification System
- **Daily Streaks**: Track consecutive days of practice
- **XP Points**: Earn points for completing quizzes and interviews
- **Progress Dashboard**: View total XP, streak count, quiz/interview completions, and best scores
- All stats persist locally on the device

## How It Works - Technical Flow

### Quick Quiz Flow
1. User selects a topic from the home screen
2. App fetches 10 randomized questions from Supabase database
3. User answers each question
4. Backend validates answer and returns correct/incorrect
5. Stats update: XP awarded, completion count incremented, streak updated
6. Final score displayed with percentage

### Deep Dive Interview Flow
1. User selects interview practice mode and topic
2. App fetches 5 open-ended questions from database
3. For each question:
   - User taps "Start Recording" to record voice answer
   - Audio recorded using Expo AV (native iOS/Android audio)
   - Audio sent to backend as M4A file
4. Backend processing:
   - **OpenAI Whisper API**: Converts speech to text
   - **Gemini AI**: Evaluates transcript against ideal answer rubric
   - **ElevenLabs**: Converts feedback text to natural voice audio
5. Response returned to app:
   - Score displayed (0-5 scale)
   - Transcript shown ("What You Said")
   - Written feedback with strengths and improvements
   - Audio feedback auto-plays
6. Stats updated after completing all 5 questions

## AI Integration Highlights

### Gemini AI (via OpenRouter)
- Analyzes user's spoken explanation
- Compares against rubric points stored in database
- Generates structured feedback with:
  - Numeric score
  - Strengths identified in the answer
  - Areas for improvement
  - Overall feedback summary

### ElevenLabs Text-to-Speech
- Converts feedback text into natural voice
- Provides immediate audio feedback
- Creates more engaging, interview-like experience
- Audio plays at 1.15x speed for efficiency

### OpenAI Whisper
- High-accuracy speech-to-text transcription
- Handles technical terminology well
- Supports various audio formats (M4A from iOS)

## Tech Stack Overview

**Mobile App:**
- React Native + Expo (TypeScript)
- Expo AV for audio recording/playback
- AsyncStorage for local stats persistence

**Backend:**
- FastAPI (Python)
- Supabase for PostgreSQL database
- OpenAI Whisper for transcription
- Gemini AI for evaluation
- ElevenLabs for voice synthesis

## Demo Flow Suggestion

1. **Show Landing Screen**: Point out stats card (streak, XP, completions)
2. **Quick Quiz Demo**:
   - Select a topic
   - Answer a few questions
   - Show difficulty badges on questions
   - Show final score and stats update
3. **Deep Dive Interview Demo**:
   - Select interview practice
   - Choose a topic
   - Record a voice answer to a question
   - Show the AI evaluation (score, transcript, feedback)
   - Play the audio feedback
4. **Return to Landing**: Show updated stats (increased XP, maintained streak)

## Key Differentiators

- **Voice-First Interview Practice**: Unlike traditional quiz apps, users practice explaining solutions verbally
- **Bi-Directional Voice**: Both input (user speech) and output (AI feedback) use voice
- **Offline-First Stats**: Gamification works without backend dependency
- **Production-Ready**: Full mobile app with backend API, not just a proof-of-concept
- **Multiple AI Services**: Combines Whisper, Gemini, and ElevenLabs seamlessly

## Running the Demo

### Prerequisites
- Backend server running on localhost:8000
- Mobile app in Expo Go or iOS Simulator
- Ensure `.env.local` has all API keys configured

### Quick Start
```bash
# Terminal 1 - Backend
cd backend
source venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2 - Mobile
cd mobile
npm start
# Press 'i' for iOS Simulator
```

### Testing Without Recording
If audio recording has issues during demo:
- Use the transcription feature to show existing transcripts
- Demo the text-based evaluation endpoint via Swagger docs at `localhost:8000/docs`
- Show pre-recorded demo session results

## Database

Questions are stored in Supabase PostgreSQL:
- **questions** table: 30+ multiple choice questions across various topics
- **deep_questions** table: 15+ interview prompts with rubric points

Topics include:
- Data Structures & Complexity
- System Design, Backend & Data
- Programming Language & Debugging

## Future Enhancements

- User authentication for cloud stats syncing
- Leaderboards and social features
- More question types (code debugging, system design diagrams)
- Spaced repetition algorithm for personalized practice
- Mock interview scheduling with AI interviewer

---

**Questions?** Check the main README.md for setup instructions and technical details.

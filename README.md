# TechPrep - AI-Powered Technical Interview Practice

An interactive mobile application that helps developers master technical interviews through gamified practice sessions with real-time AI feedback.

## Overview

TechPrep combines the engagement of Duolingo with the power of AI to create an effective technical interview preparation tool. Users practice through two modes:

- **Quick Quiz**: Multiple-choice questions on data structures, algorithms, and system design
- **Deep Dive Interview**: Voice-based practice where AI evaluates spoken explanations and provides audio feedback

## Key Features

- **AI-Powered Evaluation**: Gemini AI analyzes interview responses and provides detailed feedback
- **Voice Feedback**: ElevenLabs text-to-speech delivers feedback in natural voice
- **Gamification**: Daily streaks, XP points, and progress tracking keep users motivated
- **Difficulty Levels**: Questions tagged as easy, medium, or hard
- **Topic-Based Practice**: Focus on specific areas like data structures, system design, or programming concepts
- **Offline-First Stats**: Progress tracked locally with AsyncStorage

## Tech Stack

### Mobile App (React Native + Expo)
- **TypeScript** - Type-safe development
- **React Native** - Cross-platform mobile framework
- **Expo** - Development tools and native APIs
- **Expo AV** - Audio recording and playback
- **AsyncStorage** - Local data persistence

### Backend (FastAPI)
- **Python 3.11** - Modern Python features
- **FastAPI** - High-performance API framework
- **Supabase** - PostgreSQL database and authentication
- **OpenAI Whisper** - Speech-to-text transcription
- **Gemini API** - AI evaluation and feedback generation
- **ElevenLabs** - Natural voice synthesis

## Project Structure

```
Hackathon_2025/
├── mobile/                    # React Native mobile app
│   ├── screens/              # App screens (Landing, Quiz, Interview)
│   ├── services/             # API integration and stats management
│   └── package.json
│
├── backend/                   # FastAPI backend
│   ├── main.py               # API entry point
│   ├── services/             # External API integrations
│   │   ├── openrouter.py    # Gemini AI integration
│   │   ├── elevenlabs.py    # Text-to-speech
│   │   ├── whisper.py       # Speech-to-text
│   │   └── supabase.py      # Database operations
│   ├── models/               # Data models
│   └── requirements.txt
│
└── .env.local                # Environment variables
```

## Quick Start

### Prerequisites

- Node.js 16+
- Python 3.11+
- iOS Simulator (Mac) or Android Emulator
- API keys for Supabase, OpenAI, Gemini, and ElevenLabs

### Environment Setup

Create a `.env.local` file in the project root:

```bash
# Backend API
OPENROUTER_API_KEY=your_openrouter_key
ELEVENLABS_API_KEY=your_elevenlabs_key
OPENAI_API_KEY=your_openai_key
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
```

### Backend Setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Backend runs at: http://localhost:8000
API docs: http://localhost:8000/docs

### Mobile App Setup

```bash
cd mobile
npm install
npm start
```

Then:
- Press `i` for iOS Simulator
- Press `a` for Android Emulator
- Scan QR code with Expo Go on physical device

## API Endpoints

- `GET /` - Health check
- `GET /api/questions` - Fetch multiple choice questions
- `GET /api/deep-questions` - Fetch interview practice questions
- `POST /api/check-answer` - Validate quiz answer
- `POST /api/evaluate-answer` - AI evaluation of interview response
- `POST /api/transcribe-file` - Convert audio to text
- `GET /api/test-*` - Test external service connections

## Database Schema

### questions table
- Multiple choice questions for Quick Quiz mode
- Fields: question_text, option_a/b/c/d, correct_option, difficulty, topic, subtopic

### deep_questions table
- Open-ended prompts for Deep Dive Interview mode
- Fields: prompt, topic, difficulty, rubric_points

## Gamification System

- **XP Points**: 10 XP per correct answer, 50 XP quiz bonus, 50 XP perfect score bonus, 100+ XP for interviews
- **Daily Streaks**: Consecutive days of practice tracked automatically
- **Stats Tracking**: Quiz completions, interview completions, best scores
- **Local Storage**: All stats persist on device using AsyncStorage

## Development

### Testing APIs

All API endpoints can be tested using the auto-generated documentation at:
```
http://localhost:8000/docs
```

### Updating Network IP

If testing on a physical device, update the API base URL in:
```
mobile/services/api.ts
```

Change `fallbackBaseUrl` to your computer's local network IP.

## Production Deployment

### Backend
- Deploy to services like Railway, Render, or AWS
- Set environment variables in hosting platform
- Update CORS origins in `main.py`

### Mobile
- Build standalone app: `expo build:ios` or `expo build:android`
- Update API_BASE_URL to production backend URL
- Submit to App Store / Play Store

## License

This project was created for a hackathon and is provided as-is for educational purposes.

## Acknowledgments

- OpenRouter for Gemini API access
- ElevenLabs for voice synthesis
- OpenAI Whisper for transcription
- Supabase for backend infrastructure
- Expo for mobile development platform

# Interview Coach - Duolingo-style Technical Interview App

A mobile application for practicing technical interviews with AI-powered feedback.

## Project Structure

```
├── mobile/          # React Native + Expo mobile app (TypeScript)
├── backend/         # FastAPI backend server (Python)
└── description.txt  # Full project specification
```

## Getting Started

### Prerequisites

- Node.js (v16+)
- Python 3.11+
- Expo CLI
- iOS Simulator (Mac) or Android Emulator

### Mobile App Setup

```bash
cd mobile
npm install
npm start
```

This will start the Expo development server. You can then:
- Press `i` to open iOS simulator
- Press `a` to open Android emulator
- Scan QR code with Expo Go app on your phone

### Backend Setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

To run the backend:
```bash
uvicorn main:app --reload
```

## Tech Stack

### Mobile (React Native + Expo)
- TypeScript
- React Navigation
- Zustand (state management)
- Expo AV (audio recording/playback)
- Supabase client

### Backend (FastAPI)
- Python 3.11+
- FastAPI
- Supabase (PostgreSQL + Auth)
- Google Gemini API (AI evaluation)
- ElevenLabs API (text-to-speech)

## Environment Variables

You'll need to create `.env` files:

### Backend `.env`
```
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
GEMINI_API_KEY=your_gemini_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key
```

### Mobile `.env` (optional)
```
EXPO_PUBLIC_API_URL=http://localhost:8000
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Next Steps

1. Set up Supabase project and database
2. Configure environment variables
3. Create database schema (see description.txt)
4. Implement backend API endpoints
5. Build mobile UI screens
6. Test voice recording and AI feedback flow

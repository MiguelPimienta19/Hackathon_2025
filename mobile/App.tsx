import React, { useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LandingScreen } from './screens/LandingScreen';
import { ModeSelectionScreen } from './screens/ModeSelectionScreen';
import { QuizScreen } from './screens/QuizScreen';
import { InterviewScreen } from './screens/InterviewScreen';

type Screen = 'Landing' | 'ModeSelection' | 'Quiz' | 'Interview';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('Landing');

  const navigate = (screen: Screen) => {
    setCurrentScreen(screen);
  };

  const goBack = () => {
    if (currentScreen === 'ModeSelection') {
      setCurrentScreen('Landing');
    } else if (currentScreen === 'Quiz' || currentScreen === 'Interview') {
      setCurrentScreen('ModeSelection');
    }
  };

  // Render the current screen
  // SafeAreaProvider is required by the SafeAreaView used in every screen;
  // Expo Go provides one implicitly, a static web build does not.
  const renderScreen = () => {
    switch (currentScreen) {
      case 'Landing':
        return <LandingScreen onNavigate={navigate} />;
      case 'ModeSelection':
        return <ModeSelectionScreen onNavigate={navigate} onGoBack={goBack} />;
      case 'Quiz':
        return <QuizScreen onGoBack={goBack} />;
      case 'Interview':
        return <InterviewScreen onGoBack={goBack} />;
      default:
        return <LandingScreen onNavigate={navigate} />;
    }
  };

  return <SafeAreaProvider>{renderScreen()}</SafeAreaProvider>;
}

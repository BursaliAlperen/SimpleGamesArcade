import React, { useState, useCallback, useEffect } from 'react';
import { User, Screen, Game } from './types';
import { TONCOIN_RATE } from './constants';
import LoginScreen from './components/LoginScreen';
import MainMenu from './components/MainMenu';
import GameMenu from './components/GameMenu';
import Bank from './components/Bank';
import Header from './components/Header';
import GameContainer from './components/game/GameContainer';
import { GAMES } from './components/game/GameList';
import BonusScreen from './components/BonusScreen';

// A type for the Telegram Web App user object
interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
}

// A simplified type for the Telegram Web App object
interface TelegramWebApp {
  initData: string;
  initDataUnsafe?: {
    user?: TelegramUser;
  };
  ready: () => void;
}

// Data received from either OAuth or Web App
interface TelegramAuthData {
  id: string | number;
  username?: string;
  firstName: string;
  lastName?: string;
  // This can be the full initData string from WebApp,
  // or the 'hash' parameter from the OAuth callback.
  validationData?: string;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentScreen, setCurrentScreen] = useState<Screen>(Screen.Login);
  const [activeGame, setActiveGame] = useState<Game | null>(null);
  const [lastGameScore, setLastGameScore] = useState<{ score: number; coins: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New states for Daily Bonus
  const [bonusStatus, setBonusStatus] = useState<{ available: boolean; nextBonusTime: number | null }>({ available: false, nextBonusTime: null });
  const [isClaimingBonus, setIsClaimingBonus] = useState(false);
  const [bonusClaimSuccess, setBonusClaimSuccess] = useState(false);
  const BONUS_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  const BONUS_AMOUNT = 1000;

  // Function to check bonus status
  const checkBonusStatus = useCallback(() => {
    // This logic would typically be on the backend.
    // We'll use localStorage to simulate it for this demo.
    if (!user) return;
    const lastClaimTime = localStorage.getItem(`lastBonusClaim_${user.telegramId}`);
    if (!lastClaimTime) {
      setBonusStatus({ available: true, nextBonusTime: null });
    } else {
      const nextAvailableTime = parseInt(lastClaimTime, 10) + BONUS_DURATION;
      if (Date.now() >= nextAvailableTime) {
        setBonusStatus({ available: true, nextBonusTime: null });
      } else {
        setBonusStatus({ available: false, nextBonusTime: nextAvailableTime });
      }
    }
  }, [user, BONUS_DURATION]);
  
  // useEffect to check bonus status when user is available
  useEffect(() => {
    if (user) {
      checkBonusStatus();
    }
  }, [user, checkBonusStatus]);

  const performLogin = useCallback(async (authData: TelegramAuthData) => {
    setIsLoading(true);
    setError(null);
    try {
        const response = await fetch('/api/auth/telegram', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                telegramId: authData.id.toString(),
                username: authData.username || `${authData.firstName} ${authData.lastName || ''}`.trim(),
                firstName: authData.firstName,
                lastName: authData.lastName || '',
                // The backend receives this to validate the request source
                authData: authData.validationData,
            })
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Authentication failed');
        }
        const userData: User = await response.json();
        setUser(userData);
        setCurrentScreen(Screen.MainMenu);
    } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
        setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Priority 1: Check for OAuth callback parameters in URL
    const params = new URLSearchParams(window.location.search);
    const oauthHash = params.get('hash');
    const oauthId = params.get('id');
    const oauthFirstName = params.get('first_name');

    if (oauthHash && oauthId && oauthFirstName) {
      const userFromParams: TelegramAuthData = {
          id: oauthId,
          validationData: oauthHash,
          username: params.get('username') || undefined,
          firstName: oauthFirstName,
          lastName: params.get('last_name') || undefined,
      };
      
      // Clean the URL to remove sensitive auth data after processing
      window.history.replaceState({}, document.title, window.location.pathname);
      performLogin(userFromParams);
      return; // Authentication handled, exit useEffect
    }

    // Priority 2: Check for Telegram Web App environment
    const telegram = window.Telegram?.WebApp;
    if (telegram && telegram.initData) {
      telegram.ready();
      const tgUser = telegram.initDataUnsafe?.user;
      if (tgUser) {
        performLogin({
            id: tgUser.id,
            validationData: telegram.initData, // Send the whole initData string for validation
            username: tgUser.username || `${tgUser.first_name} ${tgUser.last_name || ''}`.trim(),
            firstName: tgUser.first_name,
            lastName: tgUser.last_name,
        });
        return; // Authentication handled, exit useEffect
      }
    }
    
    // If neither authentication method was triggered, show login screen
    setIsLoading(false);

  }, [performLogin]);

  const handleClaimBonus = useCallback(async () => {
    if (!user || !bonusStatus.available) return;

    setIsClaimingBonus(true);
    // Simulate API call
    try {
      // Fake delay for user feedback
      await new Promise(res => setTimeout(res, 1000));
      
      // On success, update user state
      const newScore = user.score + BONUS_AMOUNT;
      const coinsFromBonus = BONUS_AMOUNT * TONCOIN_RATE;
      const newCoins = user.coins + coinsFromBonus;
      
      setUser({ ...user, score: newScore, coins: newCoins });
      
      // Simulate backend call to update score
      // In a real app, you'd want to handle the response from this
       fetch('/api/users/updateScore', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ telegramId: user.telegramId, newScore, newCoins })
      }).catch(err => console.error("Failed to sync bonus score with server", err));

      // Update bonus status locally
      localStorage.setItem(`lastBonusClaim_${user.telegramId}`, Date.now().toString());
      checkBonusStatus();
      setBonusClaimSuccess(true);
      // Reset success state after a few seconds to allow re-entry to the screen
      setTimeout(() => setBonusClaimSuccess(false), 4000);

    } catch (err) {
      console.error("Failed to claim bonus", err);
      // Handle error case, maybe show a message
    } finally {
      setIsClaimingBonus(false);
    }
  }, [user, bonusStatus.available, checkBonusStatus, BONUS_AMOUNT]);

  const handleRedirectToTelegram = useCallback(() => {
    const BOT_ID = '7993948970';
    const ORIGIN = 'https://simplegamesarcade.onrender.com';
    
    // Provide immediate feedback to the user on click
    setIsLoading(true); 
    
    const oauthUrl = `https://oauth.telegram.org/auth?bot_id=${BOT_ID}&origin=${encodeURIComponent(ORIGIN)}&request_access=write`;
    window.location.href = oauthUrl;
  }, []);

  const handleNavigation = useCallback((screen: Screen) => {
    // Reset bonus success state when navigating away from the bonus screen
    if (currentScreen === Screen.Bonus && screen !== Screen.Bonus) {
      setBonusClaimSuccess(false);
    }
    setCurrentScreen(screen);
  }, [currentScreen]);
  
  const handleSelectGame = useCallback((gameId: string) => {
    const game = GAMES.find(g => g.id === gameId);
    if (game) {
      setLastGameScore(null);
      setActiveGame(game);
      setCurrentScreen(Screen.Playing);
    }
  }, []);

  const handleGameOver = useCallback(async (score: number) => {
    if (user) {
      const coinsEarned = score * TONCOIN_RATE;
      const newScore = user.score + score;
      const newCoins = user.coins + coinsEarned;
      
      const originalUser = { ...user };
      // Optimistic update for UI responsiveness
      setUser({ ...user, score: newScore, coins: newCoins });
      setLastGameScore({ score, coins: coinsEarned });

      try {
        const response = await fetch('/api/users/updateScore', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ telegramId: user.telegramId, newScore, newCoins })
        });
        if (!response.ok) {
          // Revert optimistic update on failure
          console.error('Failed to update score on server.');
          setUser(originalUser);
        }
      } catch (err) {
        console.error('API call to update score failed:', err);
        // Revert on network error
        setUser(originalUser);
      }
    }
  }, [user]);

  const handleExitGame = useCallback(() => {
    setActiveGame(null);
    setCurrentScreen(Screen.GameMenu);
  }, []);
  
  const handleWithdraw = useCallback(async (amount: number, address: string): Promise<{ success: boolean; error?: string }> => {
    if (user && user.coins >= amount) {
        try {
            const response = await fetch('/api/users/withdraw', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ telegramId: user.telegramId, amount, address })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Withdrawal request failed');
            }
            
            setUser(prevUser => prevUser ? { ...prevUser, coins: data.newCoins } : null);
            return { success: true };
        } catch (err) {
            return { success: false, error: err instanceof Error ? err.message : 'An unknown error occurred.' };
        }
    }
    return { success: false, error: 'Insufficient funds or user not found.' };
  }, [user]);

  const renderContent = () => {
    if (isLoading) {
      return <div className="text-center p-8">Loading...</div>;
    }

    if (error && currentScreen === Screen.Login) {
      return <LoginScreen onLogin={handleRedirectToTelegram} isLoading={isLoading} error={error} />;
    }

    switch (currentScreen) {
      case Screen.Login:
        return <LoginScreen onLogin={handleRedirectToTelegram} isLoading={isLoading} />;
      case Screen.MainMenu:
        return <MainMenu onNavigate={handleNavigation} isBonusAvailable={bonusStatus.available} />;
      case Screen.GameMenu:
        return <GameMenu games={GAMES} onSelectGame={handleSelectGame} onBack={() => handleNavigation(Screen.MainMenu)} />;
      case Screen.Bank:
        return <Bank user={user} onWithdraw={handleWithdraw} onBack={() => handleNavigation(Screen.MainMenu)} />;
      case Screen.Bonus:
        return (
          <BonusScreen
            isAvailable={bonusStatus.available}
            nextBonusTime={bonusStatus.nextBonusTime}
            onClaim={handleClaimBonus}
            onBack={() => handleNavigation(Screen.MainMenu)}
            isLoading={isClaimingBonus}
            claimSuccess={bonusClaimSuccess}
          />
        );
      case Screen.Playing:
        if (activeGame) {
          return <GameContainer game={activeGame} onGameOver={handleGameOver} onExit={handleExitGame} lastGameScore={lastGameScore} />;
        }
        return null;
      default:
        return <LoginScreen onLogin={handleRedirectToTelegram} isLoading={isLoading} />;
    }
  };

  return (
    <div className="bg-gray-900 min-h-screen text-white flex flex-col items-center justify-center p-4 bg-gradient-to-br from-[#1a1a2e] to-[#16213e]">
      <div className="w-full max-w-md mx-auto bg-[#0f3460]/50 rounded-2xl shadow-2xl shadow-cyan-500/20 border border-cyan-400/20 overflow-hidden">
        {user && currentScreen !== Screen.Login && <Header user={user} />}
        <main className="p-6">
          {renderContent()}
        </main>
      </div>
       <footer className="text-center text-gray-500 text-xs mt-4">
        <p>Simple Arcade Games Platform</p>
      </footer>
    </div>
  );
};

export default App;

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

// Data to be sent to the backend for authentication
interface TelegramAuthData {
  telegramId: string | number;
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

  const [bonusStatus, setBonusStatus] = useState<{ available: boolean; nextBonusTime: number | null }>({ available: false, nextBonusTime: null });
  const [isClaimingBonus, setIsClaimingBonus] = useState(false);
  const [bonusClaimSuccess, setBonusClaimSuccess] = useState(false);
  const BONUS_DURATION = 24 * 60 * 60 * 1000;
  const BONUS_AMOUNT = 1000;

  const checkBonusStatus = useCallback(() => {
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
            body: JSON.stringify(authData)
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
    const params = new URLSearchParams(window.location.search);
    const oauthHash = params.get('hash');
    const oauthId = params.get('id');
    const oauthFirstName = params.get('first_name');

    if (oauthHash && oauthId && oauthFirstName) {
      performLogin({
          telegramId: oauthId,
          validationData: oauthHash,
          username: params.get('username') || undefined,
          firstName: oauthFirstName,
          lastName: params.get('last_name') || undefined,
      });
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    const telegram = window.Telegram?.WebApp;
    if (telegram && telegram.initData) {
      telegram.ready();
      const tgUser = telegram.initDataUnsafe?.user;
      if (tgUser) {
        performLogin({
            telegramId: tgUser.id,
            validationData: telegram.initData,
            username: tgUser.username,
            firstName: tgUser.first_name,
            lastName: tgUser.last_name,
        });
        return;
      }
    }
    
    setIsLoading(false);
  }, [performLogin]);

  const handleClaimBonus = useCallback(async () => {
    if (!user || !bonusStatus.available) return;
    setIsClaimingBonus(true);
    try {
      const newScore = user.score + BONUS_AMOUNT;
      const coinsFromBonus = BONUS_AMOUNT * TONCOIN_RATE;
      const newCoins = user.coins + coinsFromBonus;
      
      const response = await fetch('/api/users/updateScore', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ telegramId: user.telegramId, newScore, newCoins })
      });

      if (!response.ok) throw new Error("Failed to claim bonus on server.");

      const updatedUser = await response.json();
      setUser(updatedUser);
      
      localStorage.setItem(`lastBonusClaim_${user.telegramId}`, Date.now().toString());
      checkBonusStatus();
      setBonusClaimSuccess(true);
      setTimeout(() => setBonusClaimSuccess(false), 4000);
    } catch (err) {
      console.error("Failed to claim bonus", err);
    } finally {
      setIsClaimingBonus(false);
    }
  }, [user, bonusStatus.available, checkBonusStatus, BONUS_AMOUNT]);

  const handleRedirectToTelegram = useCallback(() => {
    setIsLoading(true); 
    const TELEGRAM_BOT_ID = '7993948970'; // From prompt
    const origin = window.location.origin;
    const oauthUrl = `https://oauth.telegram.org/auth?bot_id=${TELEGRAM_BOT_ID}&origin=${encodeURIComponent(origin)}&request_access=write`;
    window.location.href = oauthUrl;
  }, []);

  const handleNavigation = useCallback((screen: Screen) => {
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
      
      setLastGameScore({ score, coins: coinsEarned });

      try {
        const response = await fetch('/api/users/updateScore', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ telegramId: user.telegramId, newScore, newCoins })
        });
        if (!response.ok) {
          console.error('Failed to update score on server.');
        } else {
          const updatedUser = await response.json();
          setUser(updatedUser);
        }
      } catch (err) {
        console.error('API call to update score failed:', err);
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
    if (isLoading && !user) {
      return <div className="text-center p-8">Loading...</div>;
    }
    if (error && currentScreen === Screen.Login) {
      return <LoginScreen onLogin={handleRedirectToTelegram} isLoading={isLoading} error={error} />;
    }
    switch (currentScreen) {
      case Screen.Login:
        return <LoginScreen onLogin={handleRedirectToTelegram} isLoading={isLoading} />;
      case Screen.MainMenu:
        return user && <MainMenu onNavigate={handleNavigation} isBonusAvailable={bonusStatus.available} />;
      case Screen.GameMenu:
        return <GameMenu games={GAMES} onSelectGame={handleSelectGame} onBack={() => handleNavigation(Screen.MainMenu)} />;
      case Screen.Bank:
        return <Bank user={user} onWithdraw={handleWithdraw} onBack={() => handleNavigation(Screen.MainMenu)} />;
      case Screen.Bonus:
        return <BonusScreen isAvailable={bonusStatus.available} nextBonusTime={bonusStatus.nextBonusTime} onClaim={handleClaimBonus} onBack={() => handleNavigation(Screen.MainMenu)} isLoading={isClaimingBonus} claimSuccess={bonusClaimSuccess} />;
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

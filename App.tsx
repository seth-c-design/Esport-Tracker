import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Player } from './types';
import { PLAYER_NAMES } from './constants';
import { fetchPlayerSchedules } from './services/geminiService';
import { requestNotificationPermission, sendNotification, getNotificationPermission } from './services/notificationService';
import PlayerCard from './components/PlayerCard';
import Header from './components/Header';
import SettingsModal from './components/SettingsModal';
import useLocalStorage from './hooks/useLocalStorage';
import PlayerCardSkeleton from './components/PlayerCardSkeleton';

const App: React.FC = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Persisted state
  const [followedPlayers, setFollowedPlayers] = useLocalStorage<string[]>('followedPlayers', ['Boki']);
  const [notificationMinutes, setNotificationMinutes] = useLocalStorage<number>('notificationMinutes', 5);
  
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(getNotificationPermission() === 'granted');
  const sentNotificationsRef = useRef<Set<string>>(new Set());

  const loadSchedules = useCallback(async () => {
    try {
      const data = await fetchPlayerSchedules(PLAYER_NAMES);
      const hasData = data && data.some(p => p.schedule?.length > 0);
      
      setPlayers(currentPlayers => {
        // If the API returns valid data, we update the state.
        if (hasData) {
          return PLAYER_NAMES.map(name => {
            const foundPlayer = data.find(p => p.name.toLowerCase() === name.toLowerCase());
            return foundPlayer || { name, schedule: [] };
          });
        }

        // If the API returns empty data, we check if we already have data.
        // If we do, we keep it (stale-while-revalidate).
        // If we don't (initial load), we initialize with an empty structure.
        return currentPlayers.length > 0 
          ? currentPlayers 
          : PLAYER_NAMES.map(name => ({ name, schedule: [] }));
      });

      setError(null);
    } catch (err) {
      console.error("Error fetching schedules:", err);
      // On error, we only update the UI state if it's the initial load.
      // Otherwise, we keep the stale data and just log the error.
      setPlayers(currentPlayers => {
        if (currentPlayers.length === 0) {
          setError(err instanceof Error ? err.message : 'An unknown error occurred.');
          return []; // Clear for error message display
        }
        return currentPlayers; // Keep stale data
      });
    } finally {
      setIsLoading(false);
    }
  }, []); // Stable callback with empty dependency array

  useEffect(() => {
    loadSchedules();
    const refreshInterval = setInterval(loadSchedules, 5 * 60 * 1000); // Refresh every 5 minutes
    return () => clearInterval(refreshInterval);
  }, [loadSchedules]);

  const handleEnableNotifications = async () => {
    if (getNotificationPermission() !== 'granted') {
      const permissionGranted = await requestNotificationPermission();
      setNotificationsEnabled(permissionGranted);
      if(!permissionGranted) {
        alert("Notification permissions were denied. You can enable them in your browser settings.");
      }
    }
  };

  useEffect(() => {
    const checkMatchesInterval = setInterval(() => {
      if (getNotificationPermission() !== 'granted' || players.length === 0) return;

      const now = new Date();
      players
        .filter(p => followedPlayers.includes(p.name))
        .forEach(player => {
          player.schedule.forEach(match => {
            if (match.status !== 'upcoming') return;

            const matchTime = new Date(match.dateTime);
            const diffMinutes = (matchTime.getTime() - now.getTime()) / (1000 * 60);
            const notificationId = `${player.name}-${match.dateTime}`;

            if (diffMinutes > 0 && diffMinutes <= notificationMinutes) {
              if (!sentNotificationsRef.current.has(notificationId)) {
                sendNotification(`${player.name}'s match is starting soon!`, {
                  body: `vs ${match.opponent} in ${match.tournament}`,
                  icon: `https://picsum.photos/seed/${player.name}/128`,
                });
                sentNotificationsRef.current.add(notificationId);
              }
            }
          });
        });
    }, 30000); // Check every 30 seconds

    return () => clearInterval(checkMatchesInterval);
  }, [players, followedPlayers, notificationMinutes]);
  
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {PLAYER_NAMES.map(name => (
            <PlayerCardSkeleton key={name} />
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center p-8 bg-red-900/50 rounded-lg max-w-2xl mx-auto">
          <h2 className="text-2xl text-red-400 font-bold mb-2">Error Fetching Data</h2>
          <p className="text-red-300">{error}</p>
          <button
            onClick={() => { setIsLoading(true); loadSchedules(); }}
            className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-md font-semibold transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }
    
    const displayedPlayers = players.filter(p => followedPlayers.includes(p.name));
    
    if (displayedPlayers.length === 0) {
        return (
            <div className="text-center p-8 bg-gray-800 rounded-lg max-w-2xl mx-auto mt-16">
                <h2 className="text-2xl text-white font-bold mb-2">No Players Followed</h2>
                <p className="text-gray-400">Click the gear icon to select your favorite players.</p>
                <button
                    onClick={() => setIsSettingsOpen(true)}
                    className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-md font-semibold transition-colors"
                >
                    Open Settings
                </button>
            </div>
        );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {displayedPlayers.map(player => (
          <PlayerCard key={player.name} player={player} />
        ))}
      </div>
    );
  };
  
  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans p-4 sm:p-8">
      <Header onOpenSettings={() => setIsSettingsOpen(true)} />
      <main className="max-w-7xl mx-auto mt-8">
        {!notificationsEnabled && (
             <div className="flex justify-center mb-8">
                 <button
                   onClick={handleEnableNotifications}
                   className="px-6 py-3 rounded-full font-bold transition-all duration-300 text-white bg-indigo-600 hover:bg-indigo-700 animate-pulse"
                 >
                   Enable Match Notifications
                 </button>
             </div>
         )}
        {renderContent()}
      </main>
      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        followedPlayers={followedPlayers}
        setFollowedPlayers={setFollowedPlayers}
        notificationMinutes={notificationMinutes}
        setNotificationMinutes={setNotificationMinutes}
      />
    </div>
  );
};

export default App;
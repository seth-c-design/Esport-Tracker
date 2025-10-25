
import React from 'react';
import { PLAYER_NAMES } from '../constants';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  followedPlayers: string[];
  setFollowedPlayers: (players: string[]) => void;
  notificationMinutes: number;
  setNotificationMinutes: (minutes: number) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  followedPlayers,
  setFollowedPlayers,
  notificationMinutes,
  setNotificationMinutes,
}) => {
  if (!isOpen) return null;

  const handleFollowToggle = (playerName: string) => {
    const newFollowed = new Set(followedPlayers);
    if (newFollowed.has(playerName)) {
      newFollowed.delete(playerName);
    } else {
      newFollowed.add(playerName);
    }
    setFollowedPlayers(Array.from(newFollowed));
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 transition-opacity" onClick={onClose}>
      <div className="bg-gray-800 rounded-lg shadow-2xl p-8 w-full max-w-md mx-4 transform transition-transform" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Settings</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-3xl leading-none">&times;</button>
        </div>
        
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-300 mb-3">Follow Players</h3>
          <div className="space-y-2">
            {PLAYER_NAMES.map(name => (
              <label key={name} className="flex items-center justify-between bg-gray-700 p-3 rounded-md cursor-pointer hover:bg-gray-600/50 transition-colors">
                <span className="text-white font-medium">{name}</span>
                <input
                  type="checkbox"
                  checked={followedPlayers.includes(name)}
                  onChange={() => handleFollowToggle(name)}
                  className="form-checkbox h-5 w-5 text-indigo-600 bg-gray-800 border-gray-600 rounded focus:ring-indigo-500 focus:ring-offset-gray-800"
                />
              </label>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-300 mb-3">Notification Timing</h3>
           <label htmlFor="notification-minutes" className="block text-sm font-medium text-gray-400 mb-2">
            Notify me <span className="font-bold text-indigo-400">{notificationMinutes}</span> minutes before a match starts.
          </label>
          <input
            id="notification-minutes"
            type="range"
            min="1"
            max="60"
            value={notificationMinutes}
            onChange={e => setNotificationMinutes(parseInt(e.target.value, 10))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
        </div>
        
        <div className="mt-8 text-center">
            <button 
                onClick={onClose}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-md font-semibold transition-colors"
            >
                Done
            </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;

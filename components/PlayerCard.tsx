import React, { useState } from 'react';
import { Player, Match } from '../types';
import { analyzeMatch } from '../services/geminiService';

const formatDate = (isoString: string): string => {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) {
      return "Invalid Date";
    }
    return date.toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch (error) {
    return "Invalid Date";
  }
};

const PlayIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
        <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
    </svg>
);

const BrainIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.572L16.5 21.75l-.398-1.178a3.375 3.375 0 00-2.456-2.456L12.5 18l1.178-.398a3.375 3.375 0 002.456-2.456L16.5 14.25l.398 1.178a3.375 3.375 0 002.456 2.456L20.25 18l-1.178.398a3.375 3.375 0 00-2.456 2.456z" />
    </svg>
);

const MatchStatusBadge: React.FC<{ status: Match['status'] }> = ({ status }) => {
  if (status === 'live') {
    return (
      <div className="flex items-center space-x-2">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
        </span>
        <span className="text-red-400 font-bold text-sm">LIVE</span>
      </div>
    );
  }
  return null;
};

interface MatchRowProps {
  match: Match;
  playerName: string;
}

const MatchRow: React.FC<MatchRowProps> = ({ match, playerName }) => {
  const [analysis, setAnalysis] = useState<{ winPercentage: number | null; analysis: string | null }>({ winPercentage: null, analysis: null });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (match.status === 'finished') return;
    setIsAnalyzing(true);
    setError(null);
    try {
      const result = await analyzeMatch(playerName, match.opponent, match.game);
      setAnalysis(result);
    } catch (e) {
      setError("Analysis failed.");
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <li className={`p-4 rounded-md transition-all duration-300 ${match.status === 'finished' ? 'bg-gray-700/30 opacity-60' : 'bg-gray-700/50'}`}>
      <div className="flex items-center gap-4">
        {/* Analysis Section */}
        <div className="w-24 h-20 flex-shrink-0 flex flex-col items-center justify-center">
          {analysis.winPercentage !== null ? (
            <div className="text-center">
              <p className="text-xs text-gray-300 font-semibold">Win Chance</p>
              <p className="text-3xl font-bold text-green-400">{analysis.winPercentage}%</p>
            </div>
          ) : isAnalyzing ? (
            <div className="w-full">
              <div className="h-2 bg-gray-600 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 w-full animate-progress"></div>
              </div>
              <p className="text-xs text-indigo-400 mt-1 text-center font-semibold">Analyzing...</p>
            </div>
          ) : (
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || match.status === 'finished'}
              className="disabled:opacity-40 disabled:cursor-not-allowed flex flex-col items-center text-indigo-400 hover:text-indigo-300 transition-colors"
              aria-label={`Analyze match vs ${match.opponent}`}
            >
              <BrainIcon />
              <span className="text-xs font-semibold mt-1">Analyze</span>
            </button>
          )}
          {error && <p className="text-red-500 text-xs mt-1 text-center">{error}</p>}
        </div>

        {/* Match Details Section */}
        <div className="flex-grow border-l border-gray-600/50 pl-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-medium text-lg text-white">vs {match.opponent}</p>
              <p className="text-sm text-gray-400 font-medium">{match.game}</p>
            </div>
            <span className="text-sm text-indigo-400 font-semibold text-right flex-shrink-0 ml-2">{match.tournament}</span>
          </div>
          <div className="flex justify-between items-center mt-2">
            <p className="text-gray-400 text-sm">{formatDate(match.dateTime)}</p>
            <div className="flex items-center space-x-3">
              {match.status === 'live' && <MatchStatusBadge status={match.status} />}
              {match.status === 'live' && match.streamUrl && (
                <a href={match.streamUrl} target="_blank" rel="noopener noreferrer" className="flex items-center bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-1 px-3 rounded-full transition-colors">
                  <PlayIcon /> WATCH
                </a>
              )}
              {match.status === 'finished' && (
                <span className={`text-xs font-bold px-2 py-1 rounded ${
                  match.result === 'win' ? 'bg-green-500/30 text-green-300' :
                  match.result === 'loss' ? 'bg-red-500/30 text-red-300' :
                  match.result === 'draw' ? 'bg-gray-500/30 text-gray-300' :
                  'bg-gray-900 text-gray-500'
                }`}>
                  {match.result ? match.result.toUpperCase() : 'FINISHED'}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </li>
  );
};

interface PlayerCardProps {
  player: Player;
}

const PlayerCard: React.FC<PlayerCardProps> = ({ player }) => {
  const sortedSchedule = [...player.schedule].sort((a, b) => {
    const statusOrder = { live: 1, upcoming: 2, finished: 3 };
    if (statusOrder[a.status] !== statusOrder[b.status]) {
      return statusOrder[a.status] - statusOrder[b.status];
    }
    const dateA = new Date(a.dateTime).getTime();
    const dateB = new Date(b.dateTime).getTime();
    if (a.status === 'upcoming') return dateA - dateB;
    if (a.status === 'finished') return dateB - dateA;
    return dateA - dateB;
  });

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden transform hover:scale-105 transition-transform duration-300">
      <div className="p-6">
        <div className="flex items-center space-x-4">
          <img
            src={`https://picsum.photos/seed/${player.name}/80`}
            alt={`${player.name}`}
            className="w-20 h-20 rounded-full border-4 border-indigo-500 object-cover"
          />
          <h2 className="text-3xl font-bold text-white">{player.name}</h2>
        </div>
        <div className="mt-6">
          <h3 className="text-xl font-semibold text-gray-300 border-b-2 border-gray-700 pb-2 mb-4">Match Schedule</h3>
          {sortedSchedule.length > 0 ? (
            <ul className="space-y-4">
              {sortedSchedule.map((match, index) => (
                <MatchRow key={index} match={match} playerName={player.name} />
              ))}
            </ul>
          ) : (
            <div className="text-center py-4 px-2 bg-gray-700/50 rounded-md">
              <p className="text-gray-400">No upcoming matches found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlayerCard;
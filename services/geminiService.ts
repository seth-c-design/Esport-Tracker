import { GoogleGenAI } from "@google/genai";
import { Player } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

interface MatchAnalysis {
  winPercentage: number;
  analysis: string;
}

export const analyzeMatch = async (playerName: string, opponentName: string, game: string): Promise<MatchAnalysis> => {
    const prompt = `
        Provide a detailed statistical analysis and win percentage prediction for an upcoming esports match.
        Player to analyze: "${playerName}"
        Opponent: "${opponentName}"
        Game: "${game}"

        Analyze recent performance, head-to-head history (if any), current form, map/agent/character pool strengths, and any other relevant competitive factors.
        Conclude with a win percentage for "${playerName}".

        Return the data as a valid JSON string in the following format. Do not include any other text, explanations, or markdown formatting around the JSON string.

        Example format:
        {
          "winPercentage": 65,
          "analysis": "Player A has a stronger record on the current map pool and has shown better form in recent tournaments, giving them the edge. Their head-to-head is 2-1."
        }
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro",
            contents: prompt,
            config: {
                thinkingConfig: { thinkingBudget: 32768 },
            },
        });

        const textResponse = response.text.trim();
        const jsonString = textResponse.replace(/^```json\s*|```\s*$/g, '');
        const data: MatchAnalysis = JSON.parse(jsonString);
        return data;
    } catch (error) {
        console.error("Error analyzing match with Gemini:", error);
        throw new Error("Failed to analyze match. The AI model may have returned an unexpected format.");
    }
};

export const fetchPlayerSchedules = async (playerNames: string[]): Promise<Player[]> => {
  const playerSources: Record<string, string> = {
    "Boki": "https://esoccerbet.org/fifa-8-minutes/boki/",
    "Donatello": "https://esoccerbet.org/fifa-8-minutes/Donatello/",
    "Vinniepuh": "https://esoccerbet.org/fifa-8-minutes/v1nniepuh/"
  };

  const sourcesString = playerNames
    .filter(name => playerSources[name])
    .map(name => `- ${name}: ${playerSources[name]}`)
    .join('\n');
    
  const prompt = `
    Use the following websites as the primary source of truth to find match schedules for these esports players:
    ${sourcesString}

    For each player, find their match schedules for the game they play (e.g., FIFA 8 minutes).
    For each player, provide their name and a list of their matches including:
    1. Any matches finished in the last 24 hours.
    2. Any matches that are currently live.
    3. All upcoming matches scheduled for the next 7 days.
    
    For each match, include the opponent, the tournament name, the game being played, and the match date/time in UTC ISO 8601 format.
    Crucially, for each match, determine its status based on the current time and information from the provided websites. The status must be one of: 'upcoming', 'live', or 'finished'.
    For 'finished' matches, please include a "result" field with the value 'win', 'loss', or 'draw' for the tracked player, based on the scores on the website. If the result cannot be determined, set "result" to null.
    For 'live' matches, please also include a "streamUrl" field with a link to a plausible live stream on a platform like Twitch or YouTube. If a stream URL cannot be found, set "streamUrl" to null.

    Return the data as a valid JSON string in the following format. Do not include any other text, explanations, or markdown formatting around the JSON string.

    Example format:
    [
      {
        "name": "Boki",
        "schedule": [
          { "opponent": "OpponentName", "tournament": "TournamentName", "game": "FIFA", "dateTime": "YYYY-MM-DDTHH:MM:SSZ", "status": "live", "streamUrl": "https://www.twitch.tv/example_stream", "result": null },
          { "opponent": "AnotherOpponent", "tournament": "AnotherTournament", "game": "FIFA", "dateTime": "YYYY-MM-DDTHH:MM:SSZ", "status": "upcoming", "streamUrl": null, "result": null },
          { "opponent": "PastOpponent", "tournament": "PastTournament", "game": "FIFA", "dateTime": "YYYY-MM-DDTHH:MM:SSZ", "status": "finished", "streamUrl": null, "result": "win" }
        ]
      },
      {
        "name": "Donatello",
        "schedule": []
      }
    ]

    If no relevant matches are found for a player, return an empty "schedule" array for them.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        thinkingConfig: { thinkingBudget: 32768 },
      },
    });

    const textResponse = response.text.trim();
    // Clean the response to ensure it's valid JSON
    const jsonString = textResponse.replace(/^```json\s*|```\s*$/g, '');
    const data: Player[] = JSON.parse(jsonString);
    return data;
  } catch (error) {
    console.error("Error fetching player schedules from Gemini:", error);
    throw new Error("Failed to fetch or parse player schedules. The AI model may have returned an unexpected format.");
  }
};
export interface Match {
  opponent: string;
  tournament: string;
  game: string;
  dateTime: string; // ISO 8601 string
  status: 'upcoming' | 'live' | 'finished';
  streamUrl?: string | null;
  result?: 'win' | 'loss' | 'draw' | null;
}

export interface Player {
  name: string;
  schedule: Match[];
}
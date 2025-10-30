import LeaderboardTable from '../LeaderboardTable';

export default function LeaderboardTableExample() {
  const mockTeams = [
    { id: 1, name: 'Team Alpha', navCurrent: 15.75, pitchTotal: 12, emotionTotal: 8 },
    { id: 2, name: 'Team Beta', navCurrent: 14.20, pitchTotal: 10, emotionTotal: 11 },
    { id: 3, name: 'Team Gamma', navCurrent: 13.45, pitchTotal: 9, emotionTotal: 9 },
    { id: 4, name: 'Team Delta', navCurrent: 12.80, pitchTotal: 11, emotionTotal: 7 },
  ];

  return <LeaderboardTable teams={mockTeams} />;
}

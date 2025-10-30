import TeamConfigCard from '../TeamConfigCard';

export default function TeamConfigCardExample() {
  const mockTeam = { id: 1, name: 'Team Alpha', navCurrent: 15.75 };

  return (
    <TeamConfigCard
      team={mockTeam}
      onUpdate={(id, name) => console.log('Update team:', id, name)}
      onDelete={(id) => console.log('Delete team:', id)}
      onResetNav={(id) => console.log('Reset NAV:', id)}
    />
  );
}

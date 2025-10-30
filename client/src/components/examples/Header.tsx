import Header from '../Header';

export default function HeaderExample() {
  return (
    <Header 
      currentRound={3}
      onNewRound={() => console.log('Start next round clicked')}
      onConfigureTeams={() => console.log('Configure teams clicked')}
      onNewGame={() => console.log('New game clicked')}
    />
  );
}

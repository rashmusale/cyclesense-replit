import { useState } from 'react';
import RoundInputCard from '../RoundInputCard';

export default function RoundInputCardExample() {
  const [data, setData] = useState({
    allocationEquity: 40,
    allocationDebt: 30,
    allocationGold: 20,
    allocationCash: 10,
    rebalancePct: 5,
    emotionToken: 'Confidence',
    pitchPoints: 3,
    emotionPoints: 4,
    portfolioReturn: 2.5,
  });

  return (
    <RoundInputCard
      teamId={1}
      teamName="Team Alpha"
      data={data}
      onChange={(_, newData) => setData(newData)}
    />
  );
}

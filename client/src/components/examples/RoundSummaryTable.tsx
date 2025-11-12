import RoundSummaryTable from '../RoundSummaryTable';

export default function RoundSummaryTableExample() {
  const mockResults = [
    {
      teamName: 'Team Alpha',
      navBefore: 12.50,
      portfolioReturn: 2.5,
      pitchPoints: 4,
      navAfter: 15.81,
    },
    {
      teamName: 'Team Beta',
      navBefore: 11.00,
      portfolioReturn: -1.0,
      pitchPoints: 3,
      navAfter: 17.89,
    },
  ];

  return <RoundSummaryTable results={mockResults} />;
}

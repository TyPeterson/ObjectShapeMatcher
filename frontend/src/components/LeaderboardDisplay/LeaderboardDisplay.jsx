import React, { useEffect, useState } from 'react';
import './LeaderboardDisplay.css';

const LeaderboardDisplay = () => {
  const [rankingTotals, setRankingTotals] = useState(null);

  useEffect(() => {
    const fetchRankings = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/rankings/get');
        const data = await response.json();
        setRankingTotals(data.rankingTotals);
      } catch (error) {
        console.error('Error fetching rankings:', error);
      }
    };

    fetchRankings();
  }, []);

  const getSortedRankings = () => {
    if (!rankingTotals) return [];
    const entries = Object.entries(rankingTotals);
    return entries.sort((a, b) => a[1] - b[1]);
  };

  const sortedRankings = getSortedRankings();

  const getTrophyImage = (index) => {
    switch (index) {
      case 0:
        return '/icons/1st-place.png';
      case 1:
        return '/icons/2nd-place.png';
      case 2:
        return '/icons/3rd-place.png';
      default:
        return null;
    }
  };

  return (
    <div className="leaderboard">
      <h2>Leaderboard</h2>
      <div className="podium">
        {sortedRankings.map(([method], index) => (
          <div key={method} className={`podium-step step-${index + 1}`}>
            {index < 3 ? (
              <img src={getTrophyImage(index)} alt={`trophy ${index + 1}`} className="trophy-icon" />
            ) : (
              <p>__<u>{index + 1}</u>__</p>
            )}
            <p>{method}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LeaderboardDisplay;

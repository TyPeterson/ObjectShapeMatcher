import React from 'react';
import './RankingDisplay.css';

const RankingDisplay = ({ resultString, totalResults, selectedRank, onRankingSelect }) => {
  const ranks = Array.from({ length: totalResults }, (_, i) => i + 1);

  return (
    <div className="ranking-display">
      {ranks.map(rank => (
        <button
          key={rank}
          className={`rank-button ${selectedRank === rank ? 'selected' : ''}`}
          onClick={() => onRankingSelect(resultString, rank)}
        >
          {rank}
        </button>
      ))}
    </div>
  );
};

export default RankingDisplay;

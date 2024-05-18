import React, { useState } from 'react';
import './RankingDisplay.css';

const RankingDisplay = ({ results, categoryId, selectedRanks, onRankingSelect }) => {
  const [draggedResult, setDraggedResult] = useState(null);
  const [draggedFromRank, setDraggedFromRank] = useState(null);

  const handleDragStart = (result, rank = null) => {
    setDraggedResult(result);
    setDraggedFromRank(rank);
  };

  const handleDrop = (rank) => {
    if (draggedResult) {
      if (draggedFromRank) {
        onRankingSelect(draggedResult, rank, draggedFromRank);
      } else {
        onRankingSelect(draggedResult, rank);
      }
      setDraggedResult(null);
      setDraggedFromRank(null);
    }
  };

  const remainingResults = results.filter(({ result }) => !Object.keys(selectedRanks).includes(result.most_similar));

  return (
    <div className="ranking-container">
      <h3>Rank the Results</h3>
      <div className="results-grid">
        {remainingResults.map(({ result }) => (
          <div
            key={result.most_similar}
            className="result-item"
            draggable
            onDragStart={() => handleDragStart(result.most_similar)}
          >
            <img src={`/${categoryId}_images/${result.most_similar}.png`} alt={result.most_similar} />
            <p>{result.most_similar}</p>
          </div>
        ))}
      </div>
      <div className="rankings-grid">
        {results.map((_, index) => (
          <div
            key={index}
            className="ranking-slot"
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(index + 1)}
          >
            <p>{index + 1}</p>
            {Object.keys(selectedRanks).find(key => selectedRanks[key] === index + 1) && (
              <div
                className="ranked-result"
                draggable
                onDragStart={() => handleDragStart(Object.keys(selectedRanks).find(key => selectedRanks[key] === index + 1), index + 1)}
              >
                <img
                  src={`/${categoryId}_images/${Object.keys(selectedRanks).find(key => selectedRanks[key] === index + 1)}.png`}
                  alt={Object.keys(selectedRanks).find(key => selectedRanks[key] === index + 1)}
                />
                <p>{Object.keys(selectedRanks).find(key => selectedRanks[key] === index + 1)}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RankingDisplay;

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
      onRankingSelect(draggedResult, rank, draggedFromRank);
      setDraggedResult(null);
      setDraggedFromRank(null);
    }
  };

  const handleResultDrop = () => {
    if (draggedResult && draggedFromRank !== null) {
      onRankingSelect(draggedResult, null, draggedFromRank);
      setDraggedResult(null);
      setDraggedFromRank(null);
    }
  };

  const numResults = results.length;
  const resultItemWidth = Math.min(25, (100 / (numResults + 1)));

  const getBackgroundColor = (index) => {
    switch (index) {
      case 0:
        return "#ffe867";
      case 1:
        return "#cccbcb";
      case 2:
        return "#e7b380";
      default:
        return "#eebdf5";
    }
  };

  const getBorderColor = (index) => {
    switch (index) {
      case 0:
        return "#ffcc00";
      case 1:
        return "#bfbfbf";
      case 2:
        return "#ff9933";
      default:
        return "#ff66cc";
    }
  }

  return (
    <div className="ranking-container">
      <h3>Rank the Results</h3>
      <div className="results-grid" style={{ '--result-item-width': `${resultItemWidth}%` }}>
        {results.map(({ result }) => (
          <div
            key={result.most_similar}
            className="result-item"
            draggable={!Object.keys(selectedRanks).includes(result.most_similar)}
            onDragStart={() => handleDragStart(result.most_similar)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleResultDrop}
            style={{ cursor: Object.keys(selectedRanks).includes(result.most_similar) ? 'not-allowed' : 'grab', backgroundColor: Object.keys(selectedRanks).includes(result.most_similar) ? '#e0e0e0' : 'inherit' }}
          >
            <img
              style={{
                opacity: Object.keys(selectedRanks).includes(result.most_similar) ? 0 : 1,
                cursor: Object.keys(selectedRanks).includes(result.most_similar) ? 'not-allowed' : 'grab',
              }}
              src={`/${categoryId}_images/${result.most_similar}.png`} alt={result.most_similar} />
            <p
              style={{
                opacity: Object.keys(selectedRanks).includes(result.most_similar) ? 0 : 1,
                cursor: Object.keys(selectedRanks).includes(result.most_similar) ? 'not-allowed' : 'grab',
              }}>
              {result.most_similar}
            </p>
          </div>
        ))}
      </div>
      <div className="rankings-grid" style={{ '--result-item-width': `${resultItemWidth}%` }}>
        {results.map((_, index) => (
          <div
            key={index}
            className="ranking-slot"
            style={{ backgroundColor: getBackgroundColor(index), borderColor: getBorderColor(index), borderStyle: 'solid' }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(index + 1)}
          >
            <p>{index + 1}{index === 0 ? 'st' : index === 1 ? 'nd' : index === 2 ? 'rd' : 'th'}</p>
            {Object.keys(selectedRanks).find(key => selectedRanks[key] === index + 1) && (
              <div
                className="ranked-result"
                draggable
                onDragStart={() => handleDragStart(
                  Object.keys(selectedRanks).find(key => selectedRanks[key] === index + 1),
                  index + 1
                )}
              >
                <img
                  src={`/${categoryId}_images/${Object.keys(selectedRanks).find(key => selectedRanks[key] === index + 1)}.png`}
                  alt={Object.keys(selectedRanks).find(key => selectedRanks[key] === index + 1)}
                />
                <p>
                  {Object.keys(selectedRanks).find(key => selectedRanks[key] === index + 1)}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RankingDisplay;

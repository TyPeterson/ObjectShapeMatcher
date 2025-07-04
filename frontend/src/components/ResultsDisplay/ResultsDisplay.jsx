import React from 'react';
import './ResultsDisplay.css';

const ResultsDisplay = ({ resultString, maskUrl, categoryId, objectType, compareMethods }) => {
  // Correct the path to be relative from the public folder
  const resultImageUrl = `/${categoryId}_images/${resultString}.png`;

  return (
    <div className="results-display">
      {resultString && (
        <div>
          {/* <p>Comparison result: <i>{resultString}</i></p> */}
          <div className="images-container">
            <div className="image-item">
              {maskUrl && <img src={maskUrl} alt="Mask" className="result-image" />}
              <p>{objectType}</p>
            </div>
            <div className="image-item">
              <img src={resultImageUrl} alt="Result" className="result-image" />
              <p>{resultString}</p>
            </div>
          </div>
          <p className = "methods-text">Methods: <i>{compareMethods.join(', ')}</i></p>
        </div>
      )}
    </div>
  );
};

export default ResultsDisplay;

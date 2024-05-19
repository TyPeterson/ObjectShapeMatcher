import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import ImageUploader from './components/ImageUploader/ImageUploader';
import ImageDisplay from './components/ImageDisplay/ImageDisplay';
import CategorySelector from './components/CategorySelector/CategorySelector';
import CompareMethodSelector from './components/CompareMethodSelector/CompareMethodSelector';
import ResultsDisplay from './components/ResultsDisplay/ResultsDisplay';
import LoadingIndicator from './components/LoadingIndicator/LoadingIndicator';
import RankingDisplay from './components/RankingDisplay/RankingDisplay';
import LeaderboardDisplay from './components/LeaderboardDisplay/LeaderboardDisplay';
import { compareObjects, submitRankings } from './services/api';
import './App.css';

const App = () => {
  const [sessionId, setSessionId] = useState('');

  useEffect(() => {
    // Check if a session ID already exists in localStorage
    let storedSessionId = localStorage.getItem('sessionId');
    if (!storedSessionId) {
      // If not, generate a new UUID and store it in localStorage
      storedSessionId = uuidv4();
      localStorage.setItem('sessionId', storedSessionId);
    }
    setSessionId(storedSessionId);
  }, []);

  const [imageData, setImageData] = useState(null);
  const [selectedObject, setSelectedObject] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [comparisonResults, setComparisonResults] = useState([]);
  const [comparisonCategory, setComparisonCategory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [rankings, setRankings] = useState({});
  const [compareAllSelected, setCompareAllSelected] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [currentCombination, setCurrentCombination] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [scrollToLeaderboard, setScrollToLeaderboard] = useState(false);

  const leaderboardRef = useRef(null);

  useEffect(() => {
    setSubmitted(false);
    if (selectedObject && selectedCategory) {
      setCurrentCombination(`${selectedObject.object_id}-${selectedCategory.id}`);
    } else {
      setCurrentCombination('');
    }
  }, [selectedObject, selectedCategory]);

  useEffect(() => {
    if (scrollToLeaderboard && leaderboardRef.current) {
      leaderboardRef.current.scrollIntoView({ behavior: 'smooth' });
      setScrollToLeaderboard(false);
    }
  }, [scrollToLeaderboard]);

  const handleImageProcessed = (data) => {
    setImageData(data);
    setSelectedObject(null);
    setSelectedCategory(null);
    setSelectedMethod(null);
    setComparisonResults([]);
    setComparisonCategory(null);
    setRankings({});
    setCompareAllSelected(false);
    setSubmitted(false);
    setLoading(false);
    setIsProcessing(false);
    setShowLeaderboard(false);
    setCurrentCombination('');
  };

  const handleSelectObject = (object) => {
    setSelectedObject(object);
  };

  const handleSelectCategory = (category) => {
    setSelectedCategory(category);
  };

  const handleSelectMethod = (method) => {
    setSelectedMethod(method);
  };

  const handleCompare = async () => {
    if (selectedObject && selectedCategory && selectedMethod) {
      setLoading(true);

      if (selectedMethod.id === 'compare_all') {
        const methods = ['hamming', 'ssim', 'chamfer', 'hausdorff', 'dice', 'jaccard'];
        const comparePromises = methods.map(method =>
          compareObjects(
            selectedObject.mask_coords,
            selectedCategory.id,
            selectedObject.object_id,
            imageData.file_name,
            method
          ).then(result => ({ method, result }))
        );

        const results = await Promise.all(comparePromises);
        const resultsByMethod = results.reduce((acc, { method, result }) => {
          acc[method] = result;
          return acc;
        }, {});

        const uniqueResults = groupUniqueResults(resultsByMethod, selectedObject.object_type);
        setComparisonResults(uniqueResults);
        setCompareAllSelected(true);
        setRankings(prev => ({ ...prev, [currentCombination]: {} }));
      } else {
        const result = await compareObjects(
          selectedObject.mask_coords,
          selectedCategory.id,
          selectedObject.object_id,
          imageData.file_name,
          selectedMethod.id
        );
        setComparisonResults([{ result, methods: [selectedMethod.name], objectType: selectedObject.object_type }]);
        setCompareAllSelected(false);
        setSubmitted(false);
      }

      setComparisonCategory(selectedCategory.id);
      setLoading(false);
    }
  };

  const groupUniqueResults = (results, objectType) => {
    const uniqueResults = {};
    for (const [method, result] of Object.entries(results)) {
      if (!uniqueResults[result.most_similar]) {
        uniqueResults[result.most_similar] = {
          result,
          methods: [method],
          objectType
        };
      } else {
        uniqueResults[result.most_similar].methods.push(method);
      }
    }
    return Object.values(uniqueResults);
  };

  const handleRankingSelect = (resultString, rank, prevRank = null) => {
    setRankings(prev => {
      const newRankings = { ...prev };
      const currentRankings = newRankings[currentCombination] || {};

      if (prevRank) {
        delete currentRankings[Object.keys(currentRankings).find(key => currentRankings[key] === prevRank)];
      }

      Object.keys(currentRankings).forEach(key => {
        if (currentRankings[key] === rank) {
          delete currentRankings[key];
        }
      });

      if (rank !== null) {
        currentRankings[resultString] = rank;
      }

      newRankings[currentCombination] = currentRankings;
      return newRankings;
    });
  };

  const isSubmitDisabled = Object.keys(rankings[currentCombination] || {}).length !== comparisonResults.length;

  const handleSubmitRankings = async () => {
    const methodRankings = {};

    Object.entries(rankings[currentCombination]).forEach(([resultString, rank]) => {
      const methods = comparisonResults.find(r => r.result.most_similar === resultString).methods;
      methods.forEach(method => {
        methodRankings[method] = rank;
      });
    });

    const rankingsData = {
      session_id: sessionId,
      image_file_name: imageData.file_name,
      object_id: selectedObject.object_id,
      category_id: selectedCategory.id,
      rankings: methodRankings
    };

    const response = await submitRankings(rankingsData);

    if (response.status === 'success') {
      setSubmitted(true);
      setShowLeaderboard(true);
      setScrollToLeaderboard(true);
    }
  };

  const isCompareButtonDisabled = !(selectedObject && selectedCategory && selectedMethod);

  return (
    <div className="App">
      <header className="app-header">
        <h1>Image Object Selector</h1>
      </header>
      <main className="app-main">
        <ImageUploader onImageProcessed={handleImageProcessed} setLoading={setIsProcessing} />
        {isProcessing && <LoadingIndicator message="Detecting Objects" />}
        {imageData && (
          <>
            <ImageDisplay
              imageData={imageData}
              onSelectObject={handleSelectObject}
              isProcessing={isProcessing}
            />
            <CategorySelector
              selectedCategory={selectedCategory}
              onSelectCategory={handleSelectCategory}
            />
            <CompareMethodSelector
              selectedMethod={selectedMethod}
              onSelectMethod={handleSelectMethod}
            />
            <button
              className={`compare-button ${isCompareButtonDisabled ? 'disabled' : ''}`}
              onClick={handleCompare}
              disabled={isCompareButtonDisabled}
            >
              Compare
            </button>
            {isCompareButtonDisabled && (
              <p className="validation-message">Select a valid object, category, and method to compare</p>
            )}
          </>
        )}
        {loading && <LoadingIndicator message="Getting Comparisons" />}
        {!loading && comparisonResults.length > 0 && (
          <div className="results-container">
            {comparisonResults.map(({ result, methods, objectType }, index) => (
              <div key={index} className="result-with-ranking">
                <ResultsDisplay
                  resultString={result.most_similar}
                  maskUrl={result.mask_url}
                  categoryId={comparisonCategory}
                  objectType={objectType}
                  compareMethods={methods}
                />
              </div>
            ))}
            {compareAllSelected && comparisonResults.length > 1 && (
              <>
                <RankingDisplay
                  results={comparisonResults}
                  categoryId={comparisonCategory}
                  selectedRanks={rankings[currentCombination] || {}}
                  onRankingSelect={handleRankingSelect}
                />
                <button
                  className={`submit-rankings-button ${isSubmitDisabled ? 'disabled' : submitted ? 'submitted' : ''}`}
                  onClick={handleSubmitRankings}
                  disabled={isSubmitDisabled}
                >
                  {submitted ? 'Submitted!' : 'Submit Rankings'}
                </button>
              </>
            )}
          </div>
        )}
        {showLeaderboard && <div ref={leaderboardRef}><LeaderboardDisplay /></div>}
      </main>
    </div>
  );
};

export default App;

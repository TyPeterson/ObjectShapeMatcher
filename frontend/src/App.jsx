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
  const [comparisonResults, setComparisonResults] = useState([]); // Initialize as an array
  const [comparisonCategory, setComparisonCategory] = useState(null); // Preserve the category ID used for comparison
  const [loading, setLoading] = useState(false); // Add loading state
  const [rankings, setRankings] = useState({}); // Initialize rankings as an object
  const [compareAllSelected, setCompareAllSelected] = useState(false); // Track if compare_all is selected
  const [submitted, setSubmitted] = useState(false); // Track if rankings are submitted
  const [currentCombination, setCurrentCombination] = useState(''); // Track current object-category combination
  const [isProcessing, setIsProcessing] = useState(false); // Add isProcessing state
  const [showLeaderboard, setShowLeaderboard] = useState(false); // Track if leaderboard should be shown
  const [scrollToLeaderboard, setScrollToLeaderboard] = useState(false); // Track if we should scroll to leaderboard

  const leaderboardRef = useRef(null);

  useEffect(() => {
    setSubmitted(false); // Reset submitted state
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
    console.log("Image processed data:", data);
    setImageData(data);
    setSelectedObject(null);
    setSelectedCategory(null);
    setSelectedMethod(null);
    setComparisonResults([]);
    setComparisonCategory(null); // Reset comparison category
    setRankings({});
    setCompareAllSelected(false);
    setSubmitted(false); // Reset submitted state
    setLoading(false);
    setIsProcessing(false); // Reset processing state
    setShowLeaderboard(false); // Hide leaderboard when a new image is processed
    setCurrentCombination(''); // Reset current combination
  };

  const handleSelectObject = (object) => {
    console.log("Selected Object:", object);
    setSelectedObject(object);
  };

  const handleSelectCategory = (category) => {
    console.log("Selected Category:", category);
    setSelectedCategory(category);
  };

  const handleSelectMethod = (method) => {
    console.log("Selected Method:", method);
    setSelectedMethod(method);
  };

  const handleCompare = async () => {
    if (selectedObject && selectedCategory && selectedMethod) {
      console.log("Comparing:", selectedObject, selectedCategory, selectedMethod);
      setLoading(true); // Set loading state to true

      if (selectedMethod.id === 'compare_all') {
        // Compare using all methods simultaneously
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

        console.log("Comparison results (all methods):", resultsByMethod);
        const uniqueResults = groupUniqueResults(resultsByMethod, selectedObject.object_type);
        setComparisonResults(uniqueResults); // Store all results as an array
        setCompareAllSelected(true); // Set compare_all as selected
        setRankings(prev => ({ ...prev, [currentCombination]: {} })); // Reset rankings for current combination
      } else {
        // Compare using a single method
        const result = await compareObjects(
          selectedObject.mask_coords,
          selectedCategory.id,
          selectedObject.object_id,
          imageData.file_name,
          selectedMethod.id
        );
        console.log("Comparison result:", result);
        setComparisonResults([{ result, methods: [selectedMethod.name], objectType: selectedObject.object_type }]); // Store single result as an array
        setCompareAllSelected(false); // Set compare_all as not selected
        setSubmitted(false); // Reset submitted state
      }

      setComparisonCategory(selectedCategory.id); // Preserve the category ID used for comparison
      setLoading(false); // Set loading state to false
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

      // If there was a previous rank, remove it
      if (prevRank) {
        delete currentRankings[Object.keys(currentRankings).find(key => currentRankings[key] === prevRank)];
      }

      // Remove the rank from any result that currently has it
      Object.keys(currentRankings).forEach(key => {
        if (currentRankings[key] === rank) {
          delete currentRankings[key];
        }
      });

      // If rank is null, it means it should be moved to results-grid
      if (rank !== null) {
        // Set the rank for the selected result
        currentRankings[resultString] = rank;
      }

      newRankings[currentCombination] = currentRankings;
      console.log(`Updated rankings:`, newRankings[currentCombination]); // Log updated rankings
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
      session_id: sessionId, // Include the unique session ID
      image_file_name: imageData.file_name,
      object_id: selectedObject.object_id,
      category_id: selectedCategory.id,
      rankings: methodRankings
    };

    const response = await submitRankings(rankingsData);

    if (response.status === 'success') {
      // Change button text and color
      setSubmitted(true);
      setShowLeaderboard(true); // Show leaderboard after successful submission
      setScrollToLeaderboard(true); // Set flag to scroll to leaderboard
    }
  };

  const isCompareButtonDisabled = !(selectedObject && selectedCategory && selectedMethod);

  return (
    <div className="App">
      <h1>Image Object Selector</h1>
      <ImageUploader onImageProcessed={handleImageProcessed} setLoading={setIsProcessing} />
      {isProcessing && <LoadingIndicator message='Detecting Objects'/>} {/* Conditionally render loading indicator */}
      {imageData && (
        <>
          <ImageDisplay
            imageData={imageData}
            onSelectObject={handleSelectObject}
            isProcessing={isProcessing} // Pass isProcessing state
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
          {loading && <LoadingIndicator message="Getting Comparisons" />} {/* Conditionally render loading indicator */}
          {!loading && comparisonResults.length > 0 && (
          <div className="results-container">
            {comparisonResults.map(({ result, methods, objectType }, index) => (
            <div key={index} className="result-with-ranking">
              <ResultsDisplay 
              resultString={result.most_similar} 
              maskUrl={result.mask_url} 
              categoryId={comparisonCategory} // Use preserved comparison category ID
                objectType={objectType} // Use preserved object type
                compareMethods={methods} // Pass compareMethods used in the comparison
              />
            </div>
          ))}
          {compareAllSelected && comparisonResults.length > 1 && (
            <>
              <RankingDisplay
                results={comparisonResults}
                categoryId={comparisonCategory} // Use preserved comparison category ID
                selectedRanks={rankings[currentCombination] || {}}
                onRankingSelect={handleRankingSelect}
              />
              <button
                className={`submit-rankings-button ${isSubmitDisabled ? 'disabled' : submitted ? 'submitted' : ''}`}
                onClick={handleSubmitRankings}
                disabled={isSubmitDisabled}
                style={{ cursor: submitted ? 'not-allowed' : 'pointer', backgroundColor: submitted ? '#4CAF50' : ''}}
              >
                {submitted ? 'Submitted!' : 'Submit Rankings'}
              </button>
            </>
          )}
        </div>
      )}
      {showLeaderboard && <div ref={leaderboardRef}><LeaderboardDisplay /></div>}
    </div>
  );
};

export default App;

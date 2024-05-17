import React from 'react';
import './CompareMethodSelector.css';

const compareMethods = [
  { id: 'hamming', name: 'Hamming', thumbnail: '/hamming-thumbnail.webp' },
  { id: 'ssim', name: 'SSIM', thumbnail: '/ssim-thumbnail.webp' },
  { id: 'chamfer', name: 'Chamfer', thumbnail: '/chamfer-thumbnail.png' },
  { id: 'hausdorff', name: 'Hausdorff', thumbnail: '/hausdorff-thumbnail.webp' },
  { id: 'dice', name: 'Dice', thumbnail: '/dice-thumbnail.png' },
  { id: 'jaccard', name: 'Jaccard', thumbnail: '/jaccard-thumbnail.png' },
  { id: 'compare_all', name: 'Compare All', thumbnail: '/compare-thumbnail.png' }
];

const CompareMethodSelector = ({ selectedMethod, onSelectMethod }) => {
  return (
    <div className="compare-method-selector">
      {compareMethods.map(method => (
        <div 
          key={method.id} 
          className={`compare-method-item ${selectedMethod && selectedMethod.id === method.id ? 'selected' : ''}`}
          onClick={() => onSelectMethod(method)}
        >
          <img src={method.thumbnail} alt={method.name} className="compare-method-thumbnail" />
          <p>{method.name}</p>
        </div>
      ))}
    </div>
  );
};

export default CompareMethodSelector;

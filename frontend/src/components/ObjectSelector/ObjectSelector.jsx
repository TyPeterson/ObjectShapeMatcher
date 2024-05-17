// src/components/ObjectSelector/ObjectSelector.jsx

import React from 'react';
import './ObjectSelector.css';

const ObjectSelector = ({ objects, onSelectObject }) => {
  return (
    <div className="object-selector">
      {objects.map(obj => (
        <button key={obj.id} onClick={() => onSelectObject(obj.id)}>
          {obj.name}
        </button>
      ))}
    </div>
  );
};

export default ObjectSelector;

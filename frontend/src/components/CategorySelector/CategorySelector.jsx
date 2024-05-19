import React from 'react';
import './CategorySelector.css';

const categories = [
  { id: 'countries', name: 'Countries', thumbnail: '/world-countries-thumbnail.jpg' },
  { id: 'us_states', name: 'U.S. States', thumbnail: '/states-thumbnail.jpg' },
  { id: 'lakes_and_reservoirs', name: 'Lakes', thumbnail: '/lakes-thumbnail.jpg' },
];

const CategorySelector = ({ selectedCategory, onSelectCategory }) => {
  return (
    <div className="category-selector">
      {categories.map(category => (
        <div 
          key={category.id} 
          className={`category-item ${selectedCategory && selectedCategory.id === category.id ? 'selected' : ''}`}
          onClick={() => onSelectCategory(category)}
        >
          <img src={category.thumbnail} alt={category.name} className="category-thumbnail" />
          <p>{category.name}</p>
        </div>
      ))}
    </div>
  );
};

export default CategorySelector;

// CategorySelector.tsx
import React from 'react';
import { IPCategory } from '../util/interface';

interface CategorySelectorProps {
    selectedCategory: IPCategory | '';
    onCategoryChange: (category: IPCategory | '') => void;
}

const CategorySelector: React.FC<CategorySelectorProps> = ({ 
    selectedCategory, 
    onCategoryChange 
}) => {
    const selectorStyle = {
        padding: '8px',
        marginBottom: '20px',
        borderRadius: '4px',
        border: '1px solid #ccc',
        backgroundColor: 'white',
        minWidth: '200px',
        fontSize: '14px'
    };

    return (
        <div>
            <label htmlFor="category-select" style={{ marginRight: '10px' }}>
                Select Category:
            </label>
            <select 
                id="category-select"
                value={selectedCategory}
                onChange={(e) => onCategoryChange(e.target.value as IPCategory | '')}
                style={selectorStyle}
            >
                <option value="">All Traffic</option>
                {Object.values(IPCategory).map(category => (
                    <option key={category} value={category}>
                        {category.replace('_', ' ')}
                    </option>
                ))}
            </select>
        </div>
    );
};

export default CategorySelector;
import React from 'react';

interface CategoryFilterProps {
  label?: string; // e.g. "Genre"
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  className?: string;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  label,
  categories,
  selectedCategory,
  onSelectCategory,
  className = '',
}) => {
  return (
    <div className={`flex items-center flex-wrap gap-2 text-xs sm:text-sm select-none ${className}`}>
      {label && (
        <span className="text-neutral-400 font-medium mr-1 tracking-wide">
          {label}
        </span>
      )}
      <div className="flex items-center flex-wrap gap-2">
        {categories.map((cat) => {
          const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase();
          return (
            <button
              key={cat}
              onClick={() => onSelectCategory(cat)}
              className={`px-3.5 py-1 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer ${
                isSelected
                  ? 'border border-white/40 bg-white/15 text-white shadow-sm shadow-white/5'
                  : 'border border-white/10 bg-transparent text-neutral-400 hover:text-neutral-200 hover:border-white/25'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>
    </div>
  );
};

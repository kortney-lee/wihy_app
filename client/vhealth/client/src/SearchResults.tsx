import React from 'react';
import './assets/styles/SearchResults.css';

const SearchResults: React.FC = () => {
    return (
        <div className="results-page">
            <header className="results-header">
                <h1>Search Results</h1>
                <p>Here are the results for your search:</p>
            </header>
            <div className="results-content">
                {/* Results will be rendered here */}
            </div>
        </div>
    );
};

export default SearchResults;
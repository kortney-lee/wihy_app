import React from 'react';
import './assets/styles/VHealthSearch.css';

const VHealthSearch: React.FC = () => {
    return (
        <div className="search-landing">
            <div className="search-container-centered">
                <h1 className="search-logo">vHealth</h1>
                <p className="search-tagline">Your health, your search.</p>
                <form className="search-form">
                    <div className="search-input-container">
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Search for health information..."
                        />
                        <div className="search-icons">
                            <button type="button" className="icon-button clear-button">
                                <svg> {/* Clear icon SVG */} </svg>
                            </button>
                            <button type="button" className="icon-button">
                                <svg> {/* Search icon SVG */} </svg>
                            </button>
                        </div>
                    </div>
                    <div className="search-actions">
                        <button type="submit" className="search-button">Search</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default VHealthSearch;
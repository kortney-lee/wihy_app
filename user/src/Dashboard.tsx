import React, { useCallback, useMemo, useRef, useState } from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import './Dashboard.css'; // Make sure case matches file name
import Sidebar from './components/Navigation/Sidebar';

/** ---------- tiny inline icons so we don't depend on a lib ---------- */
const Icon = {
  Search: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" {...props}><path fill="currentColor" d="M10 2a8 8 0 105.293 14.293l4.707 4.707 1.414-1.414-4.707-4.707A8 8 0 0010 2zm0 2a6 6 0 110 12A6 6 0 0110 4z"/></svg>
  ),
  Mic: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" {...props}><path fill="currentColor" d="M12 14a3 3 0 003-3V6a3 3 0 10-6 0v5a3 3 0 003 3zm5-3a5 5 0 01-10 0H5a7 7 0 0014 0h-2zM11 19h2v3h-2z"/></svg>
  ),
  Image: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" {...props}><path fill="currentColor" d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zm0 2v9.586l-3.293-3.293a1 1 0 00-1.414 0L10 15.586 7.707 13.293a1 1 0 00-1.414 0L5 14.586V5h14zM7 7a2 2 0 112 2 2 2 0 01-2-2z"/></svg>
  ),
  Close: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" {...props}><path fill="currentColor" d="M18.3 5.71L12 12.01l-6.29-6.3-1.42 1.42 6.3 6.29-6.3 6.29 1.42 1.42 6.29-6.3 6.29 6.3 1.42-1.42-6.3-6.29 6.3-6.29-1.42-1.42z"/></svg>
  ),
  Back: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" {...props}><path fill="currentColor" d="M20 11H7.83l5.58-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
  ),
  Upload: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" {...props}><path fill="currentColor" d="M5 20h14v-2H5v2zM12 2l-5 5h3v6h4V7h3l-5-5z"/></svg>
  ),
  Link: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" {...props}><path fill="currentColor" d="M3.9 12a5 5 0 015-5h3v2h-3a3 3 0 100 6h3v2h-3a5 5 0 01-5-5zm7.1 1h2v-2h-2v2zm4-6h3a5 5 0 010 10h-3v-2h3a3 3 0 000-6h-3V7z"/></svg>
  ),
};

/** ---------- helper types ---------- */
type Resource = { label: string; href: string };
type Topic = { label: string; value: string };

const RELATED_TOPICS: Topic[] = [
  { label: 'Healthy breakfast ideas', value: 'Healthy breakfast ideas' },
  { label: 'Low-sugar snacks', value: 'Low-sugar snacks' },
  { label: 'How to read food labels', value: 'How to read food labels' },
  { label: 'Macros vs. calories', value: 'Macros vs. calories' },
];

const RESOURCES: Resource[] = [
  { label: 'Nutrition 101 (guide)', href: '#' },
  { label: 'SNAP/EBT friendly groceries', href: '#' },
  { label: 'What Is Healthy? book', href: '#' },
  { label: 'Build-a-Plate template', href: '#' },
];

const SAMPLE_RESULT = `## What is healthy?

“Healthy” isn’t a brand label or a single macro number. It’s alignment:
- Whole or minimally processed foods most of the time
- Enough protein, fiber, and micronutrients
- Reasonable portions and patterns you can sustain
- Context: your goals, budget, culture, and time

**Quick wins**
1) Swap sugar drinks for water/tea
2) Add a fruit/veg to every plate
3) Build plates: Protein + Fiber + Color + Water
`;

/** ---------- Upload/Photo modal (uses your CSS classes) ---------- */
function UploadModal({
  open,
  onClose,
  onPickFile,
}: {
  open: boolean;
  onClose: () => void;
  onPickFile: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const [url, setUrl] = useState('');

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onPickFile(file);
  };

  if (!open) return null;
  return (
    <div className="upload-modal-overlay" onClick={onClose}>
      <div className="upload-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>Upload a photo</h2>
            <p className="modal-subtitle">Add a picture of food or a label.</p>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close upload modal">
            <Icon.Close width={20} height={20} />
          </button>
        </div>

        <div
          className={`upload-area${dragging ? ' dragging' : ''}`}
          onDragEnter={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragOver={(e) => e.preventDefault()}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <div className="upload-content">
            <div className="upload-icon">
              <Icon.Upload width={48} height={48} />
            </div>
            <p className="upload-text">Drag an image here, or</p>
            <button
              type="button"
              className="upload-link"
              onClick={() => inputRef.current?.click()}
            >
              choose a file
            </button>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onPickFile(f);
              }}
            />
          </div>
        </div>

        <div className="modal-divider">
          <span>or use a URL</span>
        </div>

        <div className="url-input-section">
          <input
            className="url-input"
            placeholder="Paste image URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <button
            className="search-button-modal"
            onClick={() => {
              // In a real app you’d fetch and attach the image.
              // Here we just close.
              onClose();
            }}
          >
            <Icon.Link width={16} height={16} style={{ marginRight: 8 }} />
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

/** ---------- Main Dashboard ---------- */
const Dashboard: React.FC = () => {
  const [query, setQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [listening, setListening] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [imageName, setImageName] = useState<string | null>(null);

  const canSearch = query.trim().length > 0 || !!imageName;

  const onSubmit = useCallback(
    (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      if (!canSearch) return;
      setShowResults(true);
      setListening(false);
    },
    [canSearch]
  );

  const onClear = () => {
    setQuery('');
    setImageName(null);
  };

  const onBack = () => setShowResults(false);

  const handlePickFile = (file: File) => {
    setImageName(file.name);
    setShowUpload(false);
  };

  const voiceBtnClass = useMemo(
    () => `icon-button ${listening ? 'listening' : ''}`,
    [listening]
  );

  /** ---------- Search Landing ---------- */
  if (!showResults) {
    return (
      <Router>
        <div className="search-landing">
          <Sidebar />
          <div className="search-container-centered search-container">
            {/* Optional logo area (respects your CSS override at the bottom) */}
            <div className="logo-container" style={{ marginBottom: 20 }}>
              {/* <img className="search-logo-image" src="/logo.svg" alt="vHealth" /> */}
              <h1 className="search-logo">vHealth</h1>
            </div>

            <p className="search-tagline">Search foods, habits, and real-world nutrition answers.</p>

            <form className="search-form" onSubmit={onSubmit}>
              <div className={`search-input-container${imageName ? ' with-image-wrap' : ''}`}>
                {imageName && (
                  <div className="image-preview" aria-label="Selected image">
                    <span className="image-icon">🖼️</span>
                    <span className="image-name" title={imageName}>{imageName}</span>
                    <button
                      type="button"
                      className="remove-image"
                      aria-label="Remove image"
                      onClick={() => setImageName(null)}
                    >
                      ×
                    </button>
                  </div>
                )}

                <input
                  className={`search-input ${imageName ? 'with-image' : ''}`}
                  placeholder="Ask about a food, label, or habit…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  aria-label="Search"
                />

                <div className="search-icons">
                  {query || imageName ? (
                    <button
                      type="button"
                      className="icon-button clear-button"
                      title="Clear"
                      onClick={onClear}
                    >
                      <Icon.Close />
                    </button>
                  ) : null}

                  <button
                    type="button"
                    className={voiceBtnClass}
                    title={listening ? 'Stop' : 'Voice search'}
                    onClick={() => setListening((s) => !s)}
                  >
                    <Icon.Mic />
                  </button>

                  <button
                    type="button"
                    className="icon-button"
                    title="Search by image"
                    onClick={() => setShowUpload(true)}
                  >
                    <Icon.Image />
                  </button>
                </div>
              </div>

              <div className="search-actions">
                <button className="search-btn" type="submit" disabled={!canSearch}>
                  <Icon.Search width={18} height={18} style={{ marginRight: 8 }} />
                  Search vHealth
                </button>
                <button
                  className="search-btn"
                  type="button"
                  onClick={() => {
                    setQuery('What is a balanced plate?');
                  }}
                >
                  I’m Feeling Curious
                </button>
              </div>
            </form>

            {/* voice feedback stub */}
            {listening && (
              <div className="voice-feedback" style={{ marginTop: 16, color: '#ea4335' }}>
                Listening… say “Scan the label on my granola bar”
              </div>
            )}
          </div>

          <UploadModal open={showUpload} onClose={() => setShowUpload(false)} onPickFile={handlePickFile} />
        </div>
      </Router>
    );
  }

  /** ---------- Results Page ---------- */
  return (
    <div className="results-page">
      {/* sticky search header */}
      <div className="results-search-header">
        <button className="back-button" onClick={onBack} aria-label="Back to search">
          <Icon.Back />
        </button>

        <form
          className="search-input-container"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
          style={{ maxWidth: 600 }}
        >
          {imageName && (
            <div className="image-preview" aria-label="Selected image">
              <span className="image-icon">🖼️</span>
              <span className="image-name" title={imageName}>{imageName}</span>
              <button type="button" className="remove-image" onClick={() => setImageName(null)}>
                ×
              </button>
            </div>
          )}
          <input
            className={`search-input results-search-input ${imageName ? 'with-image' : ''}`}
            placeholder="Refine your search…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Refine search"
          />
          <div className="search-icons">
            {(query || imageName) && (
              <button
                type="button"
                className="icon-button clear-button"
                title="Clear"
                onClick={onClear}
              >
                <Icon.Close />
              </button>
            )}
            <button
              type="button"
              className={voiceBtnClass}
              title={listening ? 'Stop' : 'Voice search'}
              onClick={() => setListening((s) => !s)}
            >
              <Icon.Mic />
            </button>
            <button
              type="button"
              className="icon-button"
              title="Search by image"
              onClick={() => setShowUpload(true)}
            >
              <Icon.Image />
            </button>
          </div>
        </form>
      </div>

      <div className="results-container">
        <div className="results-header">Results for “{query || 'your query'}”</div>

        <div className="results-content">
          {/* main column */}
          <div>
            <div className="health-info-card">
              <div className="health-info-content">
                <pre>{SAMPLE_RESULT}</pre>
              </div>
              <div className="data-source-indicator">
                Powered by vHealth Knowledge • <span className="error-source">Demo content</span>
              </div>
            </div>
          </div>

          {/* right sidebar */}
          <aside className="sidebar">
            <div className="related-topics-card">
              <h3>Related Topics</h3>
              <ul className="related-topics-list">
                {RELATED_TOPICS.map((t) => (
                  <li key={t.label}>
                    <button
                      className="topic-button"
                      onClick={() => {
                        setQuery(t.value);
                        // optionally resubmit: onSubmit();
                      }}
                    >
                      {t.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="resources-card">
              <h3>Resources</h3>
              <ul className="resources-list">
                {RESOURCES.map((r) => (
                  <li key={r.label}>
                    <a href={r.href} target="_blank" rel="noreferrer">
                      {r.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
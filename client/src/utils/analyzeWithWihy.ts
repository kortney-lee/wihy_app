/**
 * Analyze with WIHY Button - Utility Functions
 * Pure JavaScript implementation for adding WIHY analysis to any content
 */

import { WIHYClient } from '../services/wihyClientPure';

export interface AnalyzeWithWihyOptions {
  buttonText?: string;
  buttonClass?: string;
  modalId?: string;
  showModal?: boolean;
  onResponse?: (response: any) => void;
  onError?: (error: string) => void;
}

/**
 * Add "Analyze with WIHY" button to any element
 */
export function addAnalyzeWithWihyButton(
  element: HTMLElement,
  content: string,
  options: AnalyzeWithWihyOptions = {}
): HTMLButtonElement {
  const {
    buttonText = 'Analyze with Wihy',
    buttonClass = 'analyze-with-wihy-btn',
    showModal = true,
    onResponse,
    onError
  } = options;

  // Create button
  const button = document.createElement('button');
  button.textContent = buttonText;
  button.className = buttonClass;
  button.setAttribute('data-content', content);

  // Add click handler
  button.onclick = async () => {
    try {
      button.disabled = true;
      button.textContent = 'Analyzing...';

      const client = new WIHYClient();
      const response = await client.analyzeContent(content);

      if (onResponse) {
        onResponse(response);
      } else if (showModal) {
        showAnalysisModal(content, response);
      } else {
        // Default: show alert
        alert(`WIHY Analysis:\n\n${response.response}\n\nConfidence: ${Math.round(response.confidence * 100)}%`);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Analysis failed';
      
      if (onError) {
        onError(errorMessage);
      } else {
        alert(`Analysis failed: ${errorMessage}`);
      }
    } finally {
      button.disabled = false;
      button.textContent = buttonText;
    }
  };

  element.appendChild(button);
  return button;
}

/**
 * Setup all "Analyze with WIHY" buttons on a page
 */
export function setupAnalyzeButtons(options: AnalyzeWithWihyOptions = {}): void {
  // Find all elements with data-wihy-analyze attribute
  document.querySelectorAll('[data-wihy-analyze]').forEach(element => {
    const htmlElement = element as HTMLElement;
    const content = htmlElement.getAttribute('data-wihy-analyze') || 
                   htmlElement.getAttribute('data-content') ||
                   htmlElement.innerText;
    
    if (content && !htmlElement.querySelector('.analyze-with-wihy-btn')) {
      addAnalyzeWithWihyButton(htmlElement, content, options);
    }
  });

  // Find existing buttons and add functionality
  document.querySelectorAll('.analyze-with-wihy-btn').forEach(button => {
    const htmlButton = button as HTMLButtonElement;
    
    if (!htmlButton.onclick) {
      const content = htmlButton.getAttribute('data-content') ||
                     htmlButton.parentElement?.innerText ||
                     '';
      
      if (content) {
        htmlButton.onclick = async () => {
          try {
            htmlButton.disabled = true;
            const originalText = htmlButton.textContent;
            htmlButton.textContent = 'Analyzing...';

            const client = new WIHYClient();
            const response = await client.analyzeContent(content);

            if (options.onResponse) {
              options.onResponse(response);
            } else if (options.showModal !== false) {
              showAnalysisModal(content, response);
            }

          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Analysis failed';
            if (options.onError) {
              options.onError(errorMessage);
            } else {
              alert(`Analysis failed: ${errorMessage}`);
            }
          } finally {
            htmlButton.disabled = false;
            htmlButton.textContent = htmlButton.textContent?.replace('Analyzing...', 'Analyze with Wihy') || 'Analyze with Wihy';
          }
        };
      }
    }
  });
}

/**
 * Show analysis results in a modal
 */
function showAnalysisModal(content: string, response: any): void {
  // Remove existing modal if present
  const existingModal = document.getElementById('wihy-analysis-modal');
  if (existingModal) {
    existingModal.remove();
  }

  // Create modal
  const modal = document.createElement('div');
  modal.id = 'wihy-analysis-modal';
  modal.innerHTML = `
    <div class="wihy-modal-overlay">
      <div class="wihy-modal-content">
        <div class="wihy-modal-header">
          <h3>🤖 WIHY Analysis</h3>
          <button class="wihy-modal-close">&times;</button>
        </div>
        
        <div class="wihy-modal-body">
          <div class="original-content">
            <h4>Original Content:</h4>
            <p>${content.substring(0, 200)}${content.length > 200 ? '...' : ''}</p>
          </div>
          
          <div class="wihy-response">
            <h4>WIHY Analysis:</h4>
            <p>${response.response}</p>
          </div>
          
          <div class="wihy-metadata">
            <div class="metadata-item">
              <strong>Source:</strong> ${response.source}
            </div>
            <div class="metadata-item">
              <strong>Confidence:</strong> ${Math.round(response.confidence * 100)}%
            </div>
            <div class="metadata-item">
              <strong>Type:</strong> ${response.type}
            </div>
            ${response.processing_time ? `
              <div class="metadata-item">
                <strong>Processing Time:</strong> ${response.processing_time.toFixed(1)}s
              </div>
            ` : ''}
          </div>
          
          ${response.chart_data?.chart_metadata ? `
            <div class="wihy-research-data">
              <h4>📊 Research Analysis:</h4>
              <div class="research-grid">
                <div class="research-item">
                  <strong>Quality Score:</strong> 
                  ${response.chart_data.chart_metadata.research_quality_score}/100
                </div>
                <div class="research-item">
                  <strong>Evidence Grade:</strong> 
                  ${response.chart_data.chart_metadata.evidence_grade}
                </div>
                <div class="research-item">
                  <strong>Studies Analyzed:</strong> 
                  ${response.chart_data.chart_metadata.study_count}
                </div>
              </div>
            </div>
          ` : ''}
        </div>
        
        <div class="wihy-modal-footer">
          <button class="wihy-modal-btn wihy-modal-close-btn">Close</button>
          <button class="wihy-modal-btn wihy-modal-copy-btn">Copy Analysis</button>
        </div>
      </div>
    </div>
  `;

  // Add styles if not present
  if (!document.getElementById('wihy-modal-styles')) {
    const styles = document.createElement('style');
    styles.id = 'wihy-modal-styles';
    styles.textContent = `
      .wihy-modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
      }
      
      .wihy-modal-content {
        background: white;
        border-radius: 8px;
        max-width: 600px;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
      }
      
      .wihy-modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        border-bottom: 1px solid #eee;
      }
      
      .wihy-modal-close {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
      }
      
      .wihy-modal-body {
        padding: 1rem;
      }
      
      .wihy-modal-body h4 {
        margin: 1rem 0 0.5rem 0;
        color: #333;
      }
      
      .wihy-metadata {
        background: #f5f5f5;
        padding: 1rem;
        border-radius: 4px;
        margin: 1rem 0;
      }
      
      .metadata-item {
        margin: 0.5rem 0;
      }
      
      .wihy-research-data {
        background: #e8f4fd;
        padding: 1rem;
        border-radius: 4px;
        margin: 1rem 0;
      }
      
      .research-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.5rem;
        margin-top: 0.5rem;
      }
      
      .wihy-modal-footer {
        display: flex;
        gap: 1rem;
        padding: 1rem;
        border-top: 1px solid #eee;
        justify-content: flex-end;
      }
      
      .wihy-modal-btn {
        padding: 0.5rem 1rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        cursor: pointer;
        background: white;
      }
      
      .wihy-modal-btn:hover {
        background: #f5f5f5;
      }
      
      .analyze-with-wihy-btn {
        background: #007bff;
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 4px;
        cursor: pointer;
        margin: 0.5rem;
      }
      
      .analyze-with-wihy-btn:hover {
        background: #0056b3;
      }
      
      .analyze-with-wihy-btn:disabled {
        background: #ccc;
        cursor: not-allowed;
      }
    `;
    document.head.appendChild(styles);
  }

  // Add event listeners
  const closeModal = () => modal.remove();
  
  modal.querySelector('.wihy-modal-close')?.addEventListener('click', closeModal);
  modal.querySelector('.wihy-modal-close-btn')?.addEventListener('click', closeModal);
  modal.querySelector('.wihy-modal-overlay')?.addEventListener('click', (e) => {
    if (e.target === modal.querySelector('.wihy-modal-overlay')) {
      closeModal();
    }
  });

  // Copy analysis button
  modal.querySelector('.wihy-modal-copy-btn')?.addEventListener('click', () => {
    const analysisText = `WIHY Analysis:\n\n${response.response}\n\nSource: ${response.source}\nConfidence: ${Math.round(response.confidence * 100)}%`;
    navigator.clipboard.writeText(analysisText).then(() => {
      const btn = modal.querySelector('.wihy-modal-copy-btn') as HTMLButtonElement;
      const originalText = btn.textContent;
      btn.textContent = 'Copied!';
      setTimeout(() => {
        btn.textContent = originalText;
      }, 2000);
    });
  });

  document.body.appendChild(modal);
}

/**
 * Auto-setup when DOM is loaded
 */
export function autoSetupWIHY(options: AnalyzeWithWihyOptions = {}): void {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setupAnalyzeButtons(options));
  } else {
    setupAnalyzeButtons(options);
  }
}

// Export for direct use
export { WIHYClient } from '../services/wihyClientPure';
export const wihy = {
  addButton: addAnalyzeWithWihyButton,
  setupAll: setupAnalyzeButtons,
  autoSetup: autoSetupWIHY
};
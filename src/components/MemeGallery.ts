import { StorageService, MemeMetadata } from '../services/supabase/storageService';

export class MemeGallery extends HTMLElement {
    private memes: MemeMetadata[] = [];
    private sortOrder: 'date' | 'random' = 'date';
    private gridContainer: HTMLDivElement | null = null;
    private sortButton: HTMLButtonElement | null = null;

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.render();
        this.loadMemes();
        this.setupEventListeners();
    }

    private render() {
        if (!this.shadowRoot) return;

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    padding: 2rem;
                    background: white;
                    border-radius: 12px;
                }

                .gallery-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 2rem;
                    padding-bottom: 1rem;
                    border-bottom: 2px solid #f0f0f0;
                }

                .gallery-header h2 {
                    color: #2c3e50;
                    font-size: 1.8rem;
                    font-weight: 700;
                    margin: 0;
                }

                .sort-button {
                    padding: 0.8rem 1.5rem;
                    background: linear-gradient(135deg, #2196F3, #1976D2);
                    color: white;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    font-size: 0.9rem;
                    box-shadow: 0 4px 6px rgba(33, 150, 243, 0.2);
                }

                .sort-button:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 12px rgba(33, 150, 243, 0.3);
                }

                .sort-button:active {
                    transform: translateY(0);
                }

                .grid-container {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                    gap: 1.5rem;
                    padding: 1rem 0;
                }

                .meme-card {
                    position: relative;
                    border-radius: 12px;
                    overflow: hidden;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                    transition: all 0.3s ease;
                    cursor: pointer;
                    aspect-ratio: 1;
                    background: #f8f9fa;
                }

                .meme-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 8px 15px rgba(0,0,0,0.2);
                }

                .meme-card::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.7));
                    opacity: 0;
                    transition: opacity 0.3s ease;
                    z-index: 1;
                }

                .meme-card:hover::before {
                    opacity: 1;
                }

                .meme-card img,
                .meme-card video {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    transition: transform 0.3s ease;
                }

                .meme-card:hover img,
                .meme-card:hover video {
                    transform: scale(1.05);
                }

                .meme-card video {
                    background: #000;
                }

                .loading {
                    text-align: center;
                    padding: 3rem;
                    font-size: 1.2rem;
                    color: #666;
                    background: #f8f9fa;
                    border-radius: 12px;
                    margin: 2rem 0;
                }

                .error {
                    color: #f44336;
                    text-align: center;
                    padding: 2rem;
                    background: rgba(244, 67, 54, 0.1);
                    border-radius: 12px;
                    margin: 2rem 0;
                    font-weight: 500;
                }

                @media (max-width: 768px) {
                    :host {
                        padding: 1.5rem;
                    }

                    .gallery-header {
                        flex-direction: column;
                        gap: 1rem;
                        text-align: center;
                    }

                    .grid-container {
                        grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
                        gap: 1rem;
                    }
                }
            </style>

            <div class="gallery-header">
                <h2>Meme Gallery</h2>
                <button class="sort-button" id="sortButton">Sort by Date</button>
            </div>
            <div class="grid-container" id="gridContainer">
                <div class="loading">Loading memes...</div>
            </div>
        `;

        this.gridContainer = this.shadowRoot.querySelector('#gridContainer');
        this.sortButton = this.shadowRoot.querySelector('#sortButton');
    }

    private setupEventListeners() {
        if (!this.sortButton) return;

        this.sortButton.addEventListener('click', () => {
            this.sortOrder = this.sortOrder === 'date' ? 'random' : 'date';
            this.sortButton!.textContent = `Sort by ${this.sortOrder === 'date' ? 'Random' : 'Date'}`;
            this.renderMemes();
        });

        // Listen for new meme uploads
        this.addEventListener('meme-uploaded', () => {
            this.loadMemes();
        });
    }

    private async loadMemes() {
        if (!this.gridContainer) return;

        try {
            this.memes = await StorageService.getMemes();
            this.renderMemes();
        } catch (error) {
            console.log(error);
            this.gridContainer.innerHTML = `
                <div class="error">
                    Error loading memes. Please try again later.
                </div>
            `;
        }
    }

    private renderMemes() {
        if (!this.gridContainer) return;

        const sortedMemes = [...this.memes];
        if (this.sortOrder === 'random') {
            sortedMemes.sort(() => Math.random() - 0.5);
        }

        this.gridContainer.innerHTML = sortedMemes.map(meme => `
            <div class="meme-card" data-id="${meme.id}">
                ${meme.type.startsWith('video/') 
                    ? `<video src="${meme.url}" muted loop playsinline></video>`
                    : `<img src="${meme.url}" alt="${meme.name}">`
                }
            </div>
        `).join('');

        // Add click handlers for each meme
        this.gridContainer.querySelectorAll('.meme-card').forEach(card => {
            card.addEventListener('click', () => {
                const id = card.getAttribute('data-id');
                const meme = this.memes.find(m => m.id === id);
                if (meme) {
                    this.dispatchEvent(new CustomEvent('meme-selected', {
                        detail: meme,
                        bubbles: true,
                        composed: true
                    }));
                }
            });
        });

        // Start playing videos
        this.gridContainer.querySelectorAll('video').forEach(video => {
            video.play().catch(() => {
                // Auto-play might be blocked by the browser
                console.log('Video autoplay was blocked');
            });
        });
    }
}

customElements.define('meme-gallery', MemeGallery); 
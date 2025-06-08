import { MediaStorageService, MediaFileMetadata } from '../services/supabase/storageService';

export class MediaGallery extends HTMLElement {
    private mediaFiles: MediaFileMetadata[] = [];
    private sortOrder: 'date' | 'random' = 'date';
    private gridContainer: HTMLDivElement | null = null;
    private sortButton: HTMLButtonElement | null = null;

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.render();
        this.loadMediaFiles();
        this.setupEventListeners();
    }

    private render() {
        if (!this.shadowRoot) return;

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    max-width: 935px;
                    margin: 0 auto;
                    padding: 2rem 1rem;
                    background: #fafafa;
                }

                .gallery-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 2rem;
                    padding: 1rem;
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 1px 2px rgba(0,0,0,0.1);
                }

                .gallery-header h2 {
                    color: #262626;
                    font-size: 1.5rem;
                    font-weight: 600;
                    margin: 0;
                }

                .sort-button {
                    padding: 0.6rem 1.2rem;
                    background: rgb(192, 3, 213);
                    color: white;
                    border: none;
                    border-radius: 20px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    font-weight: 600;
                    font-size: 0.9rem;
                }

                .sort-button:hover {
                    background:rgb(147, 7, 162);
                }

                .grid-container {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 12px;
                    padding: 1rem 0;
                }

                .media-card {
                    position: relative;
                    border-radius: 4px;
                    overflow: hidden;
                    background: white;
                    box-shadow: 0 1px 2px rgba(0,0,0,0.1);
                    transition: all 0.2s ease;
                    cursor: pointer;
                    aspect-ratio: 3/4;
                }

                .media-card:hover {
                    box-shadow: 0 4px 12px rgba(192, 3, 213, 0.15);
                }

                .media-card::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: linear-gradient(to bottom, 
                        rgba(192, 3, 213, 0.1),
                        rgba(192, 3, 213, 0.2)
                    );
                    opacity: 0;
                    transition: opacity 0.2s ease;
                    z-index: 1;
                }

                .media-card:hover::before {
                    opacity: 1;
                }

                .media-card img,
                .media-card video {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .media-card video {
                    background: #000;
                }

                .loading {
                    text-align: center;
                    padding: 3rem;
                    font-size: 1.1rem;
                    color: #8e8e8e;
                    background: white;
                    border-radius: 8px;
                    margin: 2rem 0;
                    box-shadow: 0 1px 2px rgba(0,0,0,0.1);
                }

                .error {
                    color: #ed4956;
                    text-align: center;
                    padding: 2rem;
                    background: white;
                    border-radius: 8px;
                    margin: 2rem 0;
                    font-weight: 500;
                    box-shadow: 0 1px 2px rgba(0,0,0,0.1);
                }

                @media (max-width: 768px) {
                    :host {
                        padding: 1rem;
                    }

                    .grid-container {
                        grid-template-columns: repeat(2, 1fr);
                        gap: 4px;
                    }

                    .gallery-header {
                        flex-direction: column;
                        gap: 1rem;
                        text-align: center;
                    }
                }

                @media (max-width: 480px) {
                    .grid-container {
                        grid-template-columns: 1fr;
                    }
                }
            </style>

            <div class="gallery-header">
                <h2>Your Memes</h2>
                <button class="sort-button" id="sortButton">Sort by Date</button>
            </div>
            <div class="grid-container" id="gridContainer">
                <div class="loading">Loading your content...</div>
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
            this.renderMediaFiles();
        });

        // Listen for new media uploads
        this.addEventListener('media-uploaded', () => {
            this.loadMediaFiles();
        });
    }

    private async loadMediaFiles() {
        if (!this.gridContainer) return;

        try {
            this.mediaFiles = await MediaStorageService.getAllMediaFiles();
            this.renderMediaFiles();
        } catch (error) {
            console.log(error);
            this.gridContainer.innerHTML = `
                <div class="error">
                    Error loading media files. Please try again later.
                </div>
            `;
        }
    }

    private renderMediaFiles() {
        if (!this.gridContainer) return;

        const sortedMediaFiles = [...this.mediaFiles];
        if (this.sortOrder === 'random') {
            sortedMediaFiles.sort(() => Math.random() - 0.5);
        }

        this.gridContainer.innerHTML = sortedMediaFiles.map(mediaFile => `
            <div class="media-card" data-id="${mediaFile.id}">
                ${mediaFile.type.startsWith('video/') 
                    ? `<video src="${mediaFile.url}" muted loop playsinline></video>`
                    : `<img src="${mediaFile.url}" alt="${mediaFile.name}">`
                }
            </div>
        `).join('');

        // Add click handlers for each media file
        this.gridContainer.querySelectorAll('.media-card').forEach(card => {
            card.addEventListener('click', () => {
                const id = card.getAttribute('data-id');
                const mediaFile = this.mediaFiles.find(m => m.id === id);
                if (mediaFile) {
                    this.dispatchEvent(new CustomEvent('media-selected', {
                        detail: mediaFile,
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

customElements.define('meme-gallery', MediaGallery); 
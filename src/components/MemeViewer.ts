import { MemeMetadata } from '../services/supabase/storageService';

export class MemeViewer extends HTMLElement {
    private meme: MemeMetadata | null = null;
    private modal: HTMLDivElement | null = null;
    private closeButton: HTMLButtonElement | null = null;
    private mediaContainer: HTMLDivElement | null = null;

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }

    private render() {
        if (!this.shadowRoot) return;

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: none;
                }

                .modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.85);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 1000;
                    opacity: 0;
                    transition: opacity 0.2s ease;
                }

                .modal.active {
                    opacity: 1;
                }

                .modal-content {
                    position: relative;
                    max-width: 935px;
                    width: 90%;
                    max-height: 90vh;
                    background: white;
                    border-radius: 4px;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                    transform: scale(0.95);
                    transition: transform 0.2s ease;
                }

                .modal.active .modal-content {
                    transform: scale(1);
                }

                .media-container {
                    position: relative;
                    width: 100%;
                    background: #000;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    flex: 1;
                }

                .media-container img,
                .media-container video {
                    max-width: 100%;
                    max-height: 80vh;
                    object-fit: contain;
                }

                .close-button {
                    position: absolute;
                    top: 1rem;
                    right: 1rem;
                    background: rgba(0, 0, 0, 0.5);
                    color: white;
                    border: none;
                    border-radius: 50%;
                    width: 2.5rem;
                    height: 2.5rem;
                    font-size: 1.2rem;
                    cursor: pointer;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    transition: all 0.2s ease;
                    z-index: 1;
                }

                .close-button:hover {
                    background: rgba(0, 0, 0, 0.7);
                    transform: rotate(90deg);
                }

                .meme-info {
                    background: white;
                    padding: 1rem;
                    border-top: 1px solid #dbdbdb;
                }

                .meme-name {
                    margin: 0;
                    font-weight: 600;
                    font-size: 1rem;
                    color: #262626;
                }

                .meme-date {
                    margin: 0.5rem 0 0;
                    color: #8e8e8e;
                    font-size: 0.9rem;
                }

                @media (max-width: 768px) {
                    .modal-content {
                        width: 100%;
                        height: 100%;
                        max-height: 100vh;
                        border-radius: 0;
                    }

                    .media-container img,
                    .media-container video {
                        max-height: 70vh;
                    }

                    .close-button {
                        top: 0.5rem;
                        right: 0.5rem;
                        width: 2rem;
                        height: 2rem;
                        font-size: 1rem;
                    }

                    .meme-info {
                        padding: 0.8rem;
                    }
                }
            </style>

            <div class="modal" id="modal">
                <div class="modal-content">
                    <button class="close-button" id="closeButton">&times;</button>
                    <div class="media-container" id="mediaContainer"></div>
                    <div class="meme-info">
                        <h3 class="meme-name"></h3>
                        <p class="meme-date"></p>
                    </div>
                </div>
            </div>
        `;

        this.modal = this.shadowRoot.querySelector('#modal');
        this.closeButton = this.shadowRoot.querySelector('#closeButton');
        this.mediaContainer = this.shadowRoot.querySelector('#mediaContainer');
    }

    private setupEventListeners() {
        if (!this.closeButton || !this.modal) return;

        this.closeButton.addEventListener('click', () => {
            this.hide();
        });

        this.modal.addEventListener('click', (event) => {
            if (event.target === this.modal) {
                this.hide();
            }
        });

        // Close on escape key
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && this.modal?.classList.contains('active')) {
                this.hide();
            }
        });
    }

    public show(meme: MemeMetadata) {
        if (!this.modal || !this.mediaContainer) return;

        this.meme = meme;
        this.style.display = 'block';

        // Update content
        const mediaElement = meme.type.startsWith('video/')
            ? `<video src="${meme.url}" controls autoplay loop></video>`
            : `<img src="${meme.url}" alt="${meme.name}">`;

        this.mediaContainer.innerHTML = mediaElement;

        // Update info
        const nameElement = this.shadowRoot?.querySelector('.meme-name');
        const dateElement = this.shadowRoot?.querySelector('.meme-date');

        if (nameElement) {
            nameElement.textContent = meme.name;
        }
        if (dateElement) {
            dateElement.textContent = new Date(meme.created_at).toLocaleDateString();
        }

        // Show modal with animation
        requestAnimationFrame(() => {
            this.modal?.classList.add('active');
        });
    }

    private hide() {
        if (!this.modal) return;

        this.modal.classList.remove('active');
        setTimeout(() => {
            this.style.display = 'none';
            this.meme = null;
            if (this.mediaContainer) {
                this.mediaContainer.innerHTML = '';
            }
        }, 300);
    }
}

customElements.define('meme-viewer', MemeViewer); 
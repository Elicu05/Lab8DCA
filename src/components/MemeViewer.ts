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
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    backdrop-filter: blur(5px);
                }

                .modal.active {
                    opacity: 1;
                }

                .modal-content {
                    position: relative;
                    max-width: 90vw;
                    max-height: 90vh;
                    background: white;
                    border-radius: 16px;
                    overflow: hidden;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                    transform: scale(0.95);
                    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }

                .modal.active .modal-content {
                    transform: scale(1);
                }

                .media-container {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    background: #000;
                }

                .media-container img,
                .media-container video {
                    max-width: 100%;
                    max-height: 90vh;
                    object-fit: contain;
                    border-radius: 8px;
                }

                .close-button {
                    position: absolute;
                    top: 1rem;
                    right: 1rem;
                    background: rgba(255, 255, 255, 0.1);
                    color: white;
                    border: none;
                    border-radius: 50%;
                    width: 3rem;
                    height: 3rem;
                    font-size: 1.5rem;
                    cursor: pointer;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    transition: all 0.3s ease;
                    z-index: 1;
                    backdrop-filter: blur(4px);
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                }

                .close-button:hover {
                    background: rgba(255, 255, 255, 0.2);
                    transform: rotate(90deg);
                }

                .close-button:active {
                    transform: scale(0.95) rotate(90deg);
                }

                .meme-info {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    background: linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent);
                    color: white;
                    padding: 2rem 1.5rem 1.5rem;
                    font-size: 1rem;
                    transform: translateY(100%);
                    transition: transform 0.3s ease;
                }

                .modal:hover .meme-info {
                    transform: translateY(0);
                }

                .meme-name {
                    margin: 0;
                    font-weight: 600;
                    font-size: 1.2rem;
                    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
                }

                .meme-date {
                    margin: 0.5rem 0 0;
                    opacity: 0.8;
                    font-size: 0.9rem;
                }

                @media (max-width: 768px) {
                    .modal-content {
                        max-width: 95vw;
                        max-height: 95vh;
                    }

                    .close-button {
                        width: 2.5rem;
                        height: 2.5rem;
                        font-size: 1.2rem;
                    }

                    .meme-info {
                        padding: 1.5rem 1rem 1rem;
                    }

                    .meme-name {
                        font-size: 1.1rem;
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
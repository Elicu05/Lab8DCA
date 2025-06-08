import '../components/MemeUploader';
import '../components/MemeGallery';
import '../components/MemeViewer';
import { MediaFileMetadata } from '../services/supabase/storageService';

class AppRoot extends HTMLElement {
    private mediaViewer: HTMLElement | null = null;

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    async connectedCallback() {
        this.render();
        this.setupEventListeners();
    }

    private displayErrorMessage(message: string) {
        if (!this.shadowRoot) return;
        
        const errorNotification = document.createElement('div');
        errorNotification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #f44336;
            color: white;
            padding: 15px 30px;
            border-radius: 4px;
            z-index: 1000;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        `;
        errorNotification.textContent = message;
        this.shadowRoot.appendChild(errorNotification);

        setTimeout(() => {
            errorNotification.remove();
        }, 5000);
    }

    render() {
        if (!this.shadowRoot) return;

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    max-width: 1400px;
                    margin: 0 auto;
                    padding: 2rem;
                    min-height: 100vh;
                    background:rgb(192, 3, 213);
                }

                h1 {
                    text-align: center;
                    color: #2c3e50;
                    margin-bottom: 2rem;
                    font-size: 3rem;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                    text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
                    position: relative;
                    padding-bottom: 1rem;
                }

                h1::after {
                    content: '';
                    position: absolute;
                    bottom: 0;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 100px;
                    height: 4px;
                    background: linear-gradient(90deg, #2196F3, #4CAF50);
                    border-radius: 2px;
                }

                meme-uploader {
                    margin-bottom: 3rem;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                    border-radius: 12px;
                    background: white;
                }

                meme-gallery {
                    margin-top: 2rem;
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                    padding: 1rem;
                }

                @media (max-width: 768px) {
                    :host {
                        padding: 1rem;
                    }

                    h1 {
                        font-size: 2rem;
                    }
                }
            </style>

            <meme-uploader></meme-uploader>
            <meme-gallery></meme-gallery>
            <meme-viewer></meme-viewer>
        `;  

        this.mediaViewer = this.shadowRoot.querySelector('meme-viewer');
    }

    private setupEventListeners() {
        if (!this.mediaViewer) return;

        this.addEventListener('media-selected', ((event: CustomEvent<MediaFileMetadata>) => {
            if (this.mediaViewer && 'show' in this.mediaViewer && typeof (this.mediaViewer as { show: (media: MediaFileMetadata) => void }).show === 'function') {
                (this.mediaViewer as { show: (media: MediaFileMetadata) => void }).show(event.detail);
            }
        }) as EventListener);
    }
}

export default AppRoot;
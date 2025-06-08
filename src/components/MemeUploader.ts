import { StorageService} from '../services/supabase/storageService';

export class MemeUploader extends HTMLElement {
    private uploadInput: HTMLInputElement | null = null;
    private progressBar: HTMLProgressElement | null = null;
    private uploadButton: HTMLButtonElement | null = null;

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
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    background: #fafbfc;
                    width: 1150px;
                    height: 470px;
                    margin: 0 auto;
                }
                .main-card {
                    background:rgb(192, 3, 213);
                    border-radius: 40px;
                    box-shadow: 0 8px 24px rgba(21, 119, 214, 0.18);
                    padding: 3.5rem 2.5rem 2.5rem 2.5rem;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    min-width: 400px;
                    max-width: 480px;
                    margin: 2rem auto;
                }

                .main-title {
                    color: #fff;
                    font-size: 3rem;
                    font-weight: 800;
                    text-align: center;
                    text-transform: uppercase;
                    margin-bottom: 2.5rem;
                    line-height: 1.1;
                }
                input[type="file"] {
                    display: none;
                }
                .custom-file-input {
                    display: none;
                }
                .upload-btn {
                    width: 100%;
                    padding: 1.2rem 2rem;
                    background:rgb(22, 228, 46);
                    color: #fff;
                    border: none;
                    border-radius: 18px;
                    cursor: pointer;
                    font-size: 2rem;
                    font-weight: 700;
                    box-shadow: 0 6px 16px rgba(0, 255, 42, 0.18);
                    margin-top: 1.5rem;
                    transition: background 0.2s, transform 0.2s, box-shadow 0.2s;
                }
                .upload-btn:hover:not(:disabled) {
                    background: #0be022;
                    transform: translateY(-2px);
                    box-shadow: 0 10px 24px rgba(0, 255, 42, 0.22);
                }
                .upload-btn:active {
                    background: #0fff2a;
                    transform: none;
                }
                .upload-btn:disabled {
                    background:rgb(191, 198, 192);
                    color: #fff;
                    cursor: not-allowed;
                    box-shadow: none;
                }
                progress {
                    width: 100%;
                    height: 8px;
                    border-radius: 4px;
                    display: none;
                    background: #f0f0f0;
                    overflow: hidden;
                    margin-top: 1.2rem;
                }
                progress::-webkit-progress-bar {
                    background-color: #f0f0f0;
                    border-radius: 4px;
                }
                progress::-webkit-progress-value {
                    background: linear-gradient(90deg, #2196F3, #4CAF50);
                    border-radius: 4px;
                    transition: width 0.3s ease;
                }
                .error-message {
                    color: #f44336;
                    margin-top: 1rem;
                    display: none;
                    padding: 1rem;
                    background: rgba(244, 67, 54, 0.1);
                    border-radius: 8px;
                    text-align: center;
                    font-weight: 500;
                }
                @media (max-width: 600px) {
                    .main-card {
                        min-width: unset;
                        width: 95vw;
                        padding: 2rem 0.5rem 1.5rem 0.5rem;
                    }
                    .main-title {
                        font-size: 2rem;
                    }
                    .upload-btn {
                        font-size: 1.2rem;
                        padding: 1rem 0.5rem;
                    }
                }
            </style>
            <div class="main-card">
                <div class="main-title">click to SELECT MEMES</div>
                <input type="file" id="memeInput" accept="image/*,video/*" multiple>
                <button id="uploadButton" class="upload-btn" disabled>Upload selected memes</button>
                <progress id="uploadProgress" value="0" max="100"></progress>
                <div id="errorMessage" class="error-message"></div>
            </div>
        `;

        this.uploadInput = this.shadowRoot.querySelector('#memeInput');
        this.progressBar = this.shadowRoot.querySelector('#uploadProgress');
        this.uploadButton = this.shadowRoot.querySelector('#uploadButton');

        // Custom file input trigger
        const mainCard = this.shadowRoot.querySelector('.main-card');
        if (this.uploadInput && mainCard && this.uploadButton) {
            mainCard.addEventListener('click', (e) => {
                if (e.target === this.uploadButton) return;
                this.uploadInput?.click();
            });
        }
    }

    private setupEventListeners() {
        if (!this.uploadInput || !this.uploadButton) return;

        this.uploadInput.addEventListener('change', () => {
            if (this.uploadButton) {
                this.uploadButton.disabled = !this.uploadInput?.files?.length;
            }
        });

        this.uploadButton.addEventListener('click', async () => {
            if (!this.uploadInput?.files?.length) return;

            const files = Array.from(this.uploadInput.files);
            await this.uploadFiles(files);
        });
    }

    private async uploadFiles(files: File[]) {
        if (!this.progressBar || !this.uploadButton) return;

        console.log('Starting upload of files:', files.map(f => f.name));
        this.progressBar.style.display = 'block';
        this.uploadButton.disabled = true;

        for (const file of files) {
            try {
                console.log('Uploading file:', file.name, 'Type:', file.type, 'Size:', file.size);
                const result = await StorageService.uploadMeme({
                    file,
                    onProgress: (progress) => {
                        console.log('Upload progress:', progress, '%');
                        if (this.progressBar) {
                            this.progressBar.value = progress;
                        }
                    }
                });

                console.log('Upload result:', result);
                if (result) {
                    console.log('Dispatching meme-uploaded event');
                    this.dispatchEvent(new CustomEvent('meme-uploaded', {
                        detail: result,
                        bubbles: true,
                        composed: true
                    }));
                } else {
                    console.error('Upload failed - no result returned');
                    this.showError('Error uploading file: ' + file.name);
                }
            } catch (error) {
                console.error('Error in uploadFiles:', error);
                this.showError('Error uploading file: ' + file.name);
            }
        }

        // Reset the form
        if (this.uploadInput) {
            this.uploadInput.value = '';
        }
        this.progressBar.style.display = 'none';
        this.progressBar.value = 0;
        this.uploadButton.disabled = true;
    }

    private showError(message: string) {
        const errorElement = this.shadowRoot?.querySelector('#errorMessage') as HTMLElement;
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
            setTimeout(() => {
                errorElement.style.display = 'none';
            }, 5000);
        }
    }
}

customElements.define('meme-uploader', MemeUploader); 
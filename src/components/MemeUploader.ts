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
                    display: block;
                    padding: 2rem;
                    background: white;
                    border-radius: 12px;
                    transition: all 0.3s ease;
                }

                .upload-container {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                    align-items: center;
                    max-width: 600px;
                    margin: 0 auto;
                }

                .file-input-container,
                button {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    width: 100%;
                    max-width: 400px;
                }

                input[type="file"] {
                    display: none;
                }

                .custom-file-input {
                    display: inline-block;
                    width: 100%;
                    padding: 1.2rem 2rem;
                    background: linear-gradient(135deg, #2196F3, #1976D2);
                    color: white;
                    border-radius: 8px;
                    cursor: pointer;
                    text-align: center;
                    transition: all 0.3s ease;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    box-shadow: 0 4px 6px rgba(33, 150, 243, 0.2);
                }

                .custom-file-input:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 12px rgba(33, 150, 243, 0.3);
                }

                .custom-file-input:active {
                    transform: translateY(0);
                }

                progress {
                    width: 100%;
                    height: 8px;
                    border-radius: 4px;
                    display: none;
                    background: #f0f0f0;
                    overflow: hidden;
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

                button {
                    width: 100%;
                    max-width: 400px;
                    padding: 1.2rem 2rem;
                    background: linear-gradient(135deg, #4CAF50, #45a049);
                    color: white;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    box-shadow: 0 4px 6px rgba(76, 175, 80, 0.2);
                }

                button:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 12px rgba(76, 175, 80, 0.3);
                }

                button:active {
                    transform: translateY(0);
                }

                button:disabled {
                    background: #ccc;
                    cursor: not-allowed;
                    transform: none;
                    box-shadow: none;
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

                @media (max-width: 768px) {
                    :host {
                        padding: 1.5rem;
                    }

                    .custom-file-input,
                    button {
                        padding: 1rem 1.5rem;
                    }
                }
            </style>

            <div class="upload-container">
                <div class="file-input-container">
                    <input type="file" id="memeInput" accept="image/*,video/*" multiple>
                    <label for="memeInput" class="custom-file-input">Select Memes to Upload</label>
                </div>
                <progress id="uploadProgress" value="0" max="100"></progress>
                <button id="uploadButton" disabled>Upload Selected Memes</button>
                <div id="errorMessage" class="error-message"></div>
            </div>
        `;

        this.uploadInput = this.shadowRoot.querySelector('#memeInput');
        this.progressBar = this.shadowRoot.querySelector('#uploadProgress');
        this.uploadButton = this.shadowRoot.querySelector('#uploadButton');
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
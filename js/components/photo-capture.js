import { utils } from '../utils.js';

export class PhotoCapture {
    constructor(elementId, options = {}) {
        this.container = document.getElementById(elementId);
        if (!this.container) return;

        this.options = options; // { maxPhotos: 5 }
        this.photos = []; // Array of Blobs/Base64

        this.render();
    }

    render() {
        this.container.innerHTML = `
            <div class="photo-widget">
                <div class="photo-capture-area">
                    <span style="font-size: 2rem;">📸</span>
                    <p>Toque para tirar foto</p>
                    <input type="file" accept="image/*" capture="environment" style="display:none;" class="photo-input">
                </div>
                <div class="photo-preview-grid"></div>
            </div>
        `;

        const trigger = this.container.querySelector('.photo-capture-area');
        const input = this.container.querySelector('.photo-input');

        trigger.addEventListener('click', () => input.click());
        input.addEventListener('change', (e) => this.handleFileSelect(e));
    }

    async handleFileSelect(event) {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        const file = files[0];

        // Compress and Store
        try {
            const compressedBlob = await utils.compressImage(file, 1024, 0.7);
            const base64 = await utils.fileToBase64(compressedBlob);

            this.photos.push({
                blob: compressedBlob,
                base64: base64,
                timestamp: new Date().toISOString()
            });

            this.updatePreview();

            if (this.options.onChange) this.options.onChange(this.photos);

        } catch (error) {
            console.error('Error processing photo:', error);
            alert('Erro ao processar foto.');
        }

        // Reset input
        event.target.value = '';
    }

    updatePreview() {
        const grid = this.container.querySelector('.photo-preview-grid');
        grid.innerHTML = '';

        this.photos.forEach((photo, index) => {
            const div = document.createElement('div');
            div.style.position = 'relative';

            const img = document.createElement('img');
            img.src = photo.base64;
            img.className = 'photo-thumbnail';

            const removeBtn = document.createElement('button');
            removeBtn.innerHTML = '×';
            removeBtn.style.position = 'absolute';
            removeBtn.style.top = '-5px';
            removeBtn.style.right = '-5px';
            removeBtn.style.background = 'red';
            removeBtn.style.color = 'white';
            removeBtn.style.border = 'none';
            removeBtn.style.borderRadius = '50%';
            removeBtn.style.width = '20px';
            removeBtn.style.height = '20px';
            removeBtn.style.cursor = 'pointer';

            removeBtn.addEventListener('click', () => {
                this.photos.splice(index, 1);
                this.updatePreview();
                if (this.options.onChange) this.options.onChange(this.photos);
            });

            div.appendChild(img);
            div.appendChild(removeBtn);
            grid.appendChild(div);
        });
    }

    getValue() {
        return this.photos;
    }
}

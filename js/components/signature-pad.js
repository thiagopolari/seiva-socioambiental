export class SignatureWidget {
    constructor(elementId, options = {}) {
        this.container = document.getElementById(elementId);
        if (!this.container) return;

        this.options = options;
        this.pad = null;

        this.render();
    }

    render() {
        this.container.innerHTML = `
            <div class="signature-wrapper" style="border: 1px solid #e0e0e0; border-radius: 8px; padding: 10px; background: #fafafa;">
                <canvas class="signature-pad" style="width: 100%; height: 150px; background: white; border-radius: 4px; touch-action: none;"></canvas>
                <div class="signature-footer" style="display: flex; justify-content: space-between; margin-top: 8px; align-items: center;">
                    <small style="color: #888;">Assine acima com o dedo ou mouse</small>
                    <button type="button" class="btn btn-secondary btn-sm btn-clear-sig">Limpar</button>
                </div>
            </div>
        `;

        const canvas = this.container.querySelector('canvas');

        // Initial sizing logic
        this.resizeCanvas(canvas);

        // Initialize Signature Pad Library
        if (typeof SignaturePad === 'undefined') {
            console.error('SignaturePad library not loaded!');
            return;
        }

        this.pad = new SignaturePad(canvas, {
            backgroundColor: 'rgb(255, 255, 255)',
            penColor: 'rgb(0, 0, 0)'
        });

        // Handle Resizing dynamically
        const resizeObserver = new ResizeObserver(() => {
            this.resizeCanvas(canvas);
        });
        resizeObserver.observe(this.container);

        // Clear Button
        this.container.querySelector('.btn-clear-sig').addEventListener('click', () => {
            this.pad.clear();
            if (this.options.onChange) this.options.onChange(null);
        });

        // On stroke end, notify parent
        this.pad.addEventListener("endStroke", () => {
            if (this.options.onChange) this.options.onChange(this.getValue());
        });
    }

    resizeCanvas(canvas) {
        // When resized, stretch the canvas to fill the container
        // but try to keep the content (this is tricky with SignaturePad, simpler to just resize)

        // Check availability
        if (canvas.offsetWidth === 0) return; // Still hidden

        const ratio = Math.max(window.devicePixelRatio || 1, 1);

        // Only resize if actually changed to avoid clearing data unnecessarily on minor shifts
        const newWidth = canvas.offsetWidth * ratio;
        const newHeight = canvas.offsetHeight * ratio;

        if (canvas.width !== newWidth || canvas.height !== newHeight) {

            // Store data if we want to preserve it (optional, but good UX)
            let data = null;
            if (this.pad) {
                data = this.pad.toData();
            }

            canvas.width = newWidth;
            canvas.height = newHeight;
            canvas.getContext('2d').scale(ratio, ratio);

            if (this.pad) {
                this.pad.clear(); // Clears logic buffer
                if (data) this.pad.fromData(data); // Restore signature
            }
        }
    }

    getValue() {
        if (!this.pad || this.pad.isEmpty()) return null;
        return this.pad.toDataURL('image/png'); // Base64 PNG
    }

    clear() {
        if (this.pad) this.pad.clear();
    }
}

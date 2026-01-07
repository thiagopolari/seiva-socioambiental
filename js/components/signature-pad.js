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

        // Set canvas dimensions explicitly before initializing SignaturePad
        // This is critical - canvas needs actual pixel dimensions, not CSS
        const rect = canvas.getBoundingClientRect();
        const ratio = Math.max(window.devicePixelRatio || 1, 1);

        canvas.width = rect.width * ratio;
        canvas.height = rect.height * ratio;

        const ctx = canvas.getContext('2d');
        ctx.scale(ratio, ratio);

        // Initialize Signature Pad Library
        if (typeof SignaturePad === 'undefined') {
            console.error('SignaturePad library not loaded!');
            return;
        }

        this.pad = new SignaturePad(canvas, {
            backgroundColor: 'rgb(255, 255, 255)',
            penColor: 'rgb(0, 0, 0)'
        });

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

    getValue() {
        if (!this.pad || this.pad.isEmpty()) return null;
        return this.pad.toDataURL('image/png'); // Base64 PNG
    }

    clear() {
        if (this.pad) this.pad.clear();
    }
}

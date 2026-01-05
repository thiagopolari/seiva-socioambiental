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
            <div class="signature-wrapper">
                <canvas class="signature-pad"></canvas>
                <div class="signature-footer">
                    <button type="button" class="btn btn-secondary btn-sm btn-clear-sig">Limpar</button>
                </div>
            </div>
        `;

        const canvas = this.container.querySelector('canvas');

        // Resize canvas to fit container
        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        canvas.width = canvas.offsetWidth * ratio;
        canvas.height = canvas.offsetHeight * ratio;
        canvas.getContext("2d").scale(ratio, ratio);

        // Initialize Lib
        this.pad = new SignaturePad(canvas, {
            backgroundColor: 'rgba(255, 255, 255, 0)'
        });

        this.container.querySelector('.btn-clear-sig').addEventListener('click', () => {
            this.pad.clear();
            if (this.options.onChange) this.options.onChange(null);
        });

        this.pad.addEventListener("endStroke", () => {
            if (this.options.onChange) this.options.onChange(this.getValue());
        });
    }

    getValue() {
        if (this.pad.isEmpty()) return null;
        return this.pad.toDataURL(); // Base64 PNG
    }
}

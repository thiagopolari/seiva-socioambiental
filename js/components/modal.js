export class Modal {
    constructor() {
        this.overlay = null;
    }

    show(title, content, actions = []) {
        this.close(); // Close existing

        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.7); z-index: 2000;
            display: flex; justify-content: center; align-items: center;
            backdrop-filter: blur(5px);
        `;

        const modal = document.createElement('div');
        modal.className = 'modal-content';
        modal.style.cssText = `
            background: var(--surface, #fff); color: var(--text, #000);
            width: 90%; max-width: 800px; max-height: 90vh;
            border-radius: 12px; display: flex; flex-direction: column;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        `;

        const header = document.createElement('div');
        header.style.cssText = `
            padding: 15px 20px; border-bottom: 1px solid var(--border, #eee);
            display: flex; justify-content: space-between; align-items: center;
        `;
        header.innerHTML = `<h3>${title}</h3><button id="modal-close" style="background:none;border:none;font-size:1.5rem;cursor:pointer;">&times;</button>`;

        const body = document.createElement('div');
        body.style.cssText = `
            padding: 20px; overflow-y: auto; line-height: 1.6; flex: 1;
        `;
        // Simple markdown formatted to HTML (very basic)
        const formatted = content
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/# (.*?)(<br>|$)/g, '<h1>$1</h1>$2')
            .replace(/## (.*?)(<br>|$)/g, '<h2>$1</h2>$2');

        body.innerHTML = formatted;

        modal.appendChild(header);
        modal.appendChild(body);

        // Footer with Actions
        if (actions && actions.length > 0) {
            const footer = document.createElement('div');
            footer.style.cssText = `
                padding: 15px 20px; border-top: 1px solid var(--border, #eee);
                display: flex; justify-content: flex-end; gap: 10px; background: var(--background, #f9fafb);
                border-bottom-left-radius: 12px; border-bottom-right-radius: 12px;
            `;

            actions.forEach(action => {
                const btn = document.createElement('button');
                btn.className = action.class || 'btn btn-secondary'; // Default styling
                btn.textContent = action.label;
                btn.onclick = () => {
                    if (action.onClick) action.onClick();
                    if (action.close) this.close();
                };

                // Inline styles if class not available
                if (!action.class) {
                    btn.style.cssText = `
                        padding: 8px 16px; border-radius: 6px; border: 1px solid #ddd;
                        background: #fff; cursor: pointer; font-size: 0.9rem;
                    `;
                }

                footer.appendChild(btn);
            });
            modal.appendChild(footer);
        }

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        this.overlay = overlay;

        // Close events
        document.getElementById('modal-close').addEventListener('click', () => this.close());
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) this.close();
        });
    }

    close() {
        if (this.overlay) {
            document.body.removeChild(this.overlay);
            this.overlay = null;
        }
    }
}

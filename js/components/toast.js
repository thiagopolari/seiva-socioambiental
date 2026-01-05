export class Toast {
    constructor() {
        this.container = document.createElement('div');
        this.container.id = 'toast-container';
        this.container.style.cssText = `
            position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
            display: flex; flex-direction: column; gap: 10px; z-index: 3000;
        `;
        document.body.appendChild(this.container);
    }

    show(message, type = 'info') {
        const toast = document.createElement('div');

        let bg = '#333';
        let icon = 'ℹ️';
        if (type === 'success') { bg = 'var(--success, #388e3c)'; icon = '✅'; }
        if (type === 'error') { bg = 'var(--error, #d32f2f)'; icon = '❌'; }

        toast.style.cssText = `
            background: ${bg}; color: white; padding: 12px 24px;
            border-radius: 50px; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            font-size: 0.95rem; display: flex; align-items: center; gap: 10px;
            opacity: 0; transform: translateY(20px); transition: all 0.3s ease;
        `;
        toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;

        this.container.appendChild(toast);

        // Animate In
        requestAnimationFrame(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateY(0)';
        });

        // Remove after 3s
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(20px)';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

export class SettingsManager {
    constructor() {
        this.STORAGE_KEY = 'seiva_ai_settings';
        this.defaultSettings = {
            provider: 'gemini',
            apiKey: '',
            model: 'gemini-1.5-flash',
            endpoint: ''
        };
    }

    getSettings() {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (!stored) return this.defaultSettings;
        try {
            return { ...this.defaultSettings, ...JSON.parse(stored) };
        } catch (e) {
            console.error('Error loading settings', e);
            return this.defaultSettings;
        }
    }

    saveSettings(settings) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(settings));
        alert('Configurações salvas com sucesso!');
    }

    setupUI() {
        const settings = this.getSettings();

        // Dom Elements
        const providerEl = document.getElementById('ai-provider');
        const apiKeyEl = document.getElementById('ai-api-key');
        const modelEl = document.getElementById('ai-model');
        const endpointEl = document.getElementById('ai-endpoint');
        const endpointGroup = document.getElementById('group-ai-endpoint'); // Corrected
        const btnSave = document.getElementById('btn-save-settings');

        if (!providerEl) return; // UI not loaded

        // Load Values
        providerEl.value = settings.provider;
        apiKeyEl.value = settings.apiKey;
        modelEl.value = settings.model;
        endpointEl.value = settings.endpoint;

        // Toggle Endpoint visibility
        this.updateVisibility();

        // Listeners
        providerEl.addEventListener('change', () => this.updateVisibility());

        btnSave.addEventListener('click', () => {
            const newSettings = {
                provider: providerEl.value,
                apiKey: apiKeyEl.value,
                model: modelEl.value,
                endpoint: endpointEl.value
            };
            this.saveSettings(newSettings);
        });

        // Test Button Logic
        if (!document.getElementById('btn-test-connection')) {
            const btnTest = document.createElement('button');
            btnTest.id = 'btn-test-connection';
            btnTest.textContent = '⚡ Testar Conexão';
            btnTest.className = 'btn btn-secondary';
            btnTest.style.marginTop = '10px';
            btnTest.style.width = '100%';
            btnTest.onclick = () => this.testConnection();

            // Insert before Save button or append
            if (btnSave && btnSave.parentElement) {
                btnSave.parentElement.insertBefore(btnTest, btnSave);
            }
        }
    }

    updateVisibility() {
        const provider = document.getElementById('ai-provider').value;
        const endpointGroup = document.getElementById('group-ai-endpoint');
        if (provider === 'openai') {
            endpointGroup.style.display = 'block';
        } else {
            endpointGroup.style.display = 'none';
        }
    }

    async testConnection() {
        // Dynamic import to avoid cycles or re-instantiate
        const { AIService } = await import('../ai/ai-service.js');
        const ai = new AIService();

        let btn = document.getElementById('btn-test-connection');
        if (!btn) {
            btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Testar'));
        }

        const originalText = btn ? btn.textContent : '⚡ Testar Conexão';
        if (btn) {
            btn.textContent = 'Testando...';
            btn.disabled = true;
        }

        const tempSettings = {
            provider: document.getElementById('ai-provider').value,
            apiKey: document.getElementById('ai-api-key').value,
            model: document.getElementById('ai-model').value,
            endpoint: document.getElementById('ai-endpoint').value
        };

        try {
            // Quick hello world
            await ai.generateAnalysis('Test', 'Text', 'Responda apenas "OK" se receber esta mensagem.', tempSettings);
            alert('Conexão bem sucedida! A API respondeu corretamente. ✅');
        } catch (error) {
            console.error(error);
            alert(`Falha na conexão: ${error.message} ❌`);
        } finally {
            if (btn) {
                btn.textContent = originalText;
                btn.disabled = false;
            }
        }
    }
}

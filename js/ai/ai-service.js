import { SettingsManager } from '../settings/settings-manager.js';

export class AIService {
    constructor() {
        this.settingsManager = new SettingsManager();
    }

    async generateAnalysis(fileContent, fileType, context) {
        const settings = this.settingsManager.getSettings();
        if (!settings.apiKey) {
            throw new Error('Chave de API não configurada. Vá em Configurações.');
        }

        const prompt = this.buildPrompt(fileContent, fileType, context);

        if (settings.provider === 'gemini') {
            return this.callGemini(settings, prompt);
        } else {
            return this.callOpenAI(settings, prompt);
        }
    }

    buildPrompt(content, type, context) {
        return `
            Você é um analista de dados socioambientais especialista.
            Analise o seguinte arquivo (${type}):
            
            CONTEXTO: ${context || 'Nenhum contexto adicional.'}

            CONTEÚDO DO ARQUIVO:
            ${content}

            TAREFA:
            1. Identifique o tipo de documento.
            2. Resuma os principais pontos.
            3. Identifique potenciais conflitos socioambientais ou dados relevantes.
            4. Gere 3 insights acionáveis.

            Responda em formato Markdown.
        `;
    }

    async callGemini(settings, prompt) {
        // Ensure model doesn't have double prefix
        const modelId = settings.model.replace('models/', '') || 'gemini-1.5-flash';
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${settings.apiKey}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }]
            })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error?.message || 'Erro na API Gemini');
        }

        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    }

    async callOpenAI(settings, prompt) {
        // Default to OpenAI standard if no endpoint provided
        const baseUrl = settings.endpoint || 'https://api.openai.com/v1';
        const url = `${baseUrl}/chat/completions`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${settings.apiKey}`
            },
            body: JSON.stringify({
                model: settings.model,
                messages: [
                    { role: 'system', content: 'You are a helpful assistant.' },
                    { role: 'user', content: prompt }
                ]
            })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error?.message || 'Erro na API OpenAI');
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }
}

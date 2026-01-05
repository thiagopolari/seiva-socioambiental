import { SettingsManager } from '../settings/settings-manager.js';

export class AIService {
    constructor() {
        this.settingsManager = new SettingsManager();
    }

    async generateAnalysis(fileContent, fileType, context, settingsOverride = null) {
        const settings = settingsOverride || this.settingsManager.getSettings();
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
            Você é um analista socioambientais sênior da 'Seiva'.
            Sua tarefa é analisar os dados fornecidos e gerar um **Relatório Técnico Profissional**.
            
            CONTEXTO EXTRA: ${context || 'Nenhum contexto adicional.'}

            DADOS PARA ANÁLISE (${type}):
            ${content}

            ---
            
            Gere um relatório rigoroso em Markdown com a seguinte estrutura exata:

            ## 1. Resumo Executivo
            (Breve parágrafo sintetizando a situação)

            ## 2. Indicadores Chave (Dashboard)
            | Indicador | Status | Detalhes |
            |-----------|--------|----------|
            | (ex: Risco de Desmatamento) | (Alto/Médio/Baixo) | ... |
            | (ex: Segurança Hídrica) | ... | ... |
            | (ex: Conflitos Territoriais) | ... | ... |
            (Adicione mais 2-3 linhas relevantes)

            ## 3. Análise de Riscos e Oportunidades
            *   **🚨 Riscos Críticos**: ...
            *   **💡 Oportunidades de SAFs**: ...
            *   **👥 Aspectos Sociais**: ...

            ## 4. Recomendações Técnicas
            1.  ...
            2.  ...
            3.  ...

            Mantenha o tom formal e direto. Use formatação Markdown (negrito, listas, tabelas).
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

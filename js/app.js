import { db } from './db.js';
import { utils } from './utils.js';
import { FormEngine } from './components/form-engine.js';
import { SocioambientalFormSchema } from './forms/socioambiental-form.js';
import { Dashboard } from './dashboard/dashboard.js';
import { DataManager } from './export/data-manager.js';
import { ExcelGenerator } from './export/excel-generator.js';
import { PDFGenerator } from './export/pdf-generator.js'; // NEW
import { SettingsManager } from './settings/settings-manager.js';
import { AIService } from './ai/ai-service.js';
import { SmartParser } from './ai/smart-parser.js';
import { Modal } from './components/modal.js';
import { ProjectManager } from './projects/project-manager.js';
import { MapManager } from './map/map-manager.js';

class App {
    constructor() {
        this.currentView = 'dashboard';
        this.isOnline = navigator.onLine;
        this.formEngine = null;

        // Initialize Modules
        this.dashboard = new Dashboard();
        this.dataManager = new DataManager();
        this.excelGenerator = new ExcelGenerator();
        this.pdfGenerator = new PDFGenerator(); // NEW
        this.settingsManager = new SettingsManager();
        this.aiService = new AIService();
        this.smartParser = new SmartParser();
        this.modal = new Modal();
        this.projectManager = new ProjectManager();
        this.mapManager = new MapManager('map-main');

        this.init();
    }

    async init() {
        console.log('Seiva Socioambiental v2.1 (Projects) initializing...');

        // 1. Service Worker
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('./sw.js');
                console.log('SW registered:', registration.scope);
            } catch (error) {
                console.error('SW registration failed:', error);
            }
        }

        // 2. Database
        try {
            await db.open();
            console.log('DB Initialized');
        } catch (error) {
            console.error('DB Init failed:', error);
            alert('Erro ao abrir banco de dados local.');
        }

        // 3. Setup UI & Actions
        this.setupNavigation();
        this.setupNetworkListeners();
        this.setupFormActions();
        this.setupProjectActions();

        // Initialize Settings UI if we are on that view, or pre-load
        // Restore active project name in header if exists
        this.updateHeaderProjectBadge();

        // 4. Initial Render
        this.updateConnectionStatus();
        this.navigateTo('dashboard');
    }

    updateHeaderProjectBadge() {
        const badge = document.getElementById('header-project-badge');
        if (badge) {
            if (this.projectManager.activeProject) {
                badge.innerHTML = `📁 <span>${this.projectManager.activeProject.name}</span>`;
                badge.style.background = '#dcfce7';
                badge.style.borderColor = '#86efac';
            } else {
                badge.innerHTML = `📁 <span>Nenhum Projeto</span>`;
                badge.style.background = '#f3f4f6';
                badge.style.borderColor = '#e5e7eb';
            }
        }
    }

    setupNavigation() {
        const navBtns = document.querySelectorAll('.nav-btn');
        navBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.currentTarget.dataset.view; // .closest('.nav-btn') might be safer but button has the class
                this.navigateTo(view);
            });
        });
    }

    setupFormActions() {
        const btnDraft = document.getElementById('btn-save-draft');
        const btnFinal = document.getElementById('btn-finalize');
        if (btnDraft) btnDraft.addEventListener('click', () => this.saveForm(false));
        if (btnFinal) btnFinal.addEventListener('click', () => this.saveForm(true));
    }

    setupProjectActions() {
        // JSON Export
        const btnExportJson = document.getElementById('btn-export-json');
        if (btnExportJson) btnExportJson.addEventListener('click', () => this.dataManager.exportAll());

        // Excel Export
        const btnExportExcel = document.getElementById('btn-export-excel');
        if (btnExportExcel) {
            btnExportExcel.addEventListener('click', async () => {
                const records = await db.getAll('socioambiental');
                this.excelGenerator.generate(records);
            });
        }

        // Smart Import (JSON Backup OR Excel/CSV for Analysis)
        const fileInput = document.getElementById('file-import-smart');
        if (fileInput) {
            fileInput.addEventListener('change', async (e) => {
                if (e.target.files.length > 0) {
                    const file = e.target.files[0];
                    await this.handleSmartImport(file);
                    e.target.value = ''; // Reset
                }
            });
        }

        // AI Import and Analyze Button
        const btnAiImport = document.getElementById('btn-ai-import-analyze');
        const fileAiInput = document.getElementById('file-ai-analysis');
        if (btnAiImport && fileAiInput) {
            btnAiImport.addEventListener('click', () => fileAiInput.click());
            fileAiInput.addEventListener('change', async (e) => {
                if (e.target.files.length > 0) {
                    const file = e.target.files[0];
                    await this.handleAIAnalysis(file);
                    e.target.value = '';
                }
            });
        }

        // Analyze Existing Data Button
        const btnAnalyzeExisting = document.getElementById('btn-ai-analyze-existing');
        if (btnAnalyzeExisting) {
            btnAnalyzeExisting.addEventListener('click', () => this.analyzeExistingData());
        }
    }

    async handleAIAnalysis(file) {
        const statusDiv = document.getElementById('ai-status-indicator');
        const statusText = document.getElementById('ai-status-text');

        try {
            // Show status
            if (statusDiv) {
                statusDiv.style.display = 'block';
                statusText.textContent = '📂 Lendo arquivo...';
            }

            // Parse file
            const result = await this.smartParser.parse(file);

            if (statusText) statusText.textContent = '🤖 Enviando para analise...';

            // Generate AI Analysis
            const analysis = await this.aiService.generateAnalysis(
                result.content.slice(0, 50000),
                result.type,
                'Gere um relatorio tecnico completo com: Resumo Executivo, Indicadores-Chave (em tabela), Analise de Riscos e Oportunidades, e Recomendacoes. Use linguagem formal e tecnica.'
            );

            // Show result in modal
            this.modal.show('Analise de IA Concluida', analysis, [
                {
                    label: '📄 Baixar Relatorio PDF',
                    class: 'btn btn-primary',
                    onClick: () => this.pdfGenerator.generateAIReport(analysis, 'Analise de Arquivo Importado')
                },
                { label: 'Fechar', class: 'btn btn-secondary', close: true }
            ]);

            if (statusDiv) {
                statusText.textContent = '✅ Analise concluida!';
                setTimeout(() => statusDiv.style.display = 'none', 3000);
            }

        } catch (error) {
            console.error('AI Analysis Error:', error);
            if (statusText) statusText.textContent = '❌ Erro: ' + error.message;
            this.modal.show('Erro na Analise', `Nao foi possivel analisar o arquivo. Verifique sua chave de API nas Configuracoes.\n\nDetalhes: ${error.message}`);
        }
    }

    async analyzeExistingData() {
        const statusDiv = document.getElementById('ai-status-indicator');
        const statusText = document.getElementById('ai-status-text');

        try {
            if (statusDiv) {
                statusDiv.style.display = 'block';
                statusText.textContent = '📊 Carregando dados...';
            }

            // Get all records
            const records = await db.getAll('socioambiental');

            if (records.length === 0) {
                this.modal.show('Sem Dados', 'Nao ha dados coletados para analisar. Faca algumas coletas primeiro.');
                if (statusDiv) statusDiv.style.display = 'none';
                return;
            }

            if (statusText) statusText.textContent = `🤖 Analisando ${records.length} registros...`;

            // Prepare data summary for AI
            const dataSummary = records.map(r => ({
                projeto: r.data?.project_name,
                comunidade: r.data?.community_name,
                data: r.date,
                temGPS: !!r.data?.location_gps,
                campos: Object.keys(r.data || {}).length
            }));

            const analysis = await this.aiService.generateAnalysis(
                JSON.stringify(dataSummary, null, 2),
                'JSON',
                `Analise estes ${records.length} registros de coleta socioambiental. Gere: 1) Resumo Executivo, 2) Tabela de Indicadores (status, tendencias), 3) Analise de Riscos, 4) Oportunidades de SAFs, 5) Recomendacoes Tecnicas.`
            );

            this.modal.show(`Analise de ${records.length} Registros`, analysis, [
                {
                    label: '📄 Baixar Relatorio PDF',
                    class: 'btn btn-primary',
                    onClick: () => this.pdfGenerator.generateAIReport(analysis, 'Analise de Dados Coletados')
                },
                { label: 'Fechar', class: 'btn btn-secondary', close: true }
            ]);

            if (statusDiv) {
                statusText.textContent = '✅ Analise concluida!';
                setTimeout(() => statusDiv.style.display = 'none', 3000);
            }

        } catch (error) {
            console.error('Existing Data Analysis Error:', error);
            if (statusText) statusText.textContent = '❌ Erro: ' + error.message;
            this.modal.show('Erro na Analise', `Verifique sua chave de API nas Configuracoes.\n\n${error.message}`);
        }
    }

    async handleSmartImport(file) {
        try {
            // 1. Parse File
            this.modal.show('Processando...', 'Lendo arquivo e identificando estrutura...');
            const result = await this.smartParser.parse(file);

            // 2. Check if it's a Backup
            if (result.isBackup) {
                this.modal.show('Importando Backup...', 'Restaurando dados do sistema...');
                try {
                    const blob = new Blob([result.content], { type: 'application/json' });
                    const importCount = await this.dataManager.importData(blob);
                    this.modal.close();
                    alert(`Importação concluída! ${importCount} registros restaurados.`);
                    this.dashboard.render(); // Refresh dashboard
                } catch (importError) {
                    console.error('Import error:', importError);
                    this.modal.show('Erro na Importação', importError.message);
                }
                return;
            }

            // 3. AI Analysis
            this.modal.show('IA Analisando...', 'Enviando dados para o modelo (Gemini/OpenAI)...<br>Isso pode levar alguns segundos.');

            const analysis = await this.aiService.generateAnalysis(
                result.content.slice(0, 30000), // Limit Context window
                result.type,
                'Analise este arquivo importado no contexto do projeto Seiva Socioambiental.'
            );

            // 4. Show Result
            this.modal.show(`Análise IA: ${result.type}`, analysis, [
                {
                    label: '📄 Baixar Relatorio PDF',
                    class: 'btn btn-primary',
                    onClick: () => this.pdfGenerator.generateAIReport(analysis, `Analise de Importacao ${result.type}`)
                },
                { label: 'Fechar', class: 'btn btn-secondary', close: true }
            ]);

        } catch (error) {
            console.error(error);
            this.modal.show('Erro', `Falha no processamento: ${error.message}`);
        }
    }

    navigateTo(viewId) {
        this.currentView = viewId;

        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === viewId);
        });

        document.querySelectorAll('.view-section').forEach(section => {
            section.classList.add('hidden');
            section.classList.remove('active');
        });

        const targetSection = document.getElementById(`view-${viewId}`);
        if (targetSection) {
            targetSection.classList.remove('hidden');
            setTimeout(() => targetSection.classList.add('active'), 10);
            this.handleViewLoad(viewId);
        }
    }

    handleViewLoad(viewId) {
        if (viewId === 'forms') {
            const activeProj = this.projectManager.activeProject;
            if (!activeProj) {
                alert('Por favor, selecione ou crie um PROJETO primeiro na aba "Projetos".');
                this.navigateTo('projects');
                return;
            }

            // Update project indicator
            const indicator = document.getElementById('active-project-indicator');
            if (indicator) {
                indicator.innerHTML = `📁 Projeto: <strong>${activeProj.name}</strong>`;
            }

            // Always re-instantiate or re-render to inject project name
            // Pass active project name to the form engine or pre-fill logic
            this.formEngine = new FormEngine('form-renderer', SocioambientalFormSchema);
            this.formEngine.render();

            // Auto-fill Project Name
            setTimeout(() => {
                const projField = document.getElementById('project_name');
                if (projField) {
                    projField.value = activeProj.name;
                    projField.readOnly = true; // Lock it
                    projField.style.background = '#f0f0f0';
                }
            }, 100);
        }
        if (viewId === 'dashboard') {
            if (this.dashboard) this.dashboard.render();
        }
        if (viewId === 'settings') {
            this.settingsManager.setupUI();
        }
        if (viewId === 'projects') {
            this.projectManager.render();
        }
        if (viewId === 'map') {
            this.initializeMapView();
        }
    }

    initializeMapView() {
        this.mapManager.initialize();
        this.loadMapMarkers();
    }

    async loadMapMarkers() {
        const records = await db.getAll('socioambiental');
        const projectFilter = document.getElementById('map-project-filter')?.value || '';

        this.mapManager.loadMarkers(records, projectFilter);

        // Populate project filter
        const filterSelect = document.getElementById('map-project-filter');
        if (filterSelect && filterSelect.options.length === 1) {
            const projects = await db.getAll('projects');
            projects.forEach(p => {
                const option = document.createElement('option');
                option.value = p.name;
                option.textContent = p.name;
                filterSelect.appendChild(option);
            });

            // Add change listener
            filterSelect.onchange = () => {
                this.loadMapMarkers();
            };
        }
    }



    async saveForm(isFinal) {
        if (!this.formEngine) return;
        const data = this.formEngine.getData();
        const recordId = data.id || utils.generateUUID();
        data.id = recordId;

        if (isFinal) {
            let missing = [];
            SocioambientalFormSchema.sections.forEach(section => {
                section.fields.forEach(field => {
                    if (field.required && !data[field.id]) {
                        const el = document.getElementById(`group-${field.id}`);
                        if (el && el.style.display !== 'none') missing.push(field.label);
                    }
                });
            });
            if (missing.length > 0) {
                alert(`Faltando: ${missing.join(', ')}`);
                return;
            }
        }

        const record = {
            id: recordId,
            schemaId: SocioambientalFormSchema.id,
            data: data,
            status: isFinal ? 'Concluído' : 'Rascunho',
            date: new Date().toISOString(),
            syncStatus: 'pending'
        };

        try {
            await db.update('socioambiental', record);
            alert('Salvo com sucesso!');
            if (isFinal) {
                this.navigateTo('dashboard');
                this.formEngine = new FormEngine('form-renderer', SocioambientalFormSchema);
                this.formEngine.render();
            }
        } catch (error) {
            alert('Erro ao salvar');
        }
    }

    setupNetworkListeners() {
        window.addEventListener('online', () => this.updateConnectionStatus());
        window.addEventListener('offline', () => this.updateConnectionStatus());
    }

    updateConnectionStatus() {
        this.isOnline = navigator.onLine;
        const statusEl = document.getElementById('connection-status');
        if (this.isOnline) {
            statusEl.classList.remove('offline');
            statusEl.classList.add('online');
            statusEl.querySelector('.text').textContent = 'Online';
        } else {
            statusEl.classList.remove('online');
            statusEl.classList.add('offline');
            statusEl.querySelector('.text').textContent = 'Offline';
        }
    }
}

window.app = new App();

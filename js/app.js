import { db } from './db.js';
import { utils } from './utils.js';
import { FormEngine } from './components/form-engine.js';
import { SocioambientalFormSchema } from './forms/socioambiental-form.js';
import { Dashboard } from './dashboard/dashboard.js';
import { DataManager } from './export/data-manager.js';
import { ExcelGenerator } from './export/excel-generator.js';
import { SettingsManager } from './settings/settings-manager.js';
import { AIService } from './ai/ai-service.js';
import { SmartParser } from './ai/smart-parser.js';
import { Modal } from './components/modal.js';
import { ProjectManager } from './projects/project-manager.js';

class App {
    constructor() {
        this.currentView = 'dashboard';
        this.isOnline = navigator.onLine;
        this.formEngine = null;

        // Initialize Modules
        this.dashboard = new Dashboard();
        this.dataManager = new DataManager();
        this.excelGenerator = new ExcelGenerator();
        this.settingsManager = new SettingsManager();
        this.aiService = new AIService();
        this.smartParser = new SmartParser();
        this.modal = new Modal();
        this.projectManager = new ProjectManager(); // New Module

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
        if (this.projectManager.activeProject) {
            const header = document.querySelector('.app-header h1');
            if (header) header.textContent = `Seiva - ${this.projectManager.activeProject.name}`;
        }

        // 4. Initial Render
        this.updateConnectionStatus();
        this.navigateTo('dashboard');
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
            this.modal.show(`Análise IA: ${result.type}`, analysis);

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

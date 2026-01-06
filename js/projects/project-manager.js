import { db } from '../db.js';
import { utils } from '../utils.js';

export class ProjectManager {
    constructor() {
        this.activeProject = JSON.parse(localStorage.getItem('seiva_active_project') || 'null');
        this.container = document.querySelector('.projects-list-container');
    }

    setActiveProject(project) {
        this.activeProject = project;
        localStorage.setItem('seiva_active_project', JSON.stringify(project));
        // Update UI Context if needed
        const header = document.querySelector('.app-header h1');
        if (header && project) header.textContent = `Seiva - ${project.name}`;
    }

    async createProject(name, description) {
        if (!name) return alert('Nome é obrigatório');

        const project = {
            id: utils.generateUUID(),
            name,
            description,
            created_at: new Date().toISOString(),
            status: 'active'
        };

        await db.add('projects', project);

        // Auto-select the new project
        this.setActiveProject(project);
        alert(`Projeto "${name}" criado e selecionado!`);

        this.render();
        return project;
    }

    async render() {
        if (!this.container) return;

        // Split container: New Project Form | List
        // We'll rewrite the innerHTML to include the "Register" section requested by user

        this.container.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2>Projetos</h2>
                <button id="btn-new-project" class="btn btn-primary">＋ Novo Projeto</button>
            </div>

            <!-- New Project Form (Hidden by default) -->
            <div id="new-project-form" class="card hidden">
                <h3>Cadastrar Novo Projeto</h3>
                <div class="form-group">
                    <label>Nome do Projeto</label>
                    <input type="text" id="inp-proj-name" class="form-control" placeholder="ex: Monitoramento Tapajós">
                </div>
                <div class="form-group">
                    <label>Descrição</label>
                    <textarea id="inp-proj-desc" class="form-control" rows="2"></textarea>
                </div>
                <div style="display:flex; gap:10px;">
                    <button id="btn-save-project" class="btn btn-primary">Salvar</button>
                    <button id="btn-cancel-project" class="btn btn-secondary">Cancelar</button>
                </div>
            </div>

            <div id="projects-grid" class="projects-grid">
                <!-- List -->
            </div>

            <hr style="margin: 30px 0; border: 0; border-top: 1px solid var(--border);">
            
            <div class="card">
                <h3>Ações Globais</h3>
                <div class="action-buttons" style="display: flex; gap: 10px; margin-top: 10px; flex-wrap: wrap;">
                    <button class="btn btn-secondary" id="btn-export-json">💾 Backup Geral</button>
                    <button class="btn btn-secondary" id="btn-export-excel">📊 Exportar Excel</button>
                    <button class="btn btn-secondary" onclick="document.getElementById('file-import-smart').click()">📥 Importar</button>
                     <input type="file" id="file-import-smart" accept=".json,.xlsx,.csv" style="display: none;">
                </div>
            </div>
        `;

        this.bindEvents();

        const grid = document.getElementById('projects-grid');
        const projects = await db.getAll('projects');

        if (projects.length === 0) {
            grid.innerHTML = '<p style="color:var(--text-secondary); text-align:center;">Nenhum projeto cadastrado.</p>';
            return;
        }

        projects.forEach(p => {
            const card = document.createElement('div');
            card.className = 'card project-card';
            card.style.borderLeft = this.activeProject && this.activeProject.id === p.id ? '4px solid var(--primary)' : '4px solid transparent';

            card.innerHTML = `
                <div style="margin-bottom: 10px;">
                    <h3>${p.name}</h3>
                    <p style="font-size: 0.9rem; color: var(--text-secondary);">${p.description || 'Sem descrição'}</p>
                    <small>Criado em: ${new Date(p.created_at).toLocaleDateString()}</small>
                </div>
                <div style="display: flex; gap: 10px;">
                    <button class="btn btn-primary btn-xs select-proj-btn">📂 Abrir / Selecionar</button>
                    <button class="btn btn-secondary btn-xs delete-proj-btn">🗑️</button>
                </div>
            `;

            // Enter Project
            card.querySelector('.select-proj-btn').onclick = () => {
                this.setActiveProject(p);
                alert(`Projeto "${p.name}" selecionado! Agora você pode preencher formulários.`);
                this.render(); // Re-render to show active border
                // Optionally navigate to dashboard or forms
            };

            // Delete
            card.querySelector('.delete-proj-btn').onclick = async (e) => {
                e.stopPropagation();
                if (confirm('Excluir projeto?')) {
                    await db.delete('projects', p.id);
                    if (this.activeProject && this.activeProject.id === p.id) {
                        this.setActiveProject(null);
                    }
                    this.render();
                }
            };

            grid.appendChild(card);
        });
    }

    bindEvents() {
        const btnNew = document.getElementById('btn-new-project');
        const form = document.getElementById('new-project-form');
        const btnSave = document.getElementById('btn-save-project');
        const btnCancel = document.getElementById('btn-cancel-project');

        if (btnNew) btnNew.onclick = () => form.classList.remove('hidden');
        if (btnCancel) btnCancel.onclick = () => form.classList.add('hidden');

        if (btnSave) {
            btnSave.onclick = async () => {
                const name = document.getElementById('inp-proj-name').value;
                const desc = document.getElementById('inp-proj-desc').value;
                if (name) {
                    await this.createProject(name, desc);
                    form.classList.add('hidden');
                }
            };
        }

        // Bind Export/Import Actions properly
        const btnExportJson = document.getElementById('btn-export-json');
        const btnExportExcel = document.getElementById('btn-export-excel');
        const fileInput = document.getElementById('file-import-smart');

        if (btnExportJson) {
            btnExportJson.onclick = () => {
                if (window.app && window.app.dataManager) {
                    window.app.dataManager.exportAll();
                }
            };
        }
        if (btnExportExcel) {
            btnExportExcel.onclick = async () => {
                if (window.app && window.app.excelGenerator) {
                    const records = await db.getAll('socioambiental');
                    window.app.excelGenerator.generate(records);
                }
            };
        }
        if (fileInput) {
            fileInput.onchange = async (e) => {
                if (e.target.files.length > 0) {
                    const file = e.target.files[0];
                    if (window.app) {
                        await window.app.handleSmartImport(file);
                    }
                    e.target.value = '';
                }
            };
        }
    }
}

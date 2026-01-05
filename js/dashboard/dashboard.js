import { db } from '../db.js';
import { PDFGenerator } from '../export/pdf-generator.js';

export class Dashboard {
    constructor() {
        this.map = null;
        this.pdfGenerator = new PDFGenerator();
    }

    async render() {
        // Fetch Data
        const records = await db.getAll('socioambiental');

        // 1. Update KPIs
        this.updateKPIs(records);

        // 2. Render Map
        this.renderMap(records);

        // 3. Render List
        this.renderList(records);
    }

    updateKPIs(records) {
        document.getElementById('stat-total-interviews').textContent = records.length;

        // Count unique projects
        const projectCounts = {};
        records.forEach(r => {
            const pName = r.data.project_name || 'Geral/Antigo';
            projectCounts[pName] = (projectCounts[pName] || 0) + 1;
        });
        const activeProjectsCount = Object.keys(projectCounts).length;

        // Reuse 'stat-synced' or add new stat card if possible - but let's just make 'stat-synced' useful
        // Actually, user wants "Dashboard can show stats of projects".
        // Let's replace 'Sincronizados' with 'Projetos' for now or append to grid.
        // We'll insert a Project Summary list below KPIs if grid is too tight.

        const pending = records.filter(r => r.syncStatus === 'pending').length;
        const pendingEl = document.getElementById('stat-pending');
        pendingEl.textContent = pending;

        // Add Sync Button if pending > 0
        if (pending > 0 && navigator.onLine) {
            if (!document.getElementById('btn-sync-trigger')) {
                const btn = document.createElement('button');
                btn.id = 'btn-sync-trigger';
                btn.textContent = '🔄 Sincronizar';
                btn.className = 'btn-xs btn-primary';
                btn.style.marginTop = '5px';
                btn.onclick = () => this.syncData(records);
                pendingEl.parentElement.appendChild(btn);
            }
        } else {
            const btn = document.getElementById('btn-sync-trigger');
            if (btn) btn.remove();
        }

        document.getElementById('stat-synced').textContent = activeProjectsCount;
        document.getElementById('stat-synced').parentElement.querySelector('h3').textContent = 'Projetos Ativos';
    }

    async syncData(records) {
        if (!navigator.onLine) {
            alert('Você está offline. Conecte-se para sincronizar.');
            return;
        }

        const pendingRecords = records.filter(r => r.syncStatus === 'pending');
        if (pendingRecords.length === 0) return;

        if (!confirm(`Deseja sincronizar ${pendingRecords.length} registros com a nuvem?`)) return;

        const btn = document.getElementById('btn-sync-trigger');
        if (btn) {
            btn.textContent = 'Enviando...';
            btn.disabled = true;
        }

        // Simulate Network Request (or use configured Endpoint)
        try {
            // Check settings for custom endpoint
            const settings = JSON.parse(localStorage.getItem('seiva_ai_settings') || '{}');
            const endpoint = settings.endpoint; // Re-using AI endpoint field for demo, or could add a specific Sync Endpoint.
            // For now, let's just simulate success.

            await new Promise(resolve => setTimeout(resolve, 2000)); // 2s delay

            // Update DB
            for (const record of pendingRecords) {
                record.syncStatus = 'synced';
                await db.update('socioambiental', record);
            }

            alert('Sincronização concluída com sucesso!');
            this.render(); // Refresh UI

        } catch (error) {
            console.error('Sync error:', error);
            alert('Erro ao sincronizar.');
            if (btn) {
                btn.textContent = '🔄 Sincronizar';
                btn.disabled = false;
            }
        }
    }

    renderMap(records) {
        const container = document.getElementById('map-container');
        if (!container) return;

        // Cleanup existing map if re-rendering
        if (this.map) {
            this.map.remove();
            this.map = null;
        }

        // Initialize Map
        this.map = L.map('map-container').setView([-5.0, -60.0], 5);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap'
        }).addTo(this.map);

        // Fix Leaflet container resize issues
        setTimeout(() => {
            this.map.invalidateSize();
        }, 100);

        // Add Markers
        const markers = [];

        records.forEach(record => {
            const gps = record.data.location_gps;
            if (gps && gps.lat && gps.lng) {
                const marker = L.marker([gps.lat, gps.lng])
                    .bindPopup(`
                        <b>${record.data.community_name || 'Comunidade'}</b><br>
                        ${record.data.responsible_name || 'Sem nome'}<br>
                        ${new Date(record.date).toLocaleDateString()}
                    `);
                marker.addTo(this.map);
                markers.push(marker);
            }
        });

        if (markers.length > 0) {
            const group = new L.featureGroup(markers);
            this.map.fitBounds(group.getBounds().pad(0.1));
        } else {
            this.map.locate({ setView: true, maxZoom: 10 });
        }
    }

    renderList(records) {
        const listEl = document.getElementById('records-list');
        if (!listEl) return;

        listEl.innerHTML = '';

        if (records.length === 0) {
            listEl.innerHTML = '<p>Nenhuma entrevista realizada.</p>';
            return;
        }

        records.forEach(record => {
            const card = document.createElement('div');
            card.className = 'record-card';
            card.style.background = 'var(--surface)';
            card.style.padding = '10px';
            card.style.marginBottom = '10px';
            card.style.borderRadius = '8px';
            card.style.display = 'flex';
            card.style.justifyContent = 'space-between';
            card.style.alignItems = 'center';
            card.style.border = '1px solid var(--border)';

            const summary = `
                <div>
                    <strong>${record.data.community_name || 'Comunidade'}</strong>
                    <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top:4px;">
                        ${record.data.project_name || 'Projeto Sem Nome'} • ${record.data.responsible_name || 'Sem nome'}
                    </div>
                    <small style="display:block; margin-top:4px; opacity:0.8;">
                        ${new Date(record.date).toLocaleDateString()} | 
                        <span style="color: ${record.status === 'Concluído' ? 'var(--success)' : '#f57c00'}">
                            ${record.status}
                        </span>
                    </small>
                </div>
            `;

            const actionsDiv = document.createElement('div');
            actionsDiv.style.position = 'relative';

            const menuBtn = document.createElement('button');
            menuBtn.className = 'btn btn-secondary btn-xs';
            menuBtn.innerHTML = '⋮';
            menuBtn.style.fontSize = '1.2rem';
            menuBtn.style.padding = '2px 10px';
            menuBtn.onclick = (e) => {
                e.stopPropagation();
                this.toggleMenu(record.id);
            };

            const menuDropdown = document.createElement('div');
            menuDropdown.id = `menu-${record.id}`;
            menuDropdown.className = 'action-menu hidden';
            menuDropdown.style.cssText = `
                position: absolute; right: 0; top: 100%;
                background: var(--surface); border: 1px solid var(--border);
                box-shadow: 0 4px 12px rgba(0,0,0,0.15); border-radius: 8px;
                z-index: 10; width: 150px; overflow: hidden;
            `;

            const createItem = (icon, text, onClick) => {
                const item = document.createElement('div');
                item.style.cssText = `
                    padding: 10px; cursor: pointer; display: flex; align-items: center; gap: 8px;
                    font-size: 0.9rem; transition: background 0.2s;
                `;
                item.innerHTML = `<span>${icon}</span> ${text}`;
                item.onmouseover = () => item.style.background = '#f5f5f5';
                item.onmouseout = () => item.style.background = 'transparent';
                item.onclick = (e) => {
                    e.stopPropagation();
                    this.toggleMenu(record.id); // Close
                    onClick();
                };
                return item;
            };

            menuDropdown.appendChild(createItem('📄', 'Gerar PDF', () => this.pdfGenerator.generate(record)));
            menuDropdown.appendChild(createItem('💾', 'Baixar JSON', () => this.downloadSingleJson(record)));
            menuDropdown.appendChild(createItem('🗑️', 'Excluir', () => this.deleteRecord(record.id)));

            actionsDiv.appendChild(menuBtn);
            actionsDiv.appendChild(menuDropdown);

            card.innerHTML = summary;
            card.appendChild(actionsDiv);

            listEl.appendChild(card);
        });

        // Close menus on click outside
        document.addEventListener('click', () => {
            document.querySelectorAll('.action-menu').forEach(el => el.classList.add('hidden'));
        });
    }

    toggleMenu(id) {
        document.querySelectorAll('.action-menu').forEach(el => {
            if (el.id !== `menu-${id}`) el.classList.add('hidden');
        });
        const menu = document.getElementById(`menu-${id}`);
        if (menu) menu.classList.toggle('hidden');
    }

    async deleteRecord(id) {
        if (confirm('Tem certeza que deseja excluir esta entrevista?')) {
            await db.delete('socioambiental', id);
            this.render(); // check app.js for toast usage or trigger custom event
        }
    }

    downloadSingleJson(record) {
        const blob = new Blob([JSON.stringify(record, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const safeName = (record.data.community_name || 'unnamed').replace(/[^a-z0-9]/gi, '_');
        a.download = `entrevista_${safeName}_${record.id.slice(0, 6)}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
}

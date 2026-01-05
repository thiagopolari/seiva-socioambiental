import { db } from '../db.js';

export class DataManager {

    async exportAll() {
        try {
            const records = await db.getAll('socioambiental');
            const exportData = {
                version: 1,
                timestamp: new Date().toISOString(),
                type: 'seiva_backup_full',
                records: records
            };

            const jsonStr = JSON.stringify(exportData, null, 2);
            const blob = new Blob([jsonStr], { type: 'application/json' });
            const filename = `seiva_backup_${new Date().toISOString().slice(0, 10)}.json`;

            this.triggerDownload(blob, filename);
            return true;
        } catch (e) {
            console.error('Export failed:', e);
            alert('Falha na exportação: ' + e.message);
            return false;
        }
    }

    async importData(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = async (e) => {
                try {
                    const content = e.target.result;
                    const parsed = JSON.parse(content);

                    if (!parsed.type || parsed.type !== 'seiva_backup_full') {
                        throw new Error('Arquivo de backup inválido.');
                    }

                    if (!Array.isArray(parsed.records)) {
                        throw new Error('Formato de registros inválido.');
                    }

                    // Bulk insert/update
                    let count = 0;
                    for (const record of parsed.records) {
                        // Sanitize or validate if strict
                        await db.update('socioambiental', record);
                        count++;
                    }

                    alert(`${count} registros importados com sucesso.`);
                    resolve(count);
                } catch (err) {
                    console.error('Import Error:', err);
                    alert('Erro na importação: ' + err.message);
                    reject(err);
                }
            };

            reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
            reader.readAsText(file);
        });
    }

    triggerDownload(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

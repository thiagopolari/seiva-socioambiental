export class SmartParser {

    async parse(file) {
        const name = file.name.toLowerCase();

        if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
            return await this.parseExcel(file);
        } else if (name.endsWith('.json')) {
            return await this.parseJson(file);
        } else {
            return await this.parseText(file);
        }
    }

    async parseExcel(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                    const csv = XLSX.utils.sheet_to_csv(firstSheet);
                    resolve({ content: csv, type: 'Excel Spreadsheet' });
                } catch (err) {
                    reject(err);
                }
            };
            reader.readAsArrayBuffer(file);
        });
    }

    async parseJson(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                // Check if it's a backup first
                try {
                    const obj = JSON.parse(e.target.result);
                    if (obj.type === 'seiva_backup_full') {
                        resolve({ content: e.target.result, type: 'Seiva Backup', isBackup: true });
                    } else {
                        resolve({ content: JSON.stringify(obj, null, 2), type: 'Generic JSON' });
                    }
                } catch (err) {
                    reject('Invalid JSON');
                }
            };
            reader.readAsText(file);
        });
    }

    async parseText(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve({ content: e.target.result, type: 'Text File' });
            reader.readAsText(file);
        });
    }
}

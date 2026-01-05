import { SocioambientalFormSchema } from '../forms/socioambiental-form.js';

export class ExcelGenerator {

    generate(records) {
        if (!records || records.length === 0) {
            alert('Sem dados para exportar.');
            return;
        }

        const flattenedData = records.map(record => this.flattenRecord(record));

        const worksheet = XLSX.utils.json_to_sheet(flattenedData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Entrevistas");

        const fname = `Seiva_Dados_${new Date().toISOString().slice(0, 10)}.xlsx`;
        XLSX.writeFile(workbook, fname);
    }

    flattenRecord(record) {
        const flat = {};
        const data = record.data;

        flat['ID'] = record.id;
        flat['Status'] = record.status;
        flat['Data Sinc'] = record.date;

        // Iterate Schema to ensure order and headers
        SocioambientalFormSchema.sections.forEach(section => {
            section.fields.forEach(field => {
                const value = data[field.id];
                const header = field.label; // Or field.id if preferred for processing

                if (field.type === 'gps') {
                    if (value && value.lat) {
                        flat[`${header} (Lat)`] = value.lat;
                        flat[`${header} (Lng)`] = value.lng;
                        flat[`${header} (Prec)`] = value.accuracy;
                    } else {
                        flat[`${header} (Lat)`] = '';
                        flat[`${header} (Lng)`] = '';
                    }
                }
                else if (field.type === 'photo') {
                    const photos = Array.isArray(value) ? value : (value ? [value] : []);
                    flat[header] = photos.length > 0 ? `${photos.length} Fotos` : 'Sem foto';
                }
                else if (field.type === 'signature') {
                    flat[header] = value ? 'Assinado' : 'Não';
                }
                else if (Array.isArray(value)) {
                    flat[header] = value.join(', ');
                }
                else {
                    flat[header] = value || '';
                }
            });
        });

        return flat;
    }
}

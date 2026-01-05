import { SocioambientalFormSchema } from '../forms/socioambiental-form.js';

export class PDFGenerator {
    constructor() {
        this.doc = null;
    }

    async generate(record) {
        const { jsPDF } = window.jspdf;
        this.doc = new jsPDF();

        const schema = SocioambientalFormSchema;
        const data = record.data;
        let yPos = 20;
        const margin = 20;
        const pageWidth = this.doc.internal.pageSize.getWidth();
        const contentWidth = pageWidth - (margin * 2);

        // Header
        this.doc.setFontSize(18);
        this.doc.setTextColor(26, 71, 42); // Primary Green
        this.doc.text('Relatório Socioambiental - Seiva', margin, yPos);
        yPos += 10;

        this.doc.setFontSize(10);
        this.doc.setTextColor(100);
        this.doc.text(`ID: ${record.id} | Data: ${new Date(record.date).toLocaleDateString()}`, margin, yPos);
        yPos += 15;

        // Iterate Sections
        schema.sections.forEach(section => {
            // Check page break
            if (yPos > 270) {
                this.doc.addPage();
                yPos = 20;
            }

            // Section Title
            this.doc.setFontSize(14);
            this.doc.setTextColor(0);
            this.doc.setFillColor(240, 253, 244); // Light green bg
            this.doc.rect(margin, yPos - 5, contentWidth, 8, 'F');
            this.doc.text(section.title, margin + 2, yPos);
            yPos += 12;

            // Fields
            section.fields.forEach(field => {
                const value = data[field.id];
                if (!value) return; // Skip empty? Or show 'N/A'

                // Check page break
                if (yPos > 270) {
                    this.doc.addPage();
                    yPos = 20;
                }

                this.doc.setFontSize(10);
                this.doc.setTextColor(80);

                // Handle complex types
                if (field.type === 'photo') {
                    // Check if value is array (our PhotoCapture returns array) or single
                    const photos = Array.isArray(value) ? value : [value];
                    if (photos.length > 0) {
                        this.doc.text(`${field.label}:`, margin, yPos);
                        yPos += 5;

                        let photoX = margin;
                        photos.forEach(photoObj => {
                            const imgData = photoObj.base64 || photoObj; // Handle structure
                            if (typeof imgData === 'string' && imgData.startsWith('data:image')) {
                                try {
                                    this.doc.addImage(imgData, 'JPEG', photoX, yPos, 40, 40);
                                    photoX += 45;
                                } catch (e) {
                                    console.warn('Error adding image', e);
                                    this.doc.text('[Erro na imagem]', photoX, yPos + 10);
                                }
                            }
                        });
                        yPos += 45; // Height of image + gap
                    }
                } else if (field.type === 'signature') {
                    if (typeof value === 'string' && value.startsWith('data:image')) {
                        this.doc.text(`${field.label}:`, margin, yPos);
                        yPos += 5;
                        this.doc.addImage(value, 'PNG', margin, yPos, 60, 30);
                        yPos += 35;
                    }
                } else if (field.type === 'gps') {
                    const formatted = value.lat ? `${value.lat.toFixed(6)}, ${value.lng.toFixed(6)}` : JSON.stringify(value);
                    this.doc.text(`${field.label}: ${formatted}`, margin, yPos);
                    yPos += 7;
                } else {
                    // Text/Select/Number
                    let textVal = value;
                    if (Array.isArray(value)) textVal = value.join(', ');

                    // Split text if too long
                    const label = `${field.label}: `;
                    this.doc.setFont(undefined, 'bold');
                    this.doc.text(label, margin, yPos);

                    this.doc.setFont(undefined, 'normal');
                    const labelWidth = this.doc.getTextWidth(label);
                    const remainingWidth = contentWidth - labelWidth;

                    const splitText = this.doc.splitTextToSize(String(textVal), remainingWidth);
                    this.doc.text(splitText, margin + labelWidth, yPos);

                    yPos += (splitText.length * 5) + 3;
                }
            });

            yPos += 5; // Section gap
        });

        const safeName = (record.data.community_name || 'Seiva').replace(/[^a-z0-9]/gi, '_');
        const fname = `Relatorio_${safeName}_${record.id.substr(0, 6)}.pdf`;
        this.doc.save(fname);
    }
}

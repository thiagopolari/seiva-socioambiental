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

        // --- Styles ---
        const colors = {
            primary: [26, 71, 42],     // Dark Green
            secondary: [240, 253, 244],// Light Green
            text: [60, 60, 60],        // Dark Gray
            label: [100, 100, 100]     // Gray
        };

        // --- Helper: Check Page Break ---
        const checkPageBreak = (spaceNeeded = 20) => {
            if (yPos + spaceNeeded > 280) {
                this.doc.addPage();
                yPos = 20;
                // Repeat Header on new page (optional, keeping clean for now)
            }
        };

        // --- Cover / Header ---
        this.doc.setFillColor(...colors.primary);
        this.doc.rect(0, 0, pageWidth, 5, 'F'); // Top bar

        yPos = 30;
        this.doc.setFont("helvetica", "bold");
        this.doc.setFontSize(22);
        this.doc.setTextColor(...colors.primary);
        this.doc.text('Relatório Socioambiental - Seiva', margin, yPos);
        yPos += 10;

        // Metadata Box
        this.doc.setDrawColor(200);
        this.doc.setFillColor(250, 250, 250);
        this.doc.roundedRect(margin, yPos, contentWidth, 25, 3, 3, 'FD');

        this.doc.setFontSize(10);
        this.doc.setTextColor(...colors.text);
        this.doc.setFont("helvetica", "normal");

        this.doc.text(`ID do Registro: ${record.id}`, margin + 5, yPos + 8);
        this.doc.text(`Data da Coleta: ${new Date(record.date).toLocaleDateString()}`, margin + 5, yPos + 16);

        const community = data.community_name || 'Comunidade não informada';
        const interviewer = data.interviewer_name || 'Não identificado';

        this.doc.text(`Comunidade: ${community}`, margin + contentWidth / 2, yPos + 8);
        this.doc.text(`Entrevistador: ${interviewer}`, margin + contentWidth / 2, yPos + 16);

        yPos += 40;

        // --- Sections --- //
        schema.sections.forEach(section => {
            checkPageBreak(30);

            // Section Header
            this.doc.setFont("helvetica", "bold");
            this.doc.setFontSize(14);
            this.doc.setTextColor(...colors.primary);
            this.doc.setDrawColor(...colors.primary);

            // Background for title
            this.doc.setFillColor(...colors.secondary);
            this.doc.rect(margin, yPos - 6, contentWidth, 10, 'F');

            // Clean Title (Strip Emojis)
            const cleanTitle = section.title.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F000}-\u{1F02F}]|[\u{1F0A0}-\u{1F0FF}]/gu, '').trim();
            this.doc.text(cleanTitle, margin + 5, yPos);

            // Underline
            this.doc.line(margin, yPos + 4, margin + contentWidth, yPos + 4);

            yPos += 15;

            // Fields
            section.fields.forEach(field => {
                const value = data[field.id];
                if (value === undefined || value === null || value === '') return;

                // Formatting Value
                let displayValue = String(value);
                if (Array.isArray(value)) displayValue = value.join(', ');
                if (field.type === 'gps' && value.lat) {
                    displayValue = `Lat: ${value.lat.toFixed(6)}, Lng: ${value.lng.toFixed(6)} (Prec: ${value.accuracy}m)`;
                }

                checkPageBreak(field.type === 'photo' || field.type === 'map' ? 60 : 15);

                // Render based on type
                if (field.type === 'photo' || field.type === 'signature') {
                    // Label
                    this.doc.setFont("helvetica", "bold");
                    this.doc.setFontSize(10);
                    this.doc.setTextColor(...colors.text);
                    this.doc.text(field.label, margin, yPos);
                    yPos += 5;

                    const images = Array.isArray(value) ? value : [value];
                    let imgX = margin;

                    images.forEach(img => {
                        const imgData = img.base64 || img;
                        if (typeof imgData === 'string' && imgData.startsWith('data:image')) {
                            try {
                                // Add Image
                                const imgH = field.type === 'signature' ? 30 : 50;
                                const imgW = field.type === 'signature' ? 60 : 50;
                                this.doc.addImage(imgData, field.type === 'signature' ? 'PNG' : 'JPEG', imgX, yPos, imgW, imgH);
                                imgX += imgW + 5;
                            } catch (e) {
                                console.warn('PDF Image Error', e);
                            }
                        }
                    });
                    yPos += (field.type === 'signature' ? 35 : 55);

                } else {
                    // Standard Text Field
                    this.doc.setFont("helvetica", "bold");
                    this.doc.setFontSize(10);
                    this.doc.setTextColor(...colors.label);

                    this.doc.text(field.label + ":", margin, yPos);

                    // Split content to avoid overlap
                    const labelWidth = this.doc.getTextWidth(field.label + ":");
                    const availableWidth = contentWidth - labelWidth - 5;

                    this.doc.setFont("helvetica", "normal");
                    this.doc.setTextColor(0); // Black for value

                    // Multi-line value support
                    const splitText = this.doc.splitTextToSize(displayValue, availableWidth);
                    this.doc.text(splitText, margin + labelWidth + 5, yPos);

                    // Advancing Y based on lines
                    yPos += (splitText.length * 5) + 3;
                }
            });

            yPos += 5; // Extra gap after section
        });

        // Footer
        const pageCount = this.doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            this.doc.setPage(i);
            this.doc.setFontSize(8);
            this.doc.setTextColor(150);
            this.doc.text(`Página ${i} de ${pageCount} - Gerado por Seiva Socioambiental`, pageWidth / 2, 290, { align: 'center' });
        }

        const safeName = (data.community_name || 'Seiva').replace(/[^a-z0-9]/gi, '_');
        this.doc.save(`Relatorio_Tecnico_${safeName}_${record.id.slice(0, 6)}.pdf`);
    }
}

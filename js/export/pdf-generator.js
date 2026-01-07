import { SocioambientalFormSchema } from '../forms/socioambiental-form.js';

export class PDFGenerator {
    constructor() {
        this.doc = null;
    }

    // Helper function to sanitize text for PDF (remove problematic characters)
    sanitizeText(text) {
        if (!text) return '';
        return String(text)
            // Remove emojis
            .replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F000}-\u{1F02F}]|[\u{1F0A0}-\u{1F0FF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{2702}-\u{27B0}]/gu, '')
            // Replace smart quotes and special characters
            .replace(/[\u2018\u2019]/g, "'")
            .replace(/[\u201C\u201D]/g, '"')
            .replace(/\u2026/g, '...')
            .replace(/\u2013/g, '-')
            .replace(/\u2014/g, '-')
            .trim();
    }

    // Translate common English terms to Portuguese
    translateLabel(label) {
        const translations = {
            'Yes': 'Sim',
            'No': 'Não',
            'true': 'Sim',
            'false': 'Não',
            'undefined': 'Não informado',
            'null': 'Não informado',
            'Select': 'Selecione',
            'Other': 'Outro',
            'None': 'Nenhum'
        };
        return translations[label] || label;
    }

    async generate(record) {
        const { jsPDF } = window.jspdf;
        this.doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const schema = SocioambientalFormSchema;
        const data = record.data || {};
        let yPos = 15;
        const margin = 15;
        const pageWidth = this.doc.internal.pageSize.getWidth();
        const pageHeight = this.doc.internal.pageSize.getHeight();
        const contentWidth = pageWidth - (margin * 2);

        // Color palette (professional green theme)
        const colors = {
            primary: [26, 71, 42],       // Dark Forest Green
            primaryLight: [34, 197, 94], // Bright Green
            secondary: [240, 253, 244],  // Very Light Green
            text: [31, 41, 55],          // Dark Gray
            textMuted: [107, 114, 128],  // Medium Gray
            border: [229, 231, 235],     // Light Gray Border
            white: [255, 255, 255]
        };

        // Helper: Add new page with header
        const addNewPage = () => {
            this.doc.addPage();
            yPos = 20;
        };

        // Helper: Check page break
        const checkPageBreak = (spaceNeeded = 20) => {
            if (yPos + spaceNeeded > pageHeight - 25) {
                addNewPage();
                return true;
            }
            return false;
        };

        // =============================================
        // COVER PAGE / HEADER
        // =============================================

        // Top gradient bar
        this.doc.setFillColor(...colors.primary);
        this.doc.rect(0, 0, pageWidth, 8, 'F');

        // Logo area
        yPos = 20;
        this.doc.setFillColor(...colors.secondary);
        this.doc.roundedRect(margin, yPos, contentWidth, 35, 4, 4, 'F');

        // Title
        this.doc.setFont('helvetica', 'bold');
        this.doc.setFontSize(20);
        this.doc.setTextColor(...colors.primary);
        this.doc.text('Relatorio Tecnico Socioambiental', margin + 5, yPos + 12);

        // Subtitle
        this.doc.setFont('helvetica', 'normal');
        this.doc.setFontSize(11);
        this.doc.setTextColor(...colors.textMuted);
        this.doc.text('Sistema Seiva - Coleta e Analise de Dados', margin + 5, yPos + 20);

        // Date and ID
        const today = new Date(record.date || Date.now()).toLocaleDateString('pt-BR');
        this.doc.setFontSize(9);
        this.doc.text(`Data: ${today}  |  ID: ${(record.id || 'N/A').substring(0, 12)}`, margin + 5, yPos + 28);

        yPos += 45;

        // =============================================
        // METADATA SECTION
        // =============================================

        this.doc.setFont('helvetica', 'bold');
        this.doc.setFontSize(12);
        this.doc.setTextColor(...colors.primary);
        this.doc.text('Informacoes Gerais', margin, yPos);
        yPos += 8;

        // Metadata box
        this.doc.setDrawColor(...colors.border);
        this.doc.setFillColor(250, 251, 252);
        this.doc.roundedRect(margin, yPos, contentWidth, 28, 3, 3, 'FD');

        this.doc.setFont('helvetica', 'normal');
        this.doc.setFontSize(9);
        this.doc.setTextColor(...colors.text);

        const metaItems = [
            ['Projeto', this.sanitizeText(data.project_name) || 'Nao informado'],
            ['Comunidade', this.sanitizeText(data.community_name) || 'Nao informada'],
            ['Entrevistador', this.sanitizeText(data.interviewer_name) || 'Nao identificado'],
            ['Responsavel', this.sanitizeText(data.responsible_name) || 'Nao informado']
        ];

        let metaX = margin + 5;
        let metaY = yPos + 8;
        const colWidth = contentWidth / 2 - 5;

        metaItems.forEach((item, idx) => {
            const col = idx % 2;
            const row = Math.floor(idx / 2);
            const x = metaX + (col * colWidth);
            const y = metaY + (row * 10);

            this.doc.setFont('helvetica', 'bold');
            this.doc.setTextColor(...colors.textMuted);
            this.doc.text(item[0] + ':', x, y);

            this.doc.setFont('helvetica', 'normal');
            this.doc.setTextColor(...colors.text);
            this.doc.text(item[1], x + 25, y);
        });

        yPos += 38;

        // GPS if available
        if (data.location_gps && data.location_gps.lat) {
            this.doc.setFont('helvetica', 'italic');
            this.doc.setFontSize(8);
            this.doc.setTextColor(...colors.textMuted);
            this.doc.text(
                `Coordenadas GPS: ${data.location_gps.lat.toFixed(6)}, ${data.location_gps.lng.toFixed(6)}`,
                margin, yPos
            );
            yPos += 8;
        }

        // =============================================
        // SECTIONS
        // =============================================

        schema.sections.forEach((section, sectionIdx) => {
            checkPageBreak(35);

            // Section Header
            this.doc.setFillColor(...colors.primary);
            this.doc.roundedRect(margin, yPos, contentWidth, 10, 2, 2, 'F');

            this.doc.setFont('helvetica', 'bold');
            this.doc.setFontSize(11);
            this.doc.setTextColor(...colors.white);

            const sectionTitle = this.sanitizeText(section.title) || `Secao ${sectionIdx + 1}`;
            this.doc.text(`${sectionIdx + 1}. ${sectionTitle}`, margin + 4, yPos + 7);

            yPos += 15;

            // Fields
            section.fields.forEach(field => {
                const value = data[field.id];

                // Skip empty values
                if (value === undefined || value === null || value === '') return;

                checkPageBreak(field.type === 'photo' || field.type === 'signature' ? 65 : 18);

                // Format display value
                let displayValue = '';
                if (Array.isArray(value)) {
                    displayValue = value.map(v => this.translateLabel(this.sanitizeText(v))).join(', ');
                } else if (field.type === 'gps' && value && value.lat) {
                    displayValue = `Latitude: ${value.lat.toFixed(6)}, Longitude: ${value.lng.toFixed(6)}` +
                        (value.accuracy ? ` (Precisao: ${Math.round(value.accuracy)}m)` : '');
                } else {
                    displayValue = this.translateLabel(this.sanitizeText(value));
                }

                // Handle images (photos, signatures)
                if ((field.type === 'photo' || field.type === 'signature') && value) {
                    this.doc.setFont('helvetica', 'bold');
                    this.doc.setFontSize(9);
                    this.doc.setTextColor(...colors.text);
                    this.doc.text(this.sanitizeText(field.label) + ':', margin, yPos);
                    yPos += 5;

                    const images = Array.isArray(value) ? value : [value];
                    let imgX = margin;

                    images.forEach(img => {
                        const imgData = img && (img.base64 || img);
                        if (typeof imgData === 'string' && imgData.startsWith('data:image')) {
                            try {
                                const imgW = field.type === 'signature' ? 50 : 45;
                                const imgH = field.type === 'signature' ? 25 : 35;
                                this.doc.addImage(imgData, 'PNG', imgX, yPos, imgW, imgH);
                                imgX += imgW + 5;
                            } catch (e) {
                                console.warn('Erro ao adicionar imagem no PDF:', e);
                                this.doc.setFont('helvetica', 'italic');
                                this.doc.setTextColor(200, 0, 0);
                                this.doc.text('[Imagem nao carregada]', imgX, yPos + 10);
                            }
                        }
                    });

                    yPos += (field.type === 'signature' ? 30 : 40);

                } else if (displayValue) {
                    // Standard text field
                    this.doc.setFont('helvetica', 'bold');
                    this.doc.setFontSize(9);
                    this.doc.setTextColor(...colors.textMuted);

                    const label = this.sanitizeText(field.label) + ':';
                    this.doc.text(label, margin, yPos);

                    const labelWidth = this.doc.getTextWidth(label) + 3;
                    const valueWidth = contentWidth - labelWidth - 5;

                    this.doc.setFont('helvetica', 'normal');
                    this.doc.setTextColor(...colors.text);

                    const lines = this.doc.splitTextToSize(displayValue, valueWidth);
                    this.doc.text(lines, margin + labelWidth, yPos);

                    yPos += (lines.length * 4.5) + 4;
                }
            });

            yPos += 8; // Gap after section
        });

        // =============================================
        // FOOTER ON ALL PAGES
        // =============================================

        const totalPages = this.doc.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            this.doc.setPage(i);

            // Footer line
            this.doc.setDrawColor(...colors.border);
            this.doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);

            // Footer text
            this.doc.setFont('helvetica', 'normal');
            this.doc.setFontSize(8);
            this.doc.setTextColor(...colors.textMuted);
            this.doc.text(
                `Pagina ${i} de ${totalPages} - Gerado por Sistema Seiva Socioambiental`,
                pageWidth / 2,
                pageHeight - 10,
                { align: 'center' }
            );
        }

        // Save file
        const safeName = this.sanitizeText(data.community_name || data.project_name || 'Relatorio')
            .replace(/[^a-zA-Z0-9]/g, '_')
            .substring(0, 30);
        const shortId = (record.id || 'XXXX').substring(0, 6);

        this.doc.save(`Relatorio_Seiva_${safeName}_${shortId}.pdf`);
    }
}

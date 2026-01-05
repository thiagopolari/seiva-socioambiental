import { GPSCapture } from './gps-capture.js';
import { PhotoCapture } from './photo-capture.js';
import { SignatureWidget } from './signature-pad.js';

export class FormEngine {
    constructor(containerId, formSchema) {
        this.container = document.getElementById(containerId);
        this.schema = formSchema;
        this.formData = {};
        this.fieldRegistry = {}; // Map field ID to DOM element
        this.componentRegistry = {}; // Map field ID to Class Instance
    }

    render() {
        this.container.innerHTML = '';
        this.schema.sections.forEach(section => {
            const sectionEl = this.renderSection(section);
            this.container.appendChild(sectionEl);
        });

        // Initialize Logic (Dependencies)
        this.evaluateDependencies();
    }

    renderSection(section) {
        const wrapper = document.createElement('div');
        wrapper.className = 'form-section';
        if (section.id) wrapper.id = `section-${section.id}`;

        const title = document.createElement('h3');
        title.textContent = section.title;
        wrapper.appendChild(title);

        section.fields.forEach(field => {
            const fieldEl = this.renderField(field);
            wrapper.appendChild(fieldEl);
        });

        return wrapper;
    }

    renderField(field) {
        const group = document.createElement('div');
        group.className = 'form-group';
        group.id = `group-${field.id}`;

        // Label
        if (field.label) {
            const label = document.createElement('label');
            label.textContent = field.label + (field.required ? ' *' : '');
            label.setAttribute('for', field.id);
            group.appendChild(label);
        }

        // Input
        let input;

        switch (field.type) {
            case 'text':
            case 'number':
            case 'date':
            case 'time':
            case 'email':
                input = document.createElement('input');
                input.type = field.type;
                input.className = 'form-control';
                input.id = field.id;
                input.name = field.id;
                if (field.placeholder) input.placeholder = field.placeholder;
                break;

            case 'textarea':
                input = document.createElement('textarea');
                input.className = 'form-control';
                input.id = field.id;
                input.name = field.id;
                input.rows = 4;
                break;

            case 'select':
                input = document.createElement('select');
                input.className = 'form-control';
                input.id = field.id;
                input.name = field.id;
                // Add empty option
                const defaultOpt = document.createElement('option');
                defaultOpt.value = "";
                defaultOpt.textContent = "Selecione...";
                input.appendChild(defaultOpt);

                field.options.forEach(opt => {
                    const option = document.createElement('option');
                    if (typeof opt === 'string') {
                        option.value = opt;
                        option.textContent = opt;
                    } else {
                        option.value = opt.value;
                        option.textContent = opt.label;
                    }
                    input.appendChild(option);
                });
                break;

            case 'multiselect': // Simplified as checkboxes for now or multiple select
            case 'multicheckbox':
                input = document.createElement('div');
                input.className = 'checkbox-group';
                field.options.forEach((opt, idx) => {
                    const item = document.createElement('label');
                    item.className = 'checkbox-item';

                    const cb = document.createElement('input');
                    cb.type = 'checkbox';
                    cb.name = field.id;
                    const val = typeof opt === 'string' ? opt : opt.value;
                    const lbl = typeof opt === 'string' ? opt : opt.label;
                    cb.value = val;
                    cb.dataset.parent = field.id;

                    cb.addEventListener('change', () => this.handleMultiChange(field.id));

                    item.appendChild(cb);
                    item.appendChild(document.createTextNode(lbl));
                    input.appendChild(item);
                });
                break;

            case 'radio':
                input = document.createElement('div');
                input.className = 'radio-group';
                field.options.forEach((opt, idx) => {
                    const item = document.createElement('label');
                    item.className = 'radio-item';

                    const rb = document.createElement('input');
                    rb.type = 'radio';
                    rb.name = field.id;
                    const val = typeof opt === 'string' ? opt : opt.value;
                    const lbl = typeof opt === 'string' ? opt : opt.label;
                    rb.value = val;

                    item.appendChild(rb);
                    item.appendChild(document.createTextNode(lbl));
                    input.appendChild(item);
                });
                break;

            // Specialized Components
            case 'gps':
                input = document.createElement('div');
                input.id = `gps-${field.id}`;
                input.className = 'component-wrapper gps-wrapper';
                // Defer initialization to after append
                setTimeout(() => {
                    this.componentRegistry[field.id] = new GPSCapture(input.id, {
                        onChange: (val) => this.formData[field.id] = val
                    });
                }, 0);
                break;

            case 'photo':
                input = document.createElement('div');
                input.id = `photo-${field.id}`;
                input.className = 'component-wrapper photo-wrapper';
                setTimeout(() => {
                    this.componentRegistry[field.id] = new PhotoCapture(input.id, {
                        onChange: (val) => this.formData[field.id] = val
                    });
                }, 0);
                break;

            case 'signature':
                input = document.createElement('div');
                input.id = `sig-${field.id}`;
                input.className = 'component-wrapper signature-wrapper';
                setTimeout(() => {
                    this.componentRegistry[field.id] = new SignatureWidget(input.id, {
                        onChange: (val) => this.formData[field.id] = val
                    });
                }, 0);
                break;

            case 'slider':
                input = document.createElement('div');
                input.className = 'slider-container';
                const range = document.createElement('input');
                range.type = 'range';
                range.min = field.min || 1;
                range.max = field.max || 5;
                range.step = field.step || 1;
                range.id = field.id;
                range.className = 'form-control';

                const output = document.createElement('span');
                output.style.marginLeft = '10px';
                output.style.fontWeight = 'bold';
                output.textContent = range.value;
                range.setAttribute('data-target-output', field.id); // Helper for listeners

                range.addEventListener('input', (e) => {
                    output.textContent = e.target.value;
                    this.formData[field.id] = e.target.value;
                });

                input.appendChild(range);
                input.appendChild(output);
                break;

            default:
                input = document.createElement('div');
                input.textContent = `Unknown field type: ${field.type}`;
        }

        // Event Listener for change (standard inputs)
        if (input.tagName === 'INPUT' || input.tagName === 'SELECT' || input.tagName === 'TEXTAREA') {
            input.addEventListener('change', (e) => {
                this.formData[field.id] = e.target.value;
                this.evaluateDependencies();
            });
            input.addEventListener('input', (e) => {
                this.formData[field.id] = e.target.value; // Real-time update
            });
        }

        // Listen for radio changes
        if (field.type === 'radio') {
            const radios = input.querySelectorAll('input[type="radio"]');
            radios.forEach(r => {
                r.addEventListener('change', (e) => {
                    if (e.target.checked) {
                        this.formData[field.id] = e.target.value;
                        this.evaluateDependencies();
                    }
                });
            });
        }

        group.appendChild(input);

        // Store reference
        this.fieldRegistry[field.id] = { element: group, config: field, input: input };

        return group;
    }

    handleMultiChange(fieldId) {
        const checked = Array.from(document.querySelectorAll(`input[name="${fieldId}"]:checked`)).map(cb => cb.value);
        this.formData[fieldId] = checked;
        this.evaluateDependencies();
    }

    evaluateDependencies() {
        // Iterate all fields to check visibility conditions
        Object.keys(this.fieldRegistry).forEach(fieldId => {
            const { element, config } = this.fieldRegistry[fieldId];
            if (config.condition) {
                const shouldShow = this.checkCondition(config.condition);
                element.style.display = shouldShow ? 'block' : 'none';
            }
        });
    }

    checkCondition(condition) {
        // Simple condition: { field: 'otherField', equals: 'value' } or contains
        const targetValue = this.formData[condition.field];

        if (condition.equals !== undefined) {
            // Handle boolean conversion if needed
            if (condition.equals === true || condition.equals === false) {
                return targetValue === condition.equals || targetValue === String(condition.equals);
            }
            return targetValue === condition.equals;
        }
        if (condition.contains !== undefined) {
            return Array.isArray(targetValue) && targetValue.includes(condition.contains);
        }
        return true;
    }

    getData() {
        // Ensure we get latest data from complex components
        Object.keys(this.componentRegistry).forEach(fieldId => {
            const component = this.componentRegistry[fieldId];
            if (component.getValue) {
                this.formData[fieldId] = component.getValue();
            }
        });
        return this.formData;
    }
}

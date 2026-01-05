export class GPSCapture {
    constructor(elementId, options = {}) {
        this.container = document.getElementById(elementId);
        if (!this.container) return;

        this.options = options;
        this.map = null;
        this.marker = null;
        this.value = null; // { lat, lng, accuracy, timestamp }

        this.render();
    }

    render() {
        this.container.innerHTML = `
            <div class="gps-widget">
                <div class="gps-controls">
                    <button type="button" class="btn btn-primary btn-capture-gps">
                        📍 Capturar Coordenadas
                    </button>
                    <span class="gps-status">Aguardando...</span>
                </div>
                <div class="gps-coords-display"></div>
                <div id="map-${this.container.id}" class="gps-map-preview" style="height: 250px; width: 100%; margin-top: 10px; border-radius: 8px;"></div>
            </div>
        `;

        this.container.querySelector('.btn-capture-gps').addEventListener('click', () => this.capture());
    }

    async capture() {
        const statusEl = this.container.querySelector('.gps-status');
        const coordsEl = this.container.querySelector('.gps-coords-display');

        statusEl.textContent = 'Obtendo sinal GPS...';

        if (!navigator.geolocation) {
            statusEl.textContent = 'GPS não suportado neste dispositivo.';
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude, accuracy } = position.coords;
                this.value = {
                    lat: latitude,
                    lng: longitude,
                    accuracy: accuracy,
                    timestamp: new Date().toISOString()
                };

                statusEl.textContent = 'Localização obtida!';
                coordsEl.textContent = `Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)} (Prec: ${accuracy.toFixed(0)}m)`;

                this.updateMap(latitude, longitude);

                if (this.options.onChange) this.options.onChange(this.value);
            },
            (error) => {
                console.error('GPS Error:', error);
                let msg = 'Erro ao obter GPS.';
                if (error.code === 1) msg = 'Permissão negada.';
                if (error.code === 2) msg = 'Sinal indisponível.';
                if (error.code === 3) msg = 'Tempo limite esgotado.';
                statusEl.textContent = msg;
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    }

    updateMap(lat, lng) {
        const mapId = `map-${this.container.id}`;

        if (!this.map) {
            this.map = L.map(mapId).setView([lat, lng], 15);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap'
            }).addTo(this.map);

            // Fix Leaflet container resize issues
            setTimeout(() => {
                this.map.invalidateSize();
            }, 100);
        } else {
            this.map.setView([lat, lng], 15);
        }

        if (this.marker) {
            this.marker.setLatLng([lat, lng]);
        } else {
            this.marker = L.marker([lat, lng]).addTo(this.map);
        }
    }

    getValue() {
        return this.value;
    }
}

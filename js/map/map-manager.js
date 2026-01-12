export class MapManager {
    constructor(elementId) {
        this.elementId = elementId;
        this.map = null;
        this.markersLayer = null;
        this.drawControl = null;
        this.drawnItems = null; // FeatureGroup for drawn polygons
    }

    initialize() {
        if (this.map) return; // Already initialized

        const mapElement = document.getElementById(this.elementId);
        if (!mapElement) return;

        // Initialize Map
        this.map = L.map(this.elementId).setView([-15.78, -47.93], 4);

        // Add Base Layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: 'Seiva Socioambiental | OpenStreetMap',
            maxZoom: 19
        }).addTo(this.map);

        // Initialize Layer Groups
        this.markersLayer = L.layerGroup().addTo(this.map);
        this.drawnItems = L.featureGroup().addTo(this.map);

        // Initialize Drawing Controls
        this.setupDrawControls();

        // Setup Event Listeners
        this.setupEvents();
    }

    setupDrawControls() {
        if (!L.Control.Draw) {
            console.warn('Leaflet.Draw not loaded');
            return;
        }

        // Configure Draw Control - Only Polygons for now
        this.drawControl = new L.Control.Draw({
            draw: {
                polygon: {
                    allowIntersection: false,
                    showArea: true,
                    shapeOptions: {
                        color: '#16a34a', // Primary Green
                        fillOpacity: 0.2
                    }
                },
                marker: false,
                circle: false,
                circlemarker: false,
                rectangle: true, // Allow rectangles too
                polyline: false
            },
            edit: {
                featureGroup: this.drawnItems,
                remove: true
            }
        });

        this.map.addControl(this.drawControl);

        // Handle Draw Events
        this.map.on(L.Draw.Event.CREATED, (e) => {
            const layer = e.layer;
            this.drawnItems.addLayer(layer);
            
            // Calculate Area (approximate)
            if (e.layerType === 'polygon' || e.layerType === 'rectangle') {
                const area = L.GeometryUtil.geodesicArea(layer.getLatLngs()[0]);
                const areaHectares = (area / 10000).toFixed(2);
                layer.bindPopup(`Area: ${areaHectares} ha`).openPopup();
            }
        });
    }

    setupEvents() {
        // External controls (Buttons outside map)
        const btnDrawPoly = document.getElementById('btn-draw-polygon');
        if (btnDrawPoly) {
            btnDrawPoly.addEventListener('click', () => {
                // Programmatically start drawing
                new L.Draw.Polygon(this.map, this.drawControl.options.draw.polygon).enable();
            });
        }

        const btnClear = document.getElementById('btn-clear-drawings');
        if (btnClear) {
            btnClear.addEventListener('click', () => {
                if (confirm('Limpar todos os desenhos do mapa?')) {
                    this.drawnItems.clearLayers();
                }
            });
        }

        const btnExportKml = document.getElementById('btn-export-kml');
        if (btnExportKml) {
            btnExportKml.addEventListener('click', () => this.exportKML());
        }

        // Filters
        const checkPoints = document.getElementById('layer-points');
        if (checkPoints) {
            checkPoints.addEventListener('change', (e) => {
                if (e.target.checked) this.map.addLayer(this.markersLayer);
                else this.map.removeLayer(this.markersLayer);
            });
        }
    }

    async loadMarkers(records, projectFilter = null) {
        if (!this.map) return;

        this.markersLayer.clearLayers();
        const bounds = L.latLngBounds();

        records.forEach(record => {
            if (!record.data?.location_gps?.lat) return;
            if (projectFilter && record.data.project_name !== projectFilter) return;

            const { lat, lng } = record.data.location_gps;
            
            // Create nice custom marker or default
            const marker = L.marker([lat, lng])
                .bindPopup(`
                    <div style="min-width: 200px">
                        <strong>${record.data.project_name || 'Sem Projeto'}</strong><br>
                        <small>${record.data.community_name || 'N/A'}</small><br>
                        <hr style="margin: 5px 0">
                        Date: ${new Date(record.date).toLocaleDateString('pt-BR')}<br>
                        Status: ${record.status || 'N/A'}
                    </div>
                `);
            
            this.markersLayer.addLayer(marker);
            bounds.extend([lat, lng]);
        });

        // Fit bounds if we have markers
        if (this.markersLayer.getLayers().length > 0) {
            this.map.fitBounds(bounds, { padding: [50, 50] });
        }
    }

    exportKML() {
        if (this.drawnItems.getLayers().length === 0) {
            alert('Nenhum desenho para exportar.');
            return;
        }

        // Simple KML Generator for Polygons
        let kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Seiva Map Export</name>
`;

        this.drawnItems.eachLayer(layer => {
            if (layer instanceof L.Polygon) {
                const latlngs = layer.getLatLngs()[0];
                const coords = latlngs.map(ll => `${ll.lng},${ll.lat},0`).join(' ');
                // Close the loop
                const first = latlngs[0];
                const coordsClosed = `${coords} ${first.lng},${first.lat},0`;

                kml += `    <Placemark>
      <name>Polygon</name>
      <Polygon>
        <outerBoundaryIs>
          <LinearRing>
            <coordinates>${coordsClosed}</coordinates>
          </LinearRing>
        </outerBoundaryIs>
      </Polygon>
    </Placemark>
`;
            }
        });

        kml += `  </Document>
</kml>`;

        // Download
        const blob = new Blob([kml], { type: 'application/vnd.google-earth.kml+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `map_export_${Date.now()}.kml`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
}

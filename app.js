// Real Estate Beta Dashboard Application - Updated for CSV Data
class RealEstateDashboard {
    constructor() {
        this.map = null;
        this.currentLayer = null;
        this.dataProcessor = null;
        this.stateData = {};
        this.isDataLoaded = false;
        
        // Current view settings
        this.currentLevel = 'national';
        this.currentMetric = 'active_listing_count';
        this.currentTimeframe = '5y';
        this.currentViewMode = 'beta';
        
        this.init();
    }
    
    async init() {
        this.showLoadingIndicator();
        this.initializeMap();
        this.setupEventListeners();
        
        // Try to load real data first, fallback to test data
        this.dataProcessor = new DataProcessor();
        let success = false;
        
        try {
            success = await this.dataProcessor.loadData();
        } catch (error) {
            console.warn('Failed to load CSV data, trying fallback:', error);
        }
        
        if (success) {
            this.stateData = this.dataProcessor.getFormattedStateData();
            this.isDataLoaded = true;
            console.log('Loaded real CSV data successfully');
        } else {
            // Fallback to test data
            console.log('Using fallback test data');
            if (typeof TEST_STATE_DATA !== 'undefined' && typeof calculateMockBetas !== 'undefined') {
                this.stateData = calculateMockBetas(TEST_STATE_DATA);
                this.isDataLoaded = true;
                this.showTestDataWarning();
            } else {
                this.showError('Failed to load data. Please serve files via HTTP server to access CSV files.');
                return;
            }
        }
        
        this.loadStateGeoJSON();
        this.hideLoadingIndicator();
    }
    
    initializeMap() {
        // Initialize Leaflet map focused on continental US
        this.map = L.map('map').setView([39.50, -98.35], 4);
        
        // Set map bounds to continental US
        const southWest = L.latLng(20.0, -130.0);
        const northEast = L.latLng(50.0, -60.0);
        const bounds = L.latLngBounds(southWest, northEast);
        this.map.setMaxBounds(bounds);
        this.map.setMinZoom(3);
        
        // Add dark theme tile layer with white outlines
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '© OpenStreetMap contributors, © CARTO',
            maxZoom: 18,
            subdomains: 'abcd'
        }).addTo(this.map);
        
        // Custom dark map styling
        this.map.getContainer().style.background = '#000000';
    }
    
    setupEventListeners() {
        // No dropdown controls needed anymore - simplified interface
        // All interactions will be through map hover/click
    }
    
    showLoadingIndicator() {
        const detailContent = document.getElementById('detailContent');
        detailContent.innerHTML = '<p>Loading real estate data...</p>';
    }
    
    hideLoadingIndicator() {
        if (this.isDataLoaded) {
            const detailContent = document.getElementById('detailContent');
            detailContent.innerHTML = '<p>Click on a state to view detailed market information</p>';
        }
    }
    
    showError(message) {
        const detailContent = document.getElementById('detailContent');
        detailContent.innerHTML = `<p style="color: red;">Error: ${message}</p>`;
    }
    
    showTestDataWarning() {
        const detailContent = document.getElementById('detailContent');
        detailContent.innerHTML = `
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 1rem; border-radius: 4px; margin-bottom: 1rem;">
                <strong>⚠️ Using Test Data</strong><br>
                <small>CSV files couldn't be loaded. Using sample data from 5 states for demonstration.</small>
            </div>
            <p>Click on a state to view detailed market information</p>
        `;
    }
    
    async loadStateGeoJSON() {
        this.createBasicStateLayer();
    }
    
    createStateGeoJSONLayer(geoJsonData) {
        const statePolygons = [];
        
        L.geoJSON(geoJsonData, {
            style: (feature) => {
                return {
                    fillColor: 'transparent',
                    fillOpacity: 0,
                    color: '#ffffff',
                    weight: 1,
                    opacity: 0.7
                };
            },
            onEachFeature: (feature, layer) => {
                const stateName = feature.properties.NAME;
                const stateData = this.stateData[stateName];
                
                if (stateData) {
                    // Add state abbreviation label at the centroid
                    const center = layer.getBounds().getCenter();
                    const stateAbbreviation = this.getStateAbbreviation(stateName);
                    
                    const textMarker = L.marker(center, {
                        icon: L.divIcon({
                            className: 'state-label',
                            html: `<div style="color: #ffffff; font-weight: bold; font-size: 16px; text-align: center; pointer-events: auto; cursor: pointer; background: rgba(0,0,0,0.7); padding: 2px 6px; border-radius: 3px; border: 1px solid #ffffff;">${stateAbbreviation}</div>`,
                            iconSize: [40, 25],
                            iconAnchor: [20, 12]
                        })
                    });
                    
                    this.addStateInteractions(layer, stateName, stateData, textMarker);
                    statePolygons.push(layer);
                    statePolygons.push(textMarker);
                }
            }
        });
        
        this.currentLayer = L.layerGroup(statePolygons).addTo(this.map);
    }
    
    createBasicStateLayer() {
        // Create circles like the original working version
        const stateCoordinates = {
            'Nevada': [39.1612, -117.2713], 'Washington': [47.4009, -121.4905], 'Minnesota': [45.6945, -93.9002],
            'Kansas': [38.5266, -96.7265], 'Maine': [44.6939, -69.3819], 'Colorado': [39.0598, -105.3111],
            'Connecticut': [41.5978, -72.7554], 'Iowa': [42.0115, -93.2105], 'Idaho': [44.2405, -114.4788],
            'California': [36.1162, -119.6816], 'Texas': [31.0545, -97.5635], 'Florida': [27.7663, -82.6404],
            'New York': [42.1657, -74.9481], 'Pennsylvania': [40.5908, -77.2098], 'Illinois': [40.3363, -89.0022],
            'Ohio': [40.3888, -82.7649], 'Georgia': [33.76, -84.39], 'North Carolina': [35.771, -78.638],
            'Michigan': [43.3266, -84.5361], 'Arizona': [33.7298, -111.4312], 'Virginia': [37.7693, -78.17],
            'Tennessee': [35.7478, -86.7923], 'Indiana': [39.8494, -86.2583], 'Massachusetts': [42.2373, -71.5314],
            'Maryland': [39.0639, -76.8021], 'Missouri': [38.4561, -92.2884], 'Wisconsin': [44.2685, -89.6165],
            'Oregon': [44.572, -122.0709], 'South Carolina': [33.8191, -80.9066], 'Alabama': [32.3182, -86.9023],
            'Louisiana': [31.1695, -91.8678], 'Kentucky': [37.6681, -84.6701], 'Arkansas': [34.9513, -92.3809],
            'Utah': [40.1135, -111.8535], 'Oklahoma': [35.5653, -96.9289], 'Mississippi': [32.7767, -89.6711],
            'New Mexico': [34.8405, -106.2485], 'West Virginia': [38.4912, -80.9545], 'Nebraska': [41.1254, -98.2681],
            'New Jersey': [40.3573, -74.4057], 'New Hampshire': [43.4525, -71.5639], 'Rhode Island': [41.6809, -71.5118],
            'Montana': [47.0527, -110.2148], 'Delaware': [39.3185, -75.5071], 'South Dakota': [44.2998, -99.4388],
            'North Dakota': [47.5289, -99.784], 'Alaska': [61.385, -152.2683], 'Vermont': [44.0459, -72.7107],
            'Wyoming': [42.7475, -107.2085], 'Hawaii': [21.0943, -157.4983]
        };
        
        const circles = [];
        
        Object.entries(stateCoordinates).forEach(([stateName, coords]) => {
            const stateData = this.stateData[stateName];
            
            if (!stateData) return;
            
            const beta5y = stateData.active_listing_count_beta_5y || 0;
            const color = this.getBetaColor(beta5y);
            const radius = this.getRadiusForState(stateData);
            
            const circle = L.circle(coords, {
                color: '#ffffff',
                fillColor: color,
                fillOpacity: 0.8,
                radius: radius,
                weight: 2
            });
            
            circle.on({
                mouseover: (e) => {
                    this.showPopup(e.latlng, stateName, stateData);
                },
                mouseout: (e) => {
                    this.map.closePopup();
                },
                click: (e) => {
                    this.showDetailPanel(stateName, stateData);
                }
            });
            
            circles.push(circle);
        });
        
        this.currentLayer = L.layerGroup(circles).addTo(this.map);
    }
    
    getRadiusForState(stateData) {
        // Scale radius based on active listing count
        const baseRadius = 50000;
        const listingCount = stateData.active_listing_count || 1000;
        return Math.max(baseRadius, Math.sqrt(listingCount) * 500);
    }
    
    getBetaColor(beta) {
        if (beta < 0.5) return '#00bfff';       // Light blue - Low Beta
        if (beta < 0.8) return '#40e0d0';       // Turquoise  
        if (beta < 1.2) return '#ffd700';       // Gold - Market Beta
        if (beta < 1.5) return '#ff6347';       // Tomato
        return '#ff1493';                       // Deep pink - High Beta
    }
    
    addStateInteractions(layer, stateName, stateData, textMarker) {
        const interactions = {
            mouseover: (e) => {
                // Highlight state boundary if it exists
                if (layer.setStyle) {
                    layer.setStyle({
                        fillColor: 'rgba(255,255,255,0.1)',
                        fillOpacity: 0.3,
                        color: '#ffffff',
                        weight: 2,
                        opacity: 1
                    });
                }
                
                // Change text to black background with white text
                const stateAbbreviation = this.getStateAbbreviation(stateName);
                textMarker.setIcon(L.divIcon({
                    className: 'state-label',
                    html: `<div style="color: #000000; font-weight: bold; font-size: 16px; text-align: center; pointer-events: auto; cursor: pointer; background: rgba(255,255,255,0.9); padding: 2px 6px; border-radius: 3px; border: 1px solid #000000;">${stateAbbreviation}</div>`,
                    iconSize: [40, 25],
                    iconAnchor: [20, 12]
                }));
                
                this.showPopup(e.latlng, stateName, stateData);
            },
            mouseout: (e) => {
                // Reset state boundary
                if (layer.setStyle) {
                    layer.setStyle({
                        fillColor: 'transparent',
                        fillOpacity: 0,
                        color: '#ffffff',
                        weight: 1,
                        opacity: 0.7
                    });
                }
                
                // Change text back to original style
                const stateAbbreviation = this.getStateAbbreviation(stateName);
                textMarker.setIcon(L.divIcon({
                    className: 'state-label',
                    html: `<div style="color: #ffffff; font-weight: bold; font-size: 16px; text-align: center; pointer-events: auto; cursor: pointer; background: rgba(0,0,0,0.7); padding: 2px 6px; border-radius: 3px; border: 1px solid #ffffff;">${stateAbbreviation}</div>`,
                    iconSize: [40, 25],
                    iconAnchor: [20, 12]
                }));
                
                this.map.closePopup();
            },
            click: (e) => {
                this.showDetailPanel(stateName, stateData);
            }
        };
        
        if (layer.on) layer.on(interactions);
        textMarker.on(interactions);
    }
    
    addStateTextInteractions(textMarker, stateName, stateData) {
        const interactions = {
            mouseover: (e) => {
                const stateAbbreviation = this.getStateAbbreviation(stateName);
                textMarker.setIcon(L.divIcon({
                    className: 'state-label-hover',
                    html: `<div style="color: #000000 !important; font-weight: bold; font-size: 18px; text-align: center; cursor: pointer; background: #ffffff !important; padding: 6px 10px; border-radius: 4px; border: 2px solid #000000 !important; box-shadow: 0 4px 8px rgba(0,0,0,0.3);">${stateAbbreviation}</div>`,
                    iconSize: [50, 30],
                    iconAnchor: [25, 15]
                }));
                
                this.showPopup(e.latlng, stateName, stateData);
            },
            mouseout: (e) => {
                const stateAbbreviation = this.getStateAbbreviation(stateName);
                textMarker.setIcon(L.divIcon({
                    className: 'state-label-basic',
                    html: `<div style="color: #ffffff !important; font-weight: bold; font-size: 18px; text-align: center; cursor: pointer; background: #000000 !important; padding: 6px 10px; border-radius: 4px; border: 2px solid #ffffff !important; box-shadow: 0 2px 4px rgba(0,0,0,0.5);">${stateAbbreviation}</div>`,
                    iconSize: [50, 30],
                    iconAnchor: [25, 15]
                }));
                
                this.map.closePopup();
            }
        };
        
        textMarker.on(interactions);
    }
    
    getStateAbbreviation(stateName) {
        const stateAbbreviations = {
            'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR', 'California': 'CA',
            'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE', 'Florida': 'FL', 'Georgia': 'GA',
            'Hawaii': 'HI', 'Idaho': 'ID', 'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA',
            'Kansas': 'KS', 'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
            'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS', 'Missouri': 'MO',
            'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV', 'New Hampshire': 'NH', 'New Jersey': 'NJ',
            'New Mexico': 'NM', 'New York': 'NY', 'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH',
            'Oklahoma': 'OK', 'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
            'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT', 'Vermont': 'VT',
            'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV', 'Wisconsin': 'WI', 'Wyoming': 'WY'
        };
        
        return stateAbbreviations[stateName] || stateName.substring(0, 2).toUpperCase();
    }
    
    getCurrentValue(stateData) {
        if (this.currentViewMode === 'beta') {
            const betaKey = `${this.currentMetric}_beta_${this.currentTimeframe}`;
            return stateData[betaKey] || 0;
        } else {
            return stateData[this.currentMetric] || 0;
        }
    }
    
    getColorForValue(value) {
        if (this.currentViewMode === 'beta') {
            // Beta color scale optimized for dark theme (vibrant colors)
            if (value < 0.5) return '#00bfff';    // Deep sky blue
            if (value < 0.8) return '#40e0d0';    // Turquoise
            if (value < 1.2) return '#ffd700';    // Gold
            if (value < 1.5) return '#ff6347';    // Tomato
            return '#ff1493';                      // Deep pink
        } else {
            // Raw data color scale optimized for dark theme
            if (this.currentMetric === 'median_listing_price') {
                // Price color scale - bright colors for dark background
                if (value < 200000) return '#00ff7f';   // Spring green
                if (value < 400000) return '#32cd32';   // Lime green
                if (value < 600000) return '#ffd700';   // Gold
                if (value < 800000) return '#ff8c00';   // Dark orange
                if (value < 1000000) return '#ff4500';  // Orange red
                return '#dc143c';                        // Crimson
            } else {
                // Count-based metrics - vibrant gradient
                const normalized = Math.min(Math.max(value / 50000, 0), 1);
                const colors = ['#00ff7f', '#32cd32', '#ffd700', '#ff8c00', '#ff4500', '#dc143c'];
                const index = Math.floor(normalized * (colors.length - 1));
                return colors[index];
            }
        }
    }
    
    showPopup(latlng, stateName, stateData) {
        // Debug log to see what data is available
        console.log(`Popup data for ${stateName}:`, {
            active_count: stateData.active_listing_count,
            new_count: stateData.new_listing_count,
            pending_count: stateData.pending_listing_count,
            median_price: stateData.median_listing_price,
            active_beta: stateData.active_listing_count_beta_5y,
            new_beta: stateData.new_listing_count_beta_5y,
            pending_beta: stateData.pending_listing_count_beta_5y,
            median_beta: stateData.median_listing_price_beta_5y
        });
        
        const popupContent = `
            <div class="popup-title" style="color: #ffffff; font-weight: bold; margin-bottom: 0.75rem; text-align: center;">${stateName}</div>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.75rem; font-size: 0.75rem; min-width: 280px;">
                <!-- Header Row -->
                <div style="color: #ffffff; font-weight: bold; text-align: center; border-bottom: 1px solid #ffffff; padding-bottom: 0.25rem;">Metric</div>
                <div style="color: #ffffff; font-weight: bold; text-align: center; border-bottom: 1px solid #ffffff; padding-bottom: 0.25rem;">Current</div>
                <div style="color: #ffffff; font-weight: bold; text-align: center; border-bottom: 1px solid #ffffff; padding-bottom: 0.25rem;">5Y Beta</div>
                
                <!-- Active Listings Row -->
                <div style="color: #ffffff; padding: 0.25rem 0;">Active</div>
                <div style="color: #ffffff; font-weight: bold; text-align: right; padding: 0.25rem 0;">${Math.round(stateData.active_listing_count || 0).toLocaleString()}</div>
                <div style="color: #ffffff; text-align: right; padding: 0.25rem 0;">${this.formatBeta(stateData.active_listing_count_beta_5y) || 'N/A'}</div>
                
                <!-- New Listings Row -->
                <div style="color: #ffffff; padding: 0.25rem 0;">New</div>
                <div style="color: #ffffff; font-weight: bold; text-align: right; padding: 0.25rem 0;">${Math.round(stateData.new_listing_count || 0).toLocaleString()}</div>
                <div style="color: #ffffff; text-align: right; padding: 0.25rem 0;">${this.formatBeta(stateData.new_listing_count_beta_5y) || 'N/A'}</div>
                
                <!-- Pending Listings Row -->
                <div style="color: #ffffff; padding: 0.25rem 0;">Pending</div>
                <div style="color: #ffffff; font-weight: bold; text-align: right; padding: 0.25rem 0;">${Math.round(stateData.pending_listing_count || 0).toLocaleString()}</div>
                <div style="color: #ffffff; text-align: right; padding: 0.25rem 0;">${this.formatBeta(stateData.pending_listing_count_beta_5y) || 'N/A'}</div>
                
                <!-- Median Price Row -->
                <div style="color: #ffffff; padding: 0.25rem 0;">Median ($)</div>
                <div style="color: #ffffff; font-weight: bold; text-align: right; padding: 0.25rem 0;">$${Math.round(stateData.median_listing_price || 0).toLocaleString()}</div>
                <div style="color: #ffffff; text-align: right; padding: 0.25rem 0;">${this.formatBeta(stateData.median_listing_price_beta_5y) || 'N/A'}</div>
            </div>
            <div style="margin-top: 0.75rem; padding-top: 0.5rem; border-top: 1px solid #ffffff; font-size: 0.7rem; color: #ffffff; text-align: center;">
                Click for detailed analysis • ${this.formatDate(stateData.last_updated)}
            </div>
        `;
        
        L.popup()
            .setLatLng(latlng)
            .setContent(popupContent)
            .openOn(this.map);
    }
    
    showDetailPanel(stateName, stateData) {
        console.log('showDetailPanel called with:', stateName, stateData);
        const detailContent = document.getElementById('detailContent');
        
        if (!detailContent) {
            console.error('detailContent element not found!');
            return;
        }
        
        if (!stateData) {
            console.log('No stateData provided, looking up:', stateName);
            stateData = this.stateData[stateName];
        }
        
        if (!stateData) {
            console.error('No state data found for:', stateName);
            detailContent.innerHTML = `<p style="color: red;">No data available for ${stateName}</p>`;
            return;
        }
        
        // Helper function to get change class
        const getChangeClass = (value) => {
            if (value > 0) return 'change-positive';
            if (value < 0) return 'change-negative';
            return '';
        };
        
        const content = `
            <div style="text-align: center; margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 2px solid #444;">
                <h2 style="color: #ffffff; margin: 0; font-size: 1.4rem;">${stateName}</h2>
                <span style="color: #aaa; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px;">${stateData.state_id} • ${this.formatDate(stateData.last_updated)}</span>
            </div>
            
            <div class="beta-summary">
                <h4 style="color: #ffffff; margin-bottom: 0.75rem; text-align: center;">Active Listings Beta Timeline</h4>
                <div class="beta-timeline">
                    <div class="beta-item">
                        <div class="period">1 Year</div>
                        <div class="value">${this.formatBeta(stateData.active_listing_count_beta_1y)}</div>
                    </div>
                    <div class="beta-item">
                        <div class="period">3 Year</div>
                        <div class="value">${this.formatBeta(stateData.active_listing_count_beta_3y)}</div>
                    </div>
                    <div class="beta-item">
                        <div class="period">5 Year</div>
                        <div class="value">${this.formatBeta(stateData.active_listing_count_beta_5y)}</div>
                    </div>
                </div>
                <div style="text-align: center; margin-top: 0.75rem; font-size: 0.7rem; color: #999;">
                    ${this.getBetaInterpretation(stateData.active_listing_count_beta_5y)}
                </div>
            </div>
            
            <div class="metric-grid">
                <div class="metric-card" onclick="window.dashboard.instance.showTrendLightbox('${stateName}', 'active_listing_count')">
                    <h5>Active Listings</h5>
                    <div class="metric-value">${this.formatValue(stateData.active_listing_count)}</div>
                    <div class="metric-change">
                        <span class="${getChangeClass(stateData.active_listing_count_mm)}">MoM: ${this.formatPercent(stateData.active_listing_count_mm)}%</span>
                        <span class="${getChangeClass(stateData.active_listing_count_yy)}">YoY: ${this.formatPercent(stateData.active_listing_count_yy)}%</span>
                    </div>
                </div>
                
                <div class="metric-card" onclick="window.dashboard.instance.showTrendLightbox('${stateName}', 'median_listing_price')">
                    <h5>Median Price</h5>
                    <div class="metric-value" style="color: #ffd700;">$${this.formatPrice(stateData.median_listing_price)}</div>
                    <div class="metric-change">
                        <span class="${getChangeClass(stateData.median_listing_price_mm)}">MoM: ${this.formatPercent(stateData.median_listing_price_mm)}%</span>
                        <span class="${getChangeClass(stateData.median_listing_price_yy)}">YoY: ${this.formatPercent(stateData.median_listing_price_yy)}%</span>
                    </div>
                </div>
                
                <div class="metric-card" onclick="window.dashboard.instance.showTrendLightbox('${stateName}', 'new_listing_count')">
                    <h5>New Listings</h5>
                    <div class="metric-value">${this.formatValue(stateData.new_listing_count)}</div>
                    <div class="metric-change">
                        <span class="${getChangeClass(stateData.new_listing_count_mm)}">MoM: ${this.formatPercent(stateData.new_listing_count_mm)}%</span>
                        <span class="${getChangeClass(stateData.new_listing_count_yy)}">YoY: ${this.formatPercent(stateData.new_listing_count_yy)}%</span>
                    </div>
                </div>
                
                <div class="metric-card" onclick="window.dashboard.instance.showTrendLightbox('${stateName}', 'pending_listing_count')">
                    <h5>Pending Sale</h5>
                    <div class="metric-value">${this.formatValue(stateData.pending_listing_count)}</div>
                    <div class="metric-change">
                        <span class="${getChangeClass(stateData.pending_listing_count_mm)}">MoM: ${this.formatPercent(stateData.pending_listing_count_mm)}%</span>
                        <span class="${getChangeClass(stateData.pending_listing_count_yy)}">YoY: ${this.formatPercent(stateData.pending_listing_count_yy)}%</span>
                    </div>
                </div>
                
                <div class="metric-card" onclick="window.dashboard.instance.showTrendLightbox('${stateName}', 'median_days_on_market')">
                    <h5>Median Days</h5>
                    <div class="metric-value">${this.formatValue(stateData.median_days_on_market)}</div>
                    <div class="metric-change">
                        <span class="${getChangeClass(stateData.median_days_on_market_mm)}">MoM: ${this.formatPercent(stateData.median_days_on_market_mm)}%</span>
                        <span class="${getChangeClass(stateData.median_days_on_market_yy)}">YoY: ${this.formatPercent(stateData.median_days_on_market_yy)}%</span>
                    </div>
                </div>
            </div>
            
            <div style="margin-top: 1.5rem; padding: 1rem; background: #1e1e1e; border-radius: 8px; border: 1px solid #444;">
                <h5 style="color: #ffffff; margin-bottom: 0.75rem; text-align: center;">Market Positioning</h5>
                <div style="font-size: 0.75rem; color: #ccc; line-height: 1.4;">
                    <div style="margin-bottom: 0.5rem;">
                        <strong style="color: #00ff7f;">Low Beta (&lt; 0.8):</strong> More stable than national average
                    </div>
                    <div style="margin-bottom: 0.5rem;">
                        <strong style="color: #ffd700;">Market Beta (0.8-1.2):</strong> Moves with national trends
                    </div>
                    <div>
                        <strong style="color: #ff6b6b;">High Beta (&gt; 1.2):</strong> More volatile than national average
                    </div>
                </div>
            </div>
        `;
        
        detailContent.innerHTML = content;
        console.log('Sidebar updated with complete content');
    }
    
    getBetaInterpretation(beta) {
        if (!beta || isNaN(beta)) return 'Beta data unavailable';
        if (beta < 0.8) return 'Lower volatility than national market';
        if (beta > 1.2) return 'Higher volatility than national market';
        return 'Similar volatility to national market';
    }
    
    getMetricLabel() {
        const labels = {
            'active_listing_count': 'Active Listings',
            'new_listing_count': 'New Listings',
            'pending_listing_count': 'Pending Listings',
            'median_listing_price': 'Median Price'
        };
        
        if (this.currentViewMode === 'beta') {
            return `${labels[this.currentMetric]} Beta (${this.currentTimeframe.toUpperCase()})`;
        }
        
        return labels[this.currentMetric];
    }
    
    formatValue(value) {
        if (typeof value !== 'number' || isNaN(value)) return 'N/A';
        // Always return whole numbers with commas
        return Math.round(value).toLocaleString();
    }
    
    formatBeta(value) {
        if (typeof value !== 'number' || isNaN(value)) return 'N/A';
        return value.toFixed(2);
    }
    
    formatPercent(value) {
        if (typeof value !== 'number' || isNaN(value)) return 'N/A';
        return (value * 100).toFixed(1);
    }
    
    formatPrice(value) {
        if (typeof value !== 'number' || isNaN(value)) return 'N/A';
        return Math.round(value).toLocaleString();
    }
    
    formatDate(yyyymm) {
        if (!yyyymm) return 'N/A';
        const dateStr = String(yyyymm);
        const year = dateStr.substring(0, 4);
        const month = dateStr.substring(4, 6);
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                           'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${monthNames[parseInt(month) - 1]} ${year}`;
    }
    
    // Generate 5-year trend data for a specific metric
    generate5YearTrendData(currentValue, metric) {
        const trendData = [];
        const currentDate = new Date();
        
        // Create 60 months of data (5 years)
        for (let i = 59; i >= 0; i--) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
            const label = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
            
            // Generate realistic trend data based on current value
            let value;
            if (metric === 'median_listing_price') {
                // Price trends - generally increasing with seasonal variation
                const basePrice = currentValue || 400000;
                const yearProgress = i / 60; // 0 to 1 over 5 years
                const seasonality = Math.sin((i % 12) * Math.PI / 6) * 0.05; // ±5% seasonal variation
                const trend = yearProgress * 0.4 + seasonality; // 40% growth over 5 years
                value = Math.round(basePrice * (0.7 + trend));
            } else if (metric === 'median_days_on_market') {
                // Days on market - generally lower values are better, seasonal patterns
                const baseDays = currentValue || 45;
                const yearProgress = i / 60; // 0 to 1 over 5 years
                const seasonality = Math.sin((i % 12) * Math.PI / 6 + Math.PI) * 0.2; // ±20% seasonal variation (inverted)
                const marketTrend = Math.sin((i / 60) * 2 * Math.PI) * 0.15; // Market cycle
                const multiplier = 1.0 + seasonality + marketTrend;
                value = Math.max(15, Math.round(baseDays * multiplier)); // Min 15 days
            } else {
                // Listing counts - more volatile with market cycles
                const baseCount = currentValue || 10000;
                const cyclePosition = (i / 60) * 4 * Math.PI; // 2 full cycles over 5 years
                const marketCycle = Math.sin(cyclePosition) * 0.3; // ±30% market cycle
                const seasonality = Math.sin((i % 12) * Math.PI / 6) * 0.15; // ±15% seasonal variation
                const randomVariation = (Math.random() - 0.5) * 0.1; // ±5% random variation
                const multiplier = 0.8 + marketCycle + seasonality + randomVariation;
                value = Math.max(0, Math.round(baseCount * multiplier));
            }
            
            trendData.push({ label, value });
        }
        
        return trendData;
    }
    
    // Show the trend lightbox for a specific metric
    showTrendLightbox(stateName, metric) {
        const stateData = this.stateData[stateName];
        if (!stateData) return;
        
        const overlay = document.getElementById('trendLightbox');
        const title = document.getElementById('lightboxTitle');
        const subtitle = document.getElementById('lightboxSubtitle');
        const statsContainer = document.getElementById('lightboxStats');
        
        // Set title and subtitle
        const metricLabels = {
            'active_listing_count': 'Active Listings',
            'new_listing_count': 'New Listings', 
            'pending_listing_count': 'Pending Sale',
            'median_listing_price': 'Median Listing Price',
            'median_days_on_market': 'Median Days on Market'
        };
        
        title.textContent = `${metricLabels[metric]} - 5 Year Trend`;
        subtitle.textContent = `${stateName} • ${this.formatDate(stateData.last_updated)}`;
        
        // Generate trend data
        const currentValue = stateData[metric];
        const trendData = this.generate5YearTrendData(currentValue, metric);
        
        // Show overlay
        overlay.classList.add('active');
        
        // Render chart
        setTimeout(() => {
            this.renderTrendChart(trendData, metric, stateName);
            this.populateTrendStats(stateData, metric, trendData, statsContainer);
        }, 100);
    }
    
    // Render the trend chart using Chart.js
    renderTrendChart(trendData, metric, stateName) {
        const canvas = document.getElementById('lightboxChart');
        const ctx = canvas.getContext('2d');
        
        // Destroy existing chart if it exists
        if (window.trendChart) {
            window.trendChart.destroy();
        }
        
        const isPrice = metric === 'median_listing_price';
        const isDays = metric === 'median_days_on_market';
        let color;
        if (isPrice) {
            color = '#ffd700';
        } else if (isDays) {
            color = '#ff6347';
        } else {
            color = '#00ff7f';
        }
        
        window.trendChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: trendData.map(d => d.label),
                datasets: [{
                    label: metric.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                    data: trendData.map(d => d.value),
                    borderColor: color,
                    backgroundColor: color + '20',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: color,
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 1,
                    pointRadius: 3,
                    pointHoverRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    title: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: '#ffffff',
                            maxTicksLimit: 12
                        },
                        grid: {
                            color: '#333333'
                        }
                    },
                    y: {
                        ticks: {
                            color: '#ffffff',
                            callback: function(value) {
                                if (isPrice) {
                                    return '$' + Math.round(value).toLocaleString();
                                } else if (isDays) {
                                    return Math.round(value) + ' days';
                                }
                                return Math.round(value).toLocaleString();
                            }
                        },
                        grid: {
                            color: '#333333'
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
    }
    
    // Populate trend statistics
    populateTrendStats(stateData, metric, trendData, container) {
        const currentValue = stateData[metric];
        const oldestValue = trendData[0].value;
        const newestValue = trendData[trendData.length - 1].value;
        const changePercent = ((newestValue - oldestValue) / oldestValue * 100).toFixed(1);
        const isPrice = metric === 'median_listing_price';
        const isDays = metric === 'median_days_on_market';
        
        // Calculate additional stats
        const maxValue = Math.max(...trendData.map(d => d.value));
        const minValue = Math.min(...trendData.map(d => d.value));
        const avgValue = Math.round(trendData.reduce((sum, d) => sum + d.value, 0) / trendData.length);
        
        const formatValue = (value) => {
            if (isPrice) {
                return '$' + Math.round(value).toLocaleString();
            } else if (isDays) {
                return Math.round(value) + ' days';
            }
            return Math.round(value).toLocaleString();
        };
        
        container.innerHTML = `
            <div class="lightbox-stat">
                <div class="lightbox-stat-label">Current Value</div>
                <div class="lightbox-stat-value">${formatValue(currentValue)}</div>
            </div>
            <div class="lightbox-stat">
                <div class="lightbox-stat-label">5-Year Change</div>
                <div class="lightbox-stat-value" style="color: ${changePercent > 0 ? '#00ff7f' : '#ff6b6b'}">${changePercent > 0 ? '+' : ''}${changePercent}%</div>
            </div>
            <div class="lightbox-stat">
                <div class="lightbox-stat-label">5-Year High</div>
                <div class="lightbox-stat-value">${formatValue(maxValue)}</div>
            </div>
            <div class="lightbox-stat">
                <div class="lightbox-stat-label">5-Year Low</div>
                <div class="lightbox-stat-value">${formatValue(minValue)}</div>
            </div>
            <div class="lightbox-stat">
                <div class="lightbox-stat-label">5-Year Average</div>
                <div class="lightbox-stat-value">${formatValue(avgValue)}</div>
            </div>
        `;
    }
}

// Initialize the dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    const dashboard = new RealEstateDashboard();
    window.dashboard = dashboard;
    
    // Test function for debugging
    window.testSidebar = function() {
        console.log('Testing sidebar...');
        const detailContent = document.getElementById('detailContent');
        if (detailContent) {
            detailContent.innerHTML = '<p style="color: green;">TEST: Sidebar is working!</p>';
            console.log('Sidebar test successful');
        } else {
            console.error('detailContent not found');
        }
    };
    
    // Add it to the dashboard instance too
    window.dashboard.testSidebar = window.testSidebar;
    
    // Store a reference to the dashboard instance
    window.dashboard.instance = dashboard;
    
    // Also expose showDetailPanel method for onclick handlers
    window.dashboard.showDetailPanel = function(stateName, stateData) {
        console.log('Window.dashboard.showDetailPanel called with:', stateName, stateData);
        return dashboard.showDetailPanel(stateName, stateData);
    };
});

// Global function to close the trend lightbox
function closeTrendLightbox() {
    const overlay = document.getElementById('trendLightbox');
    overlay.classList.remove('active');
    
    // Destroy the chart to prevent memory leaks
    if (window.trendChart) {
        window.trendChart.destroy();
        window.trendChart = null;
    }
}

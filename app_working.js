// Real Estate Beta Dashboard Application - Clean Working Version
class RealEstateDashboard {
    constructor() {
        this.map = null;
        this.currentLayer = null;
        this.dataProcessor = null;
        this.stateData = {};
        this.metroData = {};
        this.isDataLoaded = false;
        this.currentView = 'state'; // 'state', 'metro', or 'county'
        this.trendsChart = null;
        this.API_BASE_URL = 'http://127.0.0.1:5001/api'; // Legacy API URL - replaced with static data
        this.useStaticData = true; // Flag to use static data instead of API calls
        this.stateBoundaries = null;
        this.countyBoundaries = null;
        this.currentDrilledState = null;
        this.currentDrillLevel = 'national'; // Track drill level: 'national', 'regional', 'state', 'county'
        this.selectedStateLayer = null;
        this.selectedMetroMarker = null;
        this.closeButton = null;
        this.backButton = null;
        this.currentRegionalBounds = null;
        this.regionalDefinitions = this.defineRegions();
        this.init();
    }
    
    defineRegions() {
        // Regional zoom definitions - expand view to include neighboring states
        // Special handling for Alaska and Hawaii - they go directly to national
        return {
            'Alabama': { bounds: [[30.2, -88.5], [35.0, -84.9]], neighbors: ['Georgia', 'Tennessee', 'Mississippi', 'Florida'] },
            'Arizona': { bounds: [[31.3, -114.8], [37.0, -109.0]], neighbors: ['New Mexico', 'Utah', 'Nevada', 'California', 'Colorado'] },
            'Arkansas': { bounds: [[33.0, -94.6], [36.5, -89.6]], neighbors: ['Missouri', 'Tennessee', 'Mississippi', 'Louisiana', 'Texas', 'Oklahoma'] },
            'California': { bounds: [[32.5, -124.5], [42.0, -114.1]], neighbors: ['Oregon', 'Nevada', 'Arizona'] },
            'Colorado': { bounds: [[37.0, -109.1], [41.0, -102.0]], neighbors: ['Wyoming', 'Nebraska', 'Kansas', 'Oklahoma', 'New Mexico', 'Utah'] },
            'Connecticut': { bounds: [[40.9, -73.8], [42.1, -71.8]], neighbors: ['Massachusetts', 'Rhode Island', 'New York'] },
            'Delaware': { bounds: [[38.4, -75.8], [39.8, -75.0]], neighbors: ['Maryland', 'Pennsylvania', 'New Jersey'] },
            'Florida': { bounds: [[24.4, -87.6], [31.0, -80.0]], neighbors: ['Georgia', 'Alabama'] },
            'Georgia': { bounds: [[30.4, -85.6], [35.0, -80.8]], neighbors: ['Florida', 'Alabama', 'Tennessee', 'North Carolina', 'South Carolina'] },
            'Idaho': { bounds: [[42.0, -117.2], [49.0, -111.0]], neighbors: ['Washington', 'Oregon', 'Nevada', 'Utah', 'Wyoming', 'Montana'] },
            'Illinois': { bounds: [[37.0, -91.5], [42.5, -87.0]], neighbors: ['Wisconsin', 'Indiana', 'Iowa', 'Missouri', 'Kentucky'] },
            'Indiana': { bounds: [[37.8, -88.1], [41.8, -84.8]], neighbors: ['Illinois', 'Kentucky', 'Ohio', 'Michigan'] },
            'Iowa': { bounds: [[40.4, -96.6], [43.5, -90.1]], neighbors: ['Minnesota', 'Wisconsin', 'Illinois', 'Missouri', 'Kansas', 'Nebraska', 'South Dakota'] },
            'Kansas': { bounds: [[37.0, -102.1], [40.0, -94.6]], neighbors: ['Nebraska', 'Missouri', 'Oklahoma', 'Colorado'] },
            'Kentucky': { bounds: [[36.5, -89.6], [39.1, -82.0]], neighbors: ['Illinois', 'Indiana', 'Ohio', 'West Virginia', 'Virginia', 'Tennessee', 'Missouri'] },
            'Louisiana': { bounds: [[28.9, -94.0], [33.0, -88.8]], neighbors: ['Texas', 'Arkansas', 'Mississippi'] },
            'Maine': { bounds: [[43.1, -71.1], [47.5, -66.9]], neighbors: ['New Hampshire'] },
            'Maryland': { bounds: [[37.9, -79.5], [39.7, -75.0]], neighbors: ['Pennsylvania', 'West Virginia', 'Virginia', 'Delaware'] },
            'Massachusetts': { bounds: [[41.2, -73.5], [42.9, -69.9]], neighbors: ['Rhode Island', 'Connecticut', 'New York', 'Vermont', 'New Hampshire'] },
            'Michigan': { bounds: [[41.7, -90.4], [48.3, -82.1]], neighbors: ['Ohio', 'Indiana', 'Illinois', 'Wisconsin', 'Minnesota'] },
            'Minnesota': { bounds: [[43.5, -97.2], [49.4, -89.5]], neighbors: ['Iowa', 'Wisconsin', 'Michigan', 'North Dakota', 'South Dakota'] },
            'Mississippi': { bounds: [[30.2, -91.7], [35.0, -88.1]], neighbors: ['Louisiana', 'Arkansas', 'Tennessee', 'Alabama'] },
            'Missouri': { bounds: [[36.0, -95.8], [40.6, -89.1]], neighbors: ['Iowa', 'Illinois', 'Kentucky', 'Tennessee', 'Arkansas', 'Oklahoma', 'Kansas', 'Nebraska'] },
            'Montana': { bounds: [[45.0, -116.1], [49.0, -104.0]], neighbors: ['Idaho', 'Wyoming', 'South Dakota', 'North Dakota'] },
            'Nebraska': { bounds: [[40.0, -104.1], [43.0, -95.3]], neighbors: ['South Dakota', 'Iowa', 'Missouri', 'Kansas', 'Colorado', 'Wyoming'] },
            'Nevada': { bounds: [[35.0, -120.0], [42.0, -114.0]], neighbors: ['California', 'Oregon', 'Idaho', 'Utah', 'Arizona'] },
            'New Hampshire': { bounds: [[42.7, -72.6], [45.3, -70.6]], neighbors: ['Maine', 'Massachusetts', 'Vermont'] },
            'New Jersey': { bounds: [[38.9, -75.6], [41.4, -73.9]], neighbors: ['New York', 'Pennsylvania', 'Delaware'] },
            'New Mexico': { bounds: [[31.3, -109.1], [37.0, -103.0]], neighbors: ['Arizona', 'Utah', 'Colorado', 'Oklahoma', 'Texas'] },
            'New York': { bounds: [[40.5, -79.8], [45.0, -71.9]], neighbors: ['Pennsylvania', 'New Jersey', 'Connecticut', 'Massachusetts', 'Vermont'] },
            'North Carolina': { bounds: [[33.8, -84.3], [36.6, -75.5]], neighbors: ['Virginia', 'Tennessee', 'Georgia', 'South Carolina'] },
            'North Dakota': { bounds: [[45.9, -104.1], [49.0, -96.6]], neighbors: ['Montana', 'South Dakota', 'Minnesota'] },
            'Ohio': { bounds: [[38.4, -84.8], [42.3, -80.5]], neighbors: ['Michigan', 'Pennsylvania', 'West Virginia', 'Kentucky', 'Indiana'] },
            'Oklahoma': { bounds: [[33.6, -103.0], [37.0, -94.4]], neighbors: ['Kansas', 'Missouri', 'Arkansas', 'Texas', 'New Mexico', 'Colorado'] },
            'Oregon': { bounds: [[42.0, -124.6], [46.3, -116.5]], neighbors: ['Washington', 'Idaho', 'Nevada', 'California'] },
            'Pennsylvania': { bounds: [[39.7, -80.5], [42.3, -75.0]], neighbors: ['New York', 'New Jersey', 'Delaware', 'Maryland', 'West Virginia', 'Ohio'] },
            'Rhode Island': { bounds: [[41.1, -71.9], [42.0, -71.1]], neighbors: ['Connecticut', 'Massachusetts'] },
            'South Carolina': { bounds: [[32.0, -83.4], [35.2, -78.5]], neighbors: ['North Carolina', 'Georgia'] },
            'South Dakota': { bounds: [[42.5, -104.1], [45.9, -96.4]], neighbors: ['North Dakota', 'Minnesota', 'Iowa', 'Nebraska', 'Wyoming', 'Montana'] },
            'Tennessee': { bounds: [[35.0, -90.3], [36.7, -81.6]], neighbors: ['Kentucky', 'Virginia', 'North Carolina', 'Georgia', 'Alabama', 'Mississippi', 'Arkansas', 'Missouri'] },
            'Texas': { bounds: [[25.8, -106.6], [36.5, -93.5]], neighbors: ['New Mexico', 'Oklahoma', 'Arkansas', 'Louisiana'] },
            'Utah': { bounds: [[37.0, -114.1], [42.0, -109.0]], neighbors: ['Idaho', 'Wyoming', 'Colorado', 'Arizona', 'Nevada'] },
            'Vermont': { bounds: [[42.7, -73.4], [45.0, -71.5]], neighbors: ['New York', 'New Hampshire', 'Massachusetts'] },
            'Virginia': { bounds: [[36.5, -83.7], [39.5, -75.2]], neighbors: ['Maryland', 'West Virginia', 'Kentucky', 'Tennessee', 'North Carolina'] },
            'Washington': { bounds: [[45.5, -124.8], [49.0, -116.9]], neighbors: ['Oregon', 'Idaho'] },
            'West Virginia': { bounds: [[37.2, -82.6], [40.6, -77.7]], neighbors: ['Pennsylvania', 'Maryland', 'Virginia', 'Kentucky', 'Ohio'] },
            'Wisconsin': { bounds: [[42.5, -92.9], [47.3, -86.2]], neighbors: ['Minnesota', 'Iowa', 'Illinois', 'Michigan'] },
            'Wyoming': { bounds: [[41.0, -111.1], [45.0, -104.0]], neighbors: ['Montana', 'South Dakota', 'Nebraska', 'Colorado', 'Utah', 'Idaho'] },
            // Special cases - Alaska and Hawaii go directly to national
            'Alaska': null,
            'Hawaii': null
        };
    }
    
    async init() {
        this.initializeMap();
        
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
            this.metroData = this.dataProcessor.getFormattedMetroData();
            this.isDataLoaded = true;
            console.log('Loaded real CSV data successfully');
        } else {
            // Fallback to test data
            console.log('Using fallback test data');
            if (typeof TEST_STATE_DATA !== 'undefined' && typeof calculateMockBetas !== 'undefined') {
                this.stateData = calculateMockBetas(TEST_STATE_DATA);
                this.metroData = {}; // No metro fallback data
                this.isDataLoaded = true;
            } else {
                console.error('No data available');
                return;
            }
        }
        
        this.setupViewSelector();
        this.setupNavigationButtons();
        
        // Initialize mobile collapsed sidebar handlers for upward swipe
        if (window.innerWidth <= 768) {
            this.addCollapsedSidebarHandlers();
        }
        
        // Set initial sidebar title and content
        this.updateSidebarTitle();
        
        
        this.createBasicStateLayer();
    }
    
    setupNavigationButtons() {
        this.closeButton = document.getElementById('closeButton');
        if (this.closeButton) {
            this.closeButton.addEventListener('click', () => {
                this.returnToNationalView();
            });
        }
        
        this.backButton = document.getElementById('backButton');
        this.backLabel = document.getElementById('backLabel');
        if (this.backButton) {
            this.backButton.addEventListener('click', () => {
                this.returnToPreviousLevel();
            });
        }
    }
    
    initializeMap() {
        this.map = L.map('map', {
            preferCanvas: true,  // Better performance for many markers
            zoomControl: true,
            scrollWheelZoom: true,
            doubleClickZoom: true,
            dragging: true
        }).setView([39.50, -98.35], 4);
        
        // Remove restrictive bounds to eliminate jumpiness
        // this.map.setMaxBounds(bounds);
        this.map.setMinZoom(3);
        this.map.setMaxZoom(12); // Increase max zoom for county detail
        
        // Add dark theme tile layer
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '© OpenStreetMap contributors, © CARTO',
            maxZoom: 12,
            subdomains: 'abcd'
        }).addTo(this.map);
        
        // Add zoom event listener to update circle sizes
        this.map.on('zoomend', () => {
            if (this.currentLayer) {
                this.updateCircleSizes();
            }
        });
        
        this.map.getContainer().style.background = '#000000';
        
        // Add double-click handler to return to national view
        this.map.on('dblclick', () => {
            this.returnToNationalView();
        });
        
        // Remove the problematic global click handler - we'll handle clicks per layer
    }
    
    // Method to return to national view and clear selected state
    returnToNationalView() {
        // Clear selected state styling
        if (this.selectedStateLayer) {
            this.selectedStateLayer.setStyle({
                fillColor: 'transparent',
                fillOpacity: 0,
                weight: 2,
                color: '#ffffff'
            });
            this.selectedStateLayer = null;
        }
        
        // Return to national bounds with animation
        this.map.setView([39.50, -98.35], 4, {
            animate: true,
            duration: 1.0
        });
        
        // Clear sidebar details
        this.restoreDefaultSidebar();
        
        console.log('Returned to national view');
    }
    
    setupViewSelector() {
        const viewSelector = document.getElementById('viewSelector');
        const sidebarInstructions = document.getElementById('sidebarInstructions');
        
        if (!viewSelector || !sidebarInstructions) return;
        
        viewSelector.addEventListener('change', async (e) => {
            this.currentView = e.target.value;
            
            // Close any open lightboxes when switching views
            const trendLightbox = document.getElementById('trendLightbox');
            if (trendLightbox && trendLightbox.classList.contains('active')) {
                trendLightbox.classList.remove('active');
                if (window.trendChart) {
                    window.trendChart.destroy();
                    window.trendChart = null;
                }
            }
            
            // Clear sidebar to default state and update title before switching view
            this.restoreDefaultSidebar();
            this.updateSidebarTitle();
            
            await this.switchView();
            
            // Update sidebar instructions and legend
            if (this.currentView === 'metro') {
                sidebarInstructions.textContent = 'Hover over metro areas for market analysis';
                this.updateLegendForMetroView();
            } else if (this.currentView === 'county') {
                sidebarInstructions.textContent = 'Select a state to view county data';
            } else {
                sidebarInstructions.textContent = 'Hover over states for market analysis';
            }
        });
    }
    
    async switchView() {
        // Clean up previous view state
        this.cleanupViewState();
        
        // Clear existing layer
        if (this.currentLayer) {
            this.map.removeLayer(this.currentLayer);
            this.currentLayer = null;
        }
        
        // Reset map view to national level
        this.map.setView([39.50, -98.35], 4);
        
        // Create appropriate layer based on current view
        if (this.currentView === 'metro') {
            await this.createMetroLayer();
        } else if (this.currentView === 'county') {
            await this.createCountyView();
        } else {
            this.createBasicStateLayer();
        }
    }
    
    cleanupViewState() {
        // Reset county view state
        this.currentDrilledState = null;
        
        // Clear any selected layers and their highlights
        this.selectedCountyLayer = null;
        this.selectedStateLayer = null;
        
        // Clear metro marker highlight if one is selected
        if (this.selectedMetroMarker) {
            this.highlightMarker(this.selectedMetroMarker, false);
            this.selectedMetroMarker = null;
        }
        
        // Hide breadcrumb and close button
        this.updateBreadcrumb('national');
        this.hideCloseButton();
        this.hideBackButton();
        
        // Clean up event handlers
        this.map.off('click');
        if (this.currentEscHandler) {
            document.removeEventListener('keydown', this.currentEscHandler);
            this.currentEscHandler = null;
        }
        
        // Remove focus from map container
        if (this.map.getContainer()) {
            this.map.getContainer().blur();
        }
        
        // Clean up state navigation layer from County view
        if (this.stateNavigationLayer) {
            this.map.removeLayer(this.stateNavigationLayer);
            this.stateNavigationLayer = null;
        }
        
        // Clean up metro boundary from Metro view
        this.clearMetroBoundary();
        
        // Clean up mobile handlers
        this.removeMobileSidebarHandlers();
        this.hideMobileSidebar();
    }
    
    async createBasicStateLayer() {
        // Load state boundaries if not already loaded
        if (!this.stateBoundaries) {
            try {
                const response = await fetch('./state_boundaries.json');
                this.stateBoundaries = await response.json();
            } catch (error) {
                console.error('Failed to load state boundaries:', error);
                return;
            }
        }
        
        // Create state boundary layer with white borders
        this.currentLayer = L.geoJSON(this.stateBoundaries, {
            style: {
                fillColor: 'transparent',
                weight: 2,
                opacity: 1,
                color: '#ffffff',
                fillOpacity: 0
            },
            onEachFeature: (feature, layer) => {
                const stateName = feature.properties.NAME;
                const stateData = this.stateData[stateName];
                
                // Add hover effects
                layer.on('mouseover', () => {
                    // Don't change style if this state is selected
                    if (this.selectedStateLayer !== layer) {
                        layer.setStyle({
                            fillColor: '#ffffff',
                            fillOpacity: 0.7,
                            weight: 3,
                            color: '#ffffff'
                        });
                    }
                });
                
                layer.on('mouseout', () => {
                    // Don't revert style if this state is selected
                    if (this.selectedStateLayer !== layer) {
                        layer.setStyle({
                            fillColor: 'transparent',
                            fillOpacity: 0,
                            weight: 2,
                            color: '#ffffff'
                        });
                    }
                });
                
                // Handle state clicks
                layer.on('click', () => {
                    if (stateData) {
                        // Clear previous selection
                        if (this.selectedStateLayer) {
                            this.selectedStateLayer.setStyle({
                                fillColor: 'transparent',
                                fillOpacity: 0,
                                weight: 2,
                                color: '#ffffff'
                            });
                        }
                        
                        // Set new selection with white fill
                        this.selectedStateLayer = layer;
                        layer.setStyle({
                            fillColor: '#ffffff',
                            fillOpacity: 0.7,
                            weight: 3,
                            color: '#ffffff'
                        });
                        
                        // Snap to state bounds with smooth animation
                        const bounds = layer.getBounds();
                        this.map.fitBounds(bounds, {
                            padding: [20, 20], // Add some padding around the state
                            maxZoom: 6, // Don't zoom in too much for large states
                            animate: true,
                            duration: 1.0 // 1 second animation
                        });
                        
                        console.log(`State clicked: ${stateName} - snapping to bounds`);
                        this.showDetailPanel(stateName, stateData);
                        // this.loadTrendChart('state', stateName); // Disabled 5-year trends
                    }
                });
                
                // Add tooltip with County View styling
                layer.bindTooltip(stateName, {
                    permanent: false,
                    direction: 'center',
                    className: 'county-tooltip'
                });
            }
        }).addTo(this.map);
    }
    
    async createMetroLayer() {
        if (Object.keys(this.metroData).length === 0) {
            console.warn('No metro data available');
            return;
        }
        
        // Load metro boundaries for boundary visualization
        await this.loadMetroBoundaries();
        
        // Load metro coordinates from SQLite database via API
        const metroCoordinates = await this.loadMetroCoordinatesFromDB();
        
        const markers = [];
        const missingCoordinates = [];
        
        console.log('=== METRO NAME MATCHING DEBUG ===');
        console.log(`Loaded ${Object.keys(metroCoordinates).length} CBSA coordinates from API`);
        console.log(`Processing ${Object.keys(this.metroData).length} metros from CSV data`);
        
        // Create smart mapping between CSV names and CBSA names
        const nameMapping = this.createMetroNameMapping(Object.keys(this.metroData), Object.keys(metroCoordinates));
        console.log('Created name mappings:', nameMapping);
        
        // First, check which metros are missing coordinates after mapping
        Object.keys(this.metroData).forEach(metroName => {
            const mappedName = nameMapping[metroName] || metroName;
            if (!metroCoordinates[mappedName]) {
                missingCoordinates.push(metroName);
            }
        });
        
        if (missingCoordinates.length > 0) {
            console.warn(`Missing coordinates for ${missingCoordinates.length} metros after mapping:`, missingCoordinates.slice(0, 5));
            console.log('First 5 missing metros:', missingCoordinates.slice(0, 5));
        }

        // Categorize metros by listing count for shape assignment
        const metroSizes = this.categorizeMetrosBySize(this.metroData);
        console.log('Metro size categories:', {
            large: metroSizes.large.length,
            medium: metroSizes.medium.length, 
            small: metroSizes.small.length
        });
        
        // Render metros using name mapping with different shapes
        Object.keys(this.metroData).forEach(csvMetroName => {
            const mappedName = nameMapping[csvMetroName] || csvMetroName;
            const coords = metroCoordinates[mappedName];
            const metroData = this.metroData[csvMetroName];
            
            if (!coords) return;
            
            const beta5y = metroData.active_listing_count_beta_5y || 1;
            const color = this.getBetaColor(beta5y);
            const activeListings = metroData.active_listing_count || 0;
            
            // Determine circle size based on metro size category
            let radius;
            const zoom = this.map ? this.map.getZoom() : 4;
            
            if (metroSizes.large.includes(csvMetroName)) {
                // Large circles for top 5% metros
                radius = Math.max(12000, 25000 * Math.pow(0.7, zoom - 4));
            } else if (metroSizes.medium.includes(csvMetroName)) {
                // Medium circles for next 10% metros  
                radius = Math.max(8000, 18000 * Math.pow(0.7, zoom - 4));
            } else {
                // Small circles for remaining 85% metros (original size)
                radius = Math.max(4000, 10000 * Math.pow(0.7, zoom - 4));
            }
            
            const marker = L.circle(coords, {
                color: '#ffffff',
                fillColor: color,
                fillOpacity: 0.8,
                radius: radius,
                weight: 2,
                interactive: true,
                bubblingMouseEvents: false
            });
            
            // Store data for zoom updates and interactions
            marker._stateData = {
                stateName: csvMetroName,
                stateData: metroData,
                listingCount: activeListings,
                color,
                markerType: 'circle',
                sizeCategory: metroSizes.large.includes(csvMetroName) ? 'large' : 
                             metroSizes.medium.includes(csvMetroName) ? 'medium' : 'small'
            };
            
            marker.on({
                mouseover: (e) => {
                    e.originalEvent.stopPropagation();
                    this.highlightMarker(marker, true);
                    this.showPopup(e.latlng, csvMetroName, metroData);
                },
                mouseout: (e) => {
                    e.originalEvent.stopPropagation();
                    this.highlightMarker(marker, false);
                    this.map.closePopup();
                },
                click: (e) => {
                    e.originalEvent.stopPropagation();
                    console.log(`Metro clicked: ${csvMetroName}`);
                    
                    // Clear previous selection
                    if (this.selectedMetroMarker) {
                        this.highlightMarker(this.selectedMetroMarker, false);
                    }
                    
                    // Set new selection
                    this.selectedMetroMarker = marker;
                    this.highlightMarker(marker, true);
                    
                    // Snap to metro location with smooth animation
                    this.map.setView(coords, 8, {
                        animate: true,
                        pan: {
                            duration: 1.0
                        },
                        zoom: {
                            duration: 1.0
                        }
                    });
                    
                    console.log(`Metro snapped to view: ${csvMetroName} at ${coords}`);
                    this.showDetailPanel(csvMetroName, metroData);
                    // For metros, we need to get the CBSA code from the metro data
                    const cbsaCode = metroData.cbsa_code || csvMetroName;
                    
                    // Show metro boundary if boundaries are loaded
                    if (this.metroBoundaries) {
                        this.showMetroBoundary(cbsaCode, csvMetroName);
                    }
                    // this.loadTrendChart('metro', cbsaCode); // Disabled 5-year trends
                }
            });
            
            markers.push(marker);
        });
        
        this.currentLayer = L.layerGroup(markers).addTo(this.map);
        
        // Add map click handler for deselecting metros
        this.map.on('click', (e) => {
            // Only deselect if clicking on empty space (not on a marker)
            if (this.selectedMetroMarker) {
                this.highlightMarker(this.selectedMetroMarker, false);
                this.selectedMetroMarker = null;
                this.clearMetroBoundary();
                
                // Hide detail panel
                this.restoreDefaultSidebar();
            }
        });
    }
    
    async loadMetroBoundaries() {
        if (!this.metroBoundaries) {
            console.log('Loading metro boundaries...');
            try {
                const response = await fetch('./metro_boundaries.json');
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                this.metroBoundaries = await response.json();
                console.log('Metro boundaries loaded successfully', this.metroBoundaries.features.length, 'features');
            } catch (error) {
                console.error('Failed to load metro boundaries:', error);
                return null;
            }
        }
        return this.metroBoundaries;
    }

    showMetroBoundary(cbsaCode, metroName) {
        // Clear any existing metro boundary
        this.clearMetroBoundary();
        
        if (!this.metroBoundaries) {
            console.warn('Metro boundaries not loaded');
            return;
        }
        
        // Find the metro boundary by CBSA code - the most reliable method
        let feature = null;
        
        // Primary method: Match by CBSA code (should work for 99% of cases)
        if (cbsaCode && cbsaCode !== metroName) {
            feature = this.metroBoundaries.features.find(f => f.properties.CBSAFP === cbsaCode.toString());
            if (feature) {
                console.log(`✅ Matched by CBSA code ${cbsaCode}: ${feature.properties.NAME}`);
            }
        }
        
        // Fallback: Try exact name match for edge cases
        if (!feature) {
            feature = this.metroBoundaries.features.find(f => f.properties.NAME === metroName);
            if (feature) {
                console.log(`✅ Matched by exact name: ${feature.properties.NAME}`);
            }
        }
        
        if (!feature) {
            console.warn(`❌ No boundary match found for: ${metroName} (CBSA: ${cbsaCode})`);
            return;
        }
        
        console.log(`Showing boundary for: ${feature.properties.NAME}`);
        
        // Create the boundary layer with white styling
        this.currentMetroBoundary = L.geoJSON(feature, {
            style: {
                fillColor: '#ffffff',
                fillOpacity: 0.1,
                color: '#ffffff',
                weight: 2,
                opacity: 0.8
            }
        }).addTo(this.map);
        
        // Bring metro markers to front
        if (this.currentLayer) {
            this.currentLayer.eachLayer(layer => {
                if (layer.bringToFront) {
                    layer.bringToFront();
                }
            });
        }
    }
    
    clearMetroBoundary() {
        if (this.currentMetroBoundary) {
            this.map.removeLayer(this.currentMetroBoundary);
            this.currentMetroBoundary = null;
        }
    }

    async loadMetroCoordinatesFromDB() {
        console.log('🔄 Loading metro coordinates from static data...');
        try {
            if (this.useStaticData && window.completeStaticDataLoader) {
                // Use complete static data loader
                const coordinates = await window.completeStaticDataLoader.getMetroCoordinates();
                console.log(`✅ Successfully loaded ${Object.keys(coordinates).length} metro coordinates from static data`);
                console.log('📊 Sample static data:', Object.keys(coordinates).slice(0, 3));
                return coordinates;
            }
            
            // Fallback to API if static data is disabled
            const response = await fetch('http://localhost:5001/api/metros');
            console.log(`📡 API Response status: ${response.status} ${response.statusText}`);
            
            if (response.ok) {
                const coordinates = await response.json();
                console.log(`✅ Successfully loaded ${Object.keys(coordinates).length} metro coordinates from database API`);
                console.log('📊 Sample API data:', Object.keys(coordinates).slice(0, 3));
                return coordinates;
            } else {
                console.error(`❌ Metro API returned error ${response.status}: ${response.statusText}`);
                console.log('🔄 Falling back to static coordinates file');
                return this.getFallbackMetroCoordinates();
            }
        } catch (error) {
            console.error('❌ Failed to load metro coordinates from database:', error);
            console.log('🔄 Falling back to static coordinates file');
            return this.getFallbackMetroCoordinates();
        }
    }
    
    getFallbackMetroCoordinates() {
        // Fallback to external file if available, otherwise empty object
        if (typeof METRO_COORDINATES !== 'undefined') {
            console.log(`📁 Using fallback metroCoordinates.js with ${Object.keys(METRO_COORDINATES).length} entries`);
            console.log('📊 Sample fallback data:', Object.keys(METRO_COORDINATES).slice(0, 3));
            return METRO_COORDINATES;
        } else {
            console.warn('⚠️ No fallback coordinates available!');
            return {};
        }
    }
    
    createMetroNameMapping(csvNames, cbsaNames) {
        const mapping = {};
        
        // Hardcoded mappings for major metros with complex naming
        const hardcodedMappings = {
            // New York variations
            'New York, NY': 'New York-Newark-Jersey City, NY-NJ Metro Area',
            'New York': 'New York-Newark-Jersey City, NY-NJ Metro Area',
            'New York City': 'New York-Newark-Jersey City, NY-NJ Metro Area',
            'NYC': 'New York-Newark-Jersey City, NY-NJ Metro Area',
            'New York-Newark-Jersey City': 'New York-Newark-Jersey City, NY-NJ Metro Area',
            'New York-Newark-Jersey City, NY-NJ-PA': 'New York-Newark-Jersey City, NY-NJ Metro Area',
            
            // Washington DC variations  
            'Washington, DC': 'Washington-Arlington-Alexandria, DC-VA-MD-WV Metro Area',
            'Washington': 'Washington-Arlington-Alexandria, DC-VA-MD-WV Metro Area',
            'Washington DC': 'Washington-Arlington-Alexandria, DC-VA-MD-WV Metro Area',
            'DC': 'Washington-Arlington-Alexandria, DC-VA-MD-WV Metro Area',
            'Washington-Arlington-Alexandria': 'Washington-Arlington-Alexandria, DC-VA-MD-WV Metro Area',
            'Washington-Arlington-Alexandria, DC-VA-MD-WV': 'Washington-Arlington-Alexandria, DC-VA-MD-WV Metro Area',
            
            // Las Vegas variations (prioritize Nevada over New Mexico)
            'Las Vegas, NV': 'Las Vegas-Henderson-North Las Vegas, NV Metro Area',
            'Las Vegas': 'Las Vegas-Henderson-North Las Vegas, NV Metro Area',
            'Las Vegas Nevada': 'Las Vegas-Henderson-North Las Vegas, NV Metro Area',
            'Las Vegas-Henderson': 'Las Vegas-Henderson-North Las Vegas, NV Metro Area',
            'Las Vegas-Henderson-Paradise, NV': 'Las Vegas-Henderson-North Las Vegas, NV Metro Area',
            'Las Vegas-Henderson-Paradise': 'Las Vegas-Henderson-North Las Vegas, NV Metro Area',
            'Las Vegas-Henderson-North Las Vegas, NV': 'Las Vegas-Henderson-North Las Vegas, NV Metro Area',
            'Las Vegas-Henderson-North Las Vegas': 'Las Vegas-Henderson-North Las Vegas, NV Metro Area',
            
            // Miami variations
            'Miami, FL': 'Miami-Fort Lauderdale-West Palm Beach, FL Metro Area',
            'Miami': 'Miami-Fort Lauderdale-West Palm Beach, FL Metro Area',
            'Miami-Fort Lauderdale': 'Miami-Fort Lauderdale-West Palm Beach, FL Metro Area',
            'Miami-Fort Lauderdale-Pompano Beach, FL': 'Miami-Fort Lauderdale-West Palm Beach, FL Metro Area',
            'Miami-Fort Lauderdale-Pompano Beach': 'Miami-Fort Lauderdale-West Palm Beach, FL Metro Area',
            
            // San Francisco variations
            'San Francisco, CA': 'San Francisco-Oakland-Fremont, CA Metro Area',
            'San Francisco': 'San Francisco-Oakland-Fremont, CA Metro Area',
            'SF': 'San Francisco-Oakland-Fremont, CA Metro Area',
            'San Francisco-Oakland': 'San Francisco-Oakland-Fremont, CA Metro Area',
            'San Francisco Bay Area': 'San Francisco-Oakland-Fremont, CA Metro Area',
            'San Francisco-Oakland-Berkeley, CA': 'San Francisco-Oakland-Fremont, CA Metro Area',
            'San Francisco-Oakland-Berkeley': 'San Francisco-Oakland-Fremont, CA Metro Area',
            
            // Lafayette variations (ensure correct mapping)
            'Lafayette, LA': 'Lafayette, LA Metro Area',
            'Lafayette-West Lafayette, IN': 'Lafayette-West Lafayette, IN Metro Area',
            
            // Charleston variations (ensure correct mapping)
            'Charleston-North Charleston, SC': 'Charleston-North Charleston, SC Metro Area',
            
            // Other common variations from old naming
            'Birmingham-Hoover, AL': 'Birmingham, AL Metro Area',
            'Nashville-Davidson-Murfreesboro-Franklin, TN': 'Nashville-Davidson--Murfreesboro--Franklin, TN Metro Area',
            'Atlanta-Sandy Springs-Alpharetta, GA': 'Atlanta-Sandy Springs-Roswell, GA Metro Area'
        };
        
        // First, apply hardcoded mappings
        csvNames.forEach(csvName => {
            if (hardcodedMappings[csvName]) {
                mapping[csvName] = hardcodedMappings[csvName];
                console.log(`Hardcoded mapping: "${csvName}" -> "${hardcodedMappings[csvName]}"`);
            }
        });
        
        // Helper function to normalize names for comparison
        const normalize = (name) => {
            return name.toLowerCase()
                .replace(/[^a-z0-9\s]/g, '') // Remove special characters
                .replace(/\s+/g, ' ')        // Normalize whitespace
                .trim();
        };
        
        // Helper function to extract key city names
        const extractCityNames = (name) => {
            return name.split(/[-,]/)
                .map(part => part.trim())
                .filter(part => part.length > 2)
                .map(part => part.replace(/\s+(metro|micro|area|msa).*$/i, ''))
                .map(part => normalize(part));
        };
        
        csvNames.forEach(csvName => {
            // Skip if already mapped by hardcoded mappings
            if (mapping[csvName]) {
                return;
            }
            
            let bestMatch = null;
            let bestScore = 0;
            
            const csvNormalized = normalize(csvName);
            const csvCities = extractCityNames(csvName);
            
            cbsaNames.forEach(cbsaName => {
                // Skip problematic matches that should be handled by hardcoded mappings
                if (csvName.toLowerCase().includes('las vegas') && cbsaName.includes('Las Vegas, NM')) {
                    return; // Skip Las Vegas, NM when looking for Las Vegas (prefer Nevada)
                }
                
                let score = 0;
                const cbsaNormalized = normalize(cbsaName);
                const cbsaCities = extractCityNames(cbsaName);
                
                // Exact match
                if (csvNormalized === cbsaNormalized) {
                    score = 100;
                }
                // Check if CSV name is contained in CBSA name
                else if (cbsaNormalized.includes(csvNormalized)) {
                    score = 80;
                }
                // Check city name matches (more strict)
                else {
                    const cityMatches = csvCities.filter(city => 
                        cbsaCities.some(cbsaCity => {
                            // More strict matching - require at least 4 characters and better overlap
                            if (city.length < 4 || cbsaCity.length < 4) return false;
                            
                            // Check for substantial overlap (at least 80% of shorter string)
                            const minLength = Math.min(city.length, cbsaCity.length);
                            const maxLength = Math.max(city.length, cbsaCity.length);
                            
                            if (city === cbsaCity) return true; // Exact match
                            if (city.includes(cbsaCity) && cbsaCity.length >= minLength * 0.8) return true;
                            if (cbsaCity.includes(city) && city.length >= minLength * 0.8) return true;
                            
                            return false;
                        })
                    ).length;
                    
                    if (cityMatches > 0) {
                        score = Math.min(50 + (cityMatches * 15), 90);
                    }
                }
                
                if (score > bestScore) {
                    bestScore = score;
                    bestMatch = cbsaName;
                }
            });
            
            if (bestMatch && bestScore >= 75) { // Only map if very confident (increased from 50)
                mapping[csvName] = bestMatch;
                if (bestScore < 90) { // Log uncertain mappings
                    console.log(`Mapped: "${csvName}" -> "${bestMatch}" (score: ${bestScore})`);
                }
            } else if (bestMatch) {
                console.warn(`❌ Rejected mapping: "${csvName}" -> "${bestMatch}" (score: ${bestScore} too low)`);
            }
        });
        
        return mapping;
    }
    
    async geocodeMissingMetros(missingMetros, metroCoordinates) {
        console.log('Attempting to geocode missing metros...');
        
        for (const metroName of missingMetros) {
            try {
                // Clean up metro name for geocoding
                const searchQuery = this.cleanMetroName(metroName);
                
                // Use OpenStreetMap Nominatim (free, no API key)
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/search?` +
                    `q=${encodeURIComponent(searchQuery)}&` +
                    `format=json&limit=1&countrycodes=us&` +
                    `addressdetails=1&extratags=1`
                );
                
                const data = await response.json();
                
                if (data && data.length > 0) {
                    const lat = parseFloat(data[0].lat);
                    const lon = parseFloat(data[0].lon);
                    
                    // Add to coordinates object
                    metroCoordinates[metroName] = [lat, lon];
                    
                    console.log(`✅ Found coordinates for ${metroName}: [${lat}, ${lon}]`);
                } else {
                    console.warn(`❌ No coordinates found for: ${metroName}`);
                }
                
                // Rate limiting - be respectful to free API
                await this.sleep(100);
                
            } catch (error) {
                console.error(`Error geocoding ${metroName}:`, error);
            }
        }
        
        console.log('Geocoding complete. Creating metro layer with new coordinates...');
        // Don't call createMetroLayer() recursively - just continue with current execution
    }
    
    cleanMetroName(metroName) {
        // Convert "Dallas-Fort Worth-Arlington, TX" to "Dallas Fort Worth Texas"
        return metroName
            .replace(/-/g, ' ') // Replace hyphens with spaces
            .replace(/,.*$/, '') // Remove everything after first comma
            .replace(/\b(AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY)\b/gi, 
                   (match) => this.getStateName(match)) // Convert state codes to full names
            .trim();
    }
    
    getStateName(code) {
        const states = {
            'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas', 'CA': 'California',
            'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware', 'FL': 'Florida', 'GA': 'Georgia',
            'HI': 'Hawaii', 'ID': 'Idaho', 'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa',
            'KS': 'Kansas', 'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
            'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi', 'MO': 'Missouri',
            'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada', 'NH': 'New Hampshire', 'NJ': 'New Jersey',
            'NM': 'New Mexico', 'NY': 'New York', 'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio',
            'OK': 'Oklahoma', 'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
            'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah', 'VT': 'Vermont',
            'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia', 'WI': 'Wisconsin', 'WY': 'Wyoming'
        };
        return states[code.toUpperCase()] || code;
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    categorizeMetrosBySize(metroData) {
        // Extract active listing counts and sort metros by size
        const metrosWithCounts = Object.keys(metroData)
            .map(name => ({
                name,
                count: metroData[name].active_listing_count || 0
            }))
            .sort((a, b) => b.count - a.count);

        const totalMetros = metrosWithCounts.length;
        const largeCount = Math.ceil(totalMetros * 0.05);  // Top 5% get triangles
        const mediumCount = Math.ceil(totalMetros * 0.10); // Next 10% get squares
        // Remaining 85% get circles

        return {
            large: metrosWithCounts.slice(0, largeCount).map(m => m.name),
            medium: metrosWithCounts.slice(largeCount, largeCount + mediumCount).map(m => m.name),
            small: metrosWithCounts.slice(largeCount + mediumCount).map(m => m.name)
        };
    }


    highlightMarker(marker, highlight) {
        // All metro markers are now circles
        if (marker.setStyle) {
            if (highlight) {
                marker.setStyle({ fillOpacity: 1.0, weight: 4 });
            } else {
                marker.setStyle({ fillOpacity: 0.8, weight: 2 });
            }
        }
    }

    updateLegendForMetroView() {
        const legend = document.querySelector('.legend');
        if (!legend) return;

        legend.innerHTML = `
            <h4>Metro Market Size</h4>
            <div class="legend-scale">
                <div class="legend-item">
                    <div class="legend-color" style="background-color: #ffd700; border-radius: 50%; width: 24px; height: 24px;"></div>
                    <span>Largest Markets (Top 5%)</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color" style="background-color: #40e0d0; border-radius: 50%; width: 18px; height: 18px;"></div>
                    <span>Medium Markets (Next 10%)</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color" style="background-color: #00bfff; border-radius: 50%; width: 12px; height: 12px;"></div>
                    <span>Small Markets (Remaining 85%)</span>
                </div>
                <div style="margin-top: 10px; font-size: 0.8rem; color: #aaa;">
                    <em>Colors represent Beta values • Sizes represent market scale</em>
                </div>
            </div>
        `;
    }

    
    calculateCircleRadius(listingCount, isUniform = false) {
        const zoom = this.map ? this.map.getZoom() : 4;
        
        if (isUniform || this.currentView === 'metro') {
            // Uniform size for metro view - all circles same size
            return Math.max(8000, 20000 * Math.pow(0.7, zoom - 4));
        }
        
        // Variable size for state view - based on listing count
        // Base radius that scales with zoom level (60% of original size)
        const baseRadius = Math.max(6000, 25000 * Math.pow(0.7, zoom - 4)) * 0.6;
        
        // Size multiplier based on listing count (60% of original size)
        const sizeMultiplier = Math.sqrt(listingCount) * Math.max(200, 800 * Math.pow(0.8, zoom - 4)) * 0.6;
        
        return Math.max(baseRadius, sizeMultiplier);
    }
    
    updateCircleSizes() {
        if (!this.currentLayer) return;
        
        this.currentLayer.eachLayer((marker) => {
            if (!marker._stateData || !marker.setRadius) return;
            
            if (this.currentView === 'metro') {
                // Update metro circles based on their size category
                const zoom = this.map ? this.map.getZoom() : 4;
                let newRadius;
                
                if (marker._stateData.sizeCategory === 'large') {
                    newRadius = Math.max(12000, 25000 * Math.pow(0.7, zoom - 4));
                } else if (marker._stateData.sizeCategory === 'medium') {
                    newRadius = Math.max(8000, 18000 * Math.pow(0.7, zoom - 4));
                } else {
                    newRadius = Math.max(4000, 10000 * Math.pow(0.7, zoom - 4));
                }
                
                marker.setRadius(newRadius);
            } else {
                // State view - update circle radius based on listing count
                const newRadius = this.calculateCircleRadius(marker._stateData.listingCount, false);
                marker.setRadius(newRadius);
            }
        });
    }
    
    getBetaColor(beta) {
        if (beta < 0.5) return '#00bfff';
        if (beta < 0.8) return '#40e0d0';
        if (beta < 1.2) return '#ffd700';
        if (beta < 1.5) return '#ff6347';
        return '#ff1493';
    }
    
    // County View Functions
    async createCountyView() {
        if (this.currentDrilledState) {
            // Show counties for the drilled state
            await this.showStateCounties(this.currentDrilledState);
        } else {
            // Show national state boundaries for selection
            await this.showStateBoundariesForCountyView();
        }
    }
    
    async showStateBoundariesForCountyView() {
        // Load state boundaries if not already loaded
        if (!this.stateBoundaries) {
            console.log('Loading state boundaries...');
            try {
                // Using local state boundaries GeoJSON
                const response = await fetch('./state_boundaries.json');
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                this.stateBoundaries = await response.json();
                console.log('State boundaries loaded successfully', this.stateBoundaries.features.length, 'features');
            } catch (error) {
                console.error('Failed to load state boundaries:', error);
                // Fallback: show error message to user
                const dataInfo = document.getElementById('dataInfo');
                if (dataInfo) {
                    dataInfo.textContent = 'Failed to load state boundaries. Please check your internet connection.';
                }
                return;
            }
        }
        
        // Create state boundary layer
        this.currentLayer = L.geoJSON(this.stateBoundaries, {
            style: {
                fillColor: 'transparent',
                weight: 2,
                opacity: 1,
                color: '#666666',
                fillOpacity: 0
            },
            onEachFeature: (feature, layer) => {
                const stateName = feature.properties.NAME;
                
                // Add hover effects
                layer.on('mouseover', () => {
                    layer.setStyle({
                        fillColor: '#ffffff',
                        fillOpacity: 0.7,
                        weight: 3,
                        color: '#333333'
                    });
                });
                
                layer.on('mouseout', () => {
                    layer.setStyle({
                        fillColor: 'transparent',
                        fillOpacity: 0,
                        weight: 2,
                        color: '#666666'
                    });
                });
                
                // Handle state click to drill down to counties
                layer.on('click', async (e) => {
                    // Stop event propagation to prevent conflicts
                    L.DomEvent.stopPropagation(e);
                    e.originalEvent.preventDefault();
                    
                    // Special handling for DC - no counties
                    if (stateName === 'District of Columbia') {
                        console.log('DC has no counties - showing district-level data');
                        this.showDCDetails();
                        return;
                    }
                    
                    console.log(`Drilling down to ${stateName} counties...`);
                    this.currentDrilledState = stateName;
                    this.currentDrillLevel = 'state';
                    await this.showStateCounties(stateName);
                    
                    // Update breadcrumb and header info
                    this.updateBreadcrumb('county', null, stateName);
                    this.showBackButton();
                    this.hideCloseButton();
                    const dataInfo = document.getElementById('dataInfo');
                    if (dataInfo) {
                        dataInfo.textContent = `Viewing ${stateName} counties • Click county for details • Click ↩ to return to national view`;
                    }
                });
                
                // Add tooltip
                layer.bindTooltip(stateName, {
                    permanent: false,
                    direction: 'center',
                    className: 'county-tooltip'
                });
            }
        }).addTo(this.map);
    }
    
    async showStateCounties(stateName) {
        console.log(`Loading counties for ${stateName} with regional navigation...`);
        
        // Show loading indicator
        const dataInfo = document.getElementById('dataInfo');
        if (dataInfo) {
            dataInfo.textContent = `Loading ${stateName} counties...`;
        }
        
        // Load county boundaries for this specific state from pre-split file
        let stateCounties;
        try {
            console.log(`Loading county boundaries for ${stateName}...`);
            const stateFileName = `counties/${stateName.toLowerCase().replace(/ /g, '')}_counties.json`;
            const response = await fetch(`./${stateFileName}`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const countiesData = await response.json();
            stateCounties = countiesData.features;
            console.log(`Loaded ${stateCounties.length} counties for ${stateName} (${(JSON.stringify(countiesData).length/1024).toFixed(1)}KB)`);
        } catch (error) {
            console.error(`Failed to load county boundaries for ${stateName}:`, error);
            if (dataInfo) {
                dataInfo.textContent = `Failed to load ${stateName} county boundaries. Please try again.`;
            }
            return;
        }
        
        // Load state boundaries for regional navigation
        if (!this.stateBoundaries) {
            try {
                const response = await fetch('./state_boundaries.json');
                if (response.ok) {
                    this.stateBoundaries = await response.json();
                }
            } catch (error) {
                console.warn('Could not load state boundaries for regional navigation:', error);
            }
        }
        
        // Clear current layer
        if (this.currentLayer) {
            this.map.removeLayer(this.currentLayer);
        }
        
        // Update progress
        if (dataInfo) {
            dataInfo.textContent = `${stateName} counties loaded • Click county for data`;
        }
        
        
        // Create county layer with default styling
        this.currentLayer = L.geoJSON({
            type: 'FeatureCollection',
            features: stateCounties
        }, {
            style: (feature) => {
                // Default neutral styling - we'll load market data on demand
                return {
                    fillColor: '#f0f0f0',
                    weight: 1,
                    opacity: 1,
                    color: '#999',
                    fillOpacity: 0.4
                };
            },
            onEachFeature: (feature, layer) => {
                const countyName = feature.properties.NAME;
                const stateAbbrev = this.getStateAbbreviation(stateName);
                
                // Basic tooltip without market data
                layer.bindTooltip(`${countyName}, ${stateAbbrev}`, {
                    permanent: false,
                    direction: 'center',
                    className: 'county-tooltip'
                });
                
                // Add hover effects for counties
                layer.on('mouseover', () => {
                    // Don't change style if this county is selected
                    if (this.selectedCountyLayer !== layer) {
                        layer.setStyle({
                            fillColor: '#ffffff',
                            fillOpacity: 0.8,
                            weight: 2,
                            color: '#333'
                        });
                    }
                });
                
                layer.on('mouseout', () => {
                    // Don't revert style if this county is selected
                    if (this.selectedCountyLayer !== layer) {
                        layer.setStyle({
                            fillColor: '#f0f0f0',
                            fillOpacity: 0.4,
                            weight: 1,
                            color: '#999'
                        });
                    }
                });
                
                // Click handler for detailed data
                layer.on('click', async (e) => {
                    L.DomEvent.stopPropagation(e);
                    
                    // Clear previous selection
                    if (this.selectedCountyLayer) {
                        this.selectedCountyLayer.setStyle({
                            fillColor: '#f0f0f0',
                            fillOpacity: 0.4,
                            weight: 1,
                            color: '#999'
                        });
                    }
                    
                    // Set new selection with white fill and gold border
                    this.selectedCountyLayer = layer;
                    this.currentDrillLevel = 'county';
                    layer.setStyle({
                        fillColor: '#ffffff',
                        fillOpacity: 0.8,
                        weight: 3,
                        color: '#FFD700'
                    });
                    
                    const countyFIPS = feature.properties.STATE + feature.properties.COUNTY;
                    
                    // Snap to county bounds for better focus
                    this.map.fitBounds(layer.getBounds(), {
                        padding: [50, 50],
                        maxZoom: 10
                    });
                    
                    await this.showCountyDetail(countyFIPS, countyName, stateAbbrev);
                });
            }
        }).addTo(this.map);
        
        // Fit map to state bounds with padding
        // Special handling for Alaska's geographic extent
        if (stateName.toLowerCase() === 'alaska') {
            this.map.setView([64.0685, -152.2782], 4); // Alaska center
        } else {
            this.map.fitBounds(this.currentLayer.getBounds(), {
                padding: [20, 20],
                maxZoom: 8
            });
        }
        
        // Remove any existing keyboard handlers first
        this.map.off('keydown');
        
        // Add ESC key handler for returning to national view
        this.map.getContainer().focus(); // Make map focusable
        this.map.getContainer().tabIndex = 0;
        
        const escHandler = (e) => {
            if (e.key === 'Escape' || e.keyCode === 27) {
                this.returnToNationalCountyView();
                document.removeEventListener('keydown', escHandler);
            }
        };
        
        document.addEventListener('keydown', escHandler);
        
        // Store handler reference for cleanup
        this.currentEscHandler = escHandler;
        
        // Create state navigation layer for switching between states while in county view
        if (this.stateBoundaries) {
            // Remove any existing state navigation layer first
            if (this.stateNavigationLayer) {
                this.map.removeLayer(this.stateNavigationLayer);
            }
            
            this.stateNavigationLayer = L.geoJSON(this.stateBoundaries, {
                style: (feature) => {
                    const isCurrentState = feature.properties.NAME === stateName;
                    return {
                        fillColor: 'transparent',
                        weight: isCurrentState ? 0 : 2,
                        opacity: isCurrentState ? 0 : 0.7,
                        color: isCurrentState ? 'transparent' : '#666666',
                        fillOpacity: 0,
                        interactive: !isCurrentState
                    };
                },
                onEachFeature: (feature, layer) => {
                    const otherStateName = feature.properties.NAME;
                    
                    // Skip current state - it's not interactive
                    if (otherStateName === stateName) {
                        return;
                    }
                    
                    // Add hover effects for other states
                    layer.on('mouseover', () => {
                        layer.setStyle({
                            fillColor: '#ffffff',
                            fillOpacity: 0.7,
                            weight: 3,
                            color: '#333333'
                        });
                    });
                    
                    layer.on('mouseout', () => {
                        layer.setStyle({
                            fillColor: 'transparent',
                            fillOpacity: 0,
                            weight: 2,
                            color: '#666666'
                        });
                    });
                    
                    // Handle state click to switch to that state's counties
                    layer.on('click', async (e) => {
                        L.DomEvent.stopPropagation(e);
                        e.originalEvent.preventDefault();
                        
                        // Special handling for DC
                        if (otherStateName === 'District of Columbia') {
                            console.log('DC has no counties - showing district-level data');
                            this.showDCDetails();
                            return;
                        }
                        
                        console.log(`Switching to ${otherStateName} counties...`);
                        this.currentDrilledState = otherStateName;
                        await this.showStateCounties(otherStateName);
                        
                        // Update breadcrumb and header info
                        this.updateBreadcrumb('county', null, otherStateName);
                        const dataInfo = document.getElementById('dataInfo');
                        if (dataInfo) {
                            dataInfo.textContent = `Viewing ${otherStateName} counties • Click county for details • Click ↩ to return to national view`;
                        }
                    });
                    
                    // Add tooltip for other states
                    layer.bindTooltip(`Switch to ${otherStateName}`, {
                        permanent: false,
                        direction: 'center',
                        className: 'county-tooltip'
                    });
                }
            }).addTo(this.map);
            
            // Make sure state navigation layer is below county layer
            if (this.currentLayer) {
                this.currentLayer.bringToFront();
            }
        }
    }
    
    async loadCountyDataForState(stateName) {
        try {
            if (this.useStaticData && window.completeStaticDataLoader) {
                // Use static data loader
                return await window.completeStaticDataLoader.getCountiesByState(stateName);
            } else {
                // Fallback to API
                const response = await fetch(`${this.API_BASE_URL}/counties/${stateName.toLowerCase()}`);
                if (response.ok) {
                    return await response.json();
                }
            }
        } catch (error) {
            console.error(`Failed to load county data for ${stateName}:`, error);
        }
        return {};
    }
    
    async showCountyDetail(countyFIPS, countyName, stateName) {
        try {
            let countyData = null;
            
            if (this.useStaticData && window.completeStaticDataLoader) {
                // Use static data loader
                countyData = await window.completeStaticDataLoader.getCountyData(countyFIPS);
            } else {
                // Fallback to API
                const response = await fetch(`${this.API_BASE_URL}/county/${countyFIPS}`);
                if (response.ok) {
                    countyData = await response.json();
                }
            }
            
            this.displayCountyDetails(countyData, countyName, stateName);
        } catch (error) {
            console.error(`Failed to load county details for ${countyName}:`, error);
            this.displayCountyDetails(null, countyName, stateName);
        }
    }
    
    displayCountyDetails(countyData, countyName, stateName) {
        const detailContent = document.getElementById('detailContent');
        
        if (!detailContent) return;
        
        // Store current county data for access in lightboxes
        this.currentCountyData = countyData;
        
        if (!countyData) {
            detailContent.innerHTML = `
                <div style="text-align: center; margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 2px solid #444;">
                    <h2 style="color: #ffffff; margin: 0; font-size: 1.4rem;">${countyName}, ${stateName}</h2>
                    <span style="color: #aaa; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px;">COUNTY DATA NOT AVAILABLE</span>
                </div>
                <p style="text-align: center; color: #aaa;">County market data is not available for this location.</p>
            `;
            return;
        }
        
        // Helper function to get change class
        const getChangeClass = (value) => {
            if (value > 0) return 'change-positive';
            if (value < 0) return 'change-negative';
            return '';
        };
        
        // Use the FIPS code as county identifier for API calls
        const countyId = countyData.county_fips;
        
        const content = `
            <div style="text-align: center; margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 2px solid #444;">
                <h2 style="color: #ffffff; margin: 0; font-size: 1.4rem;">${countyName}, ${stateName}</h2>
                <span style="color: #aaa; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px;">COUNTY • ${this.formatDate(countyData.month_date)}</span>
            </div>
            
            <div style="text-align: center; margin-bottom: 1rem; color: #ccc; font-size: 0.85rem;">
                Click metric cards below for detailed trend analysis
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; grid-template-rows: auto auto; gap: 1rem; margin-bottom: 1rem;">
                <!-- Active Listings (spans 2 columns) -->
                <div class="metric-card" style="grid-column: 1 / 3; display: flex; flex-direction: column; cursor: pointer;" onclick="window.dashboard.showCountyTrendLightbox('${countyId}', 'active_listing_count')">
                    <h5>Active Listings</h5>
                    <div class="metric-value">${this.formatValue(countyData.active_listing_count)}</div>
                    <div style="flex-grow: 1; display: flex; align-items: center;">
                        <div class="metric-change" style="width: 85%;">
                            <span class="${getChangeClass(countyData.active_listing_count_mm)}">MoM: ${this.formatPercent(countyData.active_listing_count_mm)}%</span>
                            <span class="${getChangeClass(countyData.active_listing_count_yy)}">YoY: ${this.formatPercent(countyData.active_listing_count_yy)}%</span>
                        </div>
                    </div>
                </div>
                
                <!-- Median Price -->
                <div class="metric-card" style="cursor: pointer;" onclick="window.dashboard.showCountyTrendLightbox('${countyId}', 'median_listing_price')">
                    <h5>Median Price</h5>
                    <div class="metric-value" style="color: #ffd700;">$${this.formatPrice(countyData.median_listing_price)}</div>
                    <div class="metric-change">
                        <span class="${getChangeClass(countyData.median_listing_price_mm)}">MoM: ${this.formatPercent(countyData.median_listing_price_mm)}%</span>
                        <span class="${getChangeClass(countyData.median_listing_price_yy)}">YoY: ${this.formatPercent(countyData.median_listing_price_yy)}%</span>
                    </div>
                </div>
                
                <!-- New Listings -->
                <div class="metric-card" style="cursor: pointer;" onclick="window.dashboard.showCountyTrendLightbox('${countyId}', 'new_listing_count')">
                    <h5>New Listings</h5>
                    <div class="metric-value">${this.formatValue(countyData.new_listing_count)}</div>
                    <div class="metric-change">
                        <span class="${getChangeClass(countyData.new_listing_count_mm)}">MoM: ${this.formatPercent(countyData.new_listing_count_mm)}%</span>
                        <span class="${getChangeClass(countyData.new_listing_count_yy)}">YoY: ${this.formatPercent(countyData.new_listing_count_yy)}%</span>
                    </div>
                </div>
                
                <!-- Pending Listings -->
                <div class="metric-card" style="cursor: pointer;" onclick="window.dashboard.showCountyTrendLightbox('${countyId}', 'pending_listing_count')">
                    <h5>Pending Sale</h5>
                    <div class="metric-value">${this.formatValue(countyData.pending_listing_count)}</div>
                    <div class="metric-change">
                        <span class="${getChangeClass(countyData.pending_listing_count_mm)}">MoM: ${this.formatPercent(countyData.pending_listing_count_mm)}%</span>
                        <span class="${getChangeClass(countyData.pending_listing_count_yy)}">YoY: ${this.formatPercent(countyData.pending_listing_count_yy)}%</span>
                    </div>
                </div>
                
                <!-- Median Days on Market -->
                <div class="metric-card" style="cursor: pointer;" onclick="window.dashboard.showCountyTrendLightbox('${countyId}', 'median_days_on_market')">
                    <h5>Median Days</h5>
                    <div class="metric-value">${this.formatValue(countyData.median_days_on_market)}</div>
                    <div class="metric-change">
                        <span class="${getChangeClass(countyData.median_days_on_market_mm)}">MoM: ${this.formatPercent(countyData.median_days_on_market_mm)}%</span>
                        <span class="${getChangeClass(countyData.median_days_on_market_yy)}">YoY: ${this.formatPercent(countyData.median_days_on_market_yy)}%</span>
                    </div>
                </div>
            </div>
        `;
        
        detailContent.innerHTML = content;
        
        // Mobile: Show sidebar as bottom sheet
        if (window.innerWidth <= 768) {
            this.showMobileSidebar();
        }
    }
    
    async showCountyTrendLightbox(countyId, metric) {
        try {
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
            
            // Try to get county name from current county data, fallback to FIPS code
            let countyName = countyId;
            if (this.currentCountyData && this.currentCountyData.county_name) {
                countyName = this.currentCountyData.county_name.split(',')[0]; // Get county name without state
                countyName = countyName.charAt(0).toUpperCase() + countyName.slice(1); // Capitalize first letter
            }
            
            // Define which metrics support indexed performance
            const indexedMetrics = ['active_listing_count', 'median_listing_price', 'new_listing_count', 'pending_listing_count'];
            const supportsIndexed = indexedMetrics.includes(metric);
            
            // Update title and subtitle based on whether indexed performance is available
            if (supportsIndexed) {
                title.textContent = `${metricLabels[metric]} vs National Index - 5 Year Trend`;
                subtitle.textContent = `${countyName} County • Performance vs National Trends`;
            } else {
                title.textContent = `${metricLabels[metric]} - 5 Year Trend`;
                subtitle.textContent = `${countyName} County • Historical Performance`;
            }
            
            // Show overlay
            overlay.classList.add('active');
            
            // Try indexed performance first for supported metrics
            if (supportsIndexed) {
                try {
                    let indexedData = null;
                    
                    if (this.useStaticData && window.completeStaticDataLoader) {
                        // Use static data loader for county data
                        const metricMap = {
                            'active_listing_count': 'active',
                            'median_listing_price': 'median_price',
                            'new_listing_count': 'new_listings',
                            'pending_listing_count': 'pending_sale'
                        };
                        const staticMetric = metricMap[metric];
                        
                        const rawData = await window.completeStaticDataLoader.getCountyIndexedPerformance(staticMetric, countyId);
                        if (rawData && rawData.length > 0) {
                            indexedData = window.completeStaticDataLoader.formatChartData(rawData, countyId, staticMetric);
                        }
                    } else {
                        // Fallback to API calls
                        const endpointMap = {
                            'active_listing_count': 'active',
                            'median_listing_price': 'median-price',
                            'new_listing_count': 'new-listings',
                            'pending_listing_count': 'pending-sale'
                        };
                        
                        const endpoint = endpointMap[metric];
                        const apiPath = `${this.API_BASE_URL}/indexed-performance/county/${endpoint}/${countyId}`;
                        
                        const response = await fetch(apiPath);
                        if (response.ok) {
                            indexedData = await response.json();
                        }
                    }
                    
                    if (indexedData) {
                        setTimeout(() => {
                            this.renderCountyIndexedPerformanceChart(indexedData, countyName);
                            this.populateCountyIndexedPerformanceStats(indexedData, statsContainer, metric, this.currentCountyData, countyId);
                        }, 100);
                        return;
                    }
                } catch (error) {
                    console.warn('Failed to load county indexed performance data, falling back to regular chart:', error);
                }
            }
            
            // Fallback to regular trend data for unsupported metrics or if indexed performance fails  
            // For median days on market, show regular trend view similar to states
            if (metric === 'median_days_on_market') {
                setTimeout(() => {
                    this.showCountyMedianDaysTrend(countyId, countyName, statsContainer);
                }, 100);
                return;
            }
            
            // If we get here, show an error for indexed metrics that failed
            setTimeout(() => {
                statsContainer.innerHTML = `
                    <div style="grid-column: 1 / -1; text-align: center; padding: 2rem;">
                        <h3 style="color: #fff; margin-bottom: 1rem;">County Data Unavailable</h3>
                        <p style="color: #aaa; margin-bottom: 1.5rem;">
                            ${metricLabels[metric]} indexed performance data is not available for ${countyName} County.
                        </p>
                        <p style="color: #ccc; font-size: 0.9rem;">
                            County FIPS: ${countyId} • This county may not have sufficient data for analysis.
                        </p>
                    </div>
                `;
            }, 100);
            
        } catch (error) {
            console.error(`Failed to load county trend data for ${countyName} (${countyId}):`, error);
            
            // Show error message
            const statsContainer = document.getElementById('lightboxStats');
            setTimeout(() => {
                statsContainer.innerHTML = `
                    <div style="grid-column: 1 / -1; text-align: center; padding: 2rem;">
                        <h3 style="color: #fff; margin-bottom: 1rem;">Unable to Load County Data</h3>
                        <p style="color: #aaa; margin-bottom: 1.5rem;">
                            ${metricLabels[metric]} trend data could not be loaded for ${countyName} County.
                        </p>
                        <p style="color: #666; font-size: 0.9rem;">
                            County FIPS: ${countyId}
                        </p>
                        <p style="color: #666; font-size: 0.9rem;">
                            Error: ${error.message}
                        </p>
                    </div>
                `;
            }, 100);
        }
    }
    
    async showDCDetails() {
        const detailContent = document.getElementById('detailContent');
        
        // Update breadcrumb
        this.updateBreadcrumb('state', null, 'District of Columbia');
        this.showBackButton();
        this.hideCloseButton();
        
        // Update data info
        const dataInfo = document.getElementById('dataInfo');
        if (dataInfo) {
            dataInfo.textContent = 'Loading DC market data...';
        }
        
        try {
            // Load DC state-level data as a substitute for county data
            const response = await fetch(`${this.API_BASE_URL}/state/District of Columbia`);
            if (response.ok) {
                const dcData = await response.json();
                this.displayDCDetails(dcData);
            } else {
                this.displayDCDetails(null);
            }
        } catch (error) {
            console.error('Failed to load DC market data:', error);
            this.displayDCDetails(null);
        }
    }
    
    displayDCDetails(dcData) {
        const detailContent = document.getElementById('detailContent');
        
        let content = `<h3>District of Columbia</h3>`;
        
        if (dcData) {
            content += `
                <div class="metric-section">
                    <h4>Market Overview</h4>
                    <div class="metric-row">
                        <span class="metric-label">Median Listing Price:</span>
                        <span class="metric-value">$${dcData.median_listing_price?.toLocaleString() || 'N/A'}</span>
                    </div>
                    <div class="metric-row">
                        <span class="metric-label">Active Listings:</span>
                        <span class="metric-value">${dcData.active_listing_count?.toLocaleString() || 'N/A'}</span>
                    </div>
                    <div class="metric-row">
                        <span class="metric-label">New Listings:</span>
                        <span class="metric-value">${dcData.new_listing_count?.toLocaleString() || 'N/A'}</span>
                    </div>
                    <div class="metric-row">
                        <span class="metric-label">Median Days on Market:</span>
                        <span class="metric-value">${dcData.median_days_on_market || 'N/A'}</span>
                    </div>
                    <div class="metric-row">
                        <span class="metric-label">Total Listings:</span>
                        <span class="metric-value">${dcData.total_listing_count?.toLocaleString() || 'N/A'}</span>
                    </div>
                    <div class="metric-row">
                        <span class="metric-label">Pending Ratio:</span>
                        <span class="metric-value">${dcData.pending_ratio ? (dcData.pending_ratio * 100).toFixed(1) + '%' : 'N/A'}</span>
                    </div>
                </div>
            `;
        } else {
            content += `
                <div class="metric-section">
                    <p>The District of Columbia operates as a single administrative unit without counties.</p>
                    <p>Market data not currently available.</p>
                </div>
            `;
        }
        
        detailContent.innerHTML = content;
        
        // Update data info
        const dataInfo = document.getElementById('dataInfo');
        if (dataInfo) {
            dataInfo.textContent = 'DC market data loaded • District operates as single unit';
        }
    }
    
    showCountyDetails(countyFIPS, countyName, countyData) {
        console.log(`Showing details for ${countyName} (${countyFIPS})`);
        
        // Store current county data for access in lightboxes
        this.currentCountyData = countyData;
        
        // Update breadcrumb to show county level
        this.updateBreadcrumb('county', countyName, this.currentDrilledState);
        
        // Show back button for county level, hide close button
        this.showBackButton();
        this.hideCloseButton();
        
        // Clear the trends section and destroy chart when switching to county view
        const trendsSection = document.getElementById('trendsSection');
        if (trendsSection) {
            trendsSection.style.display = 'none';
            // Destroy any existing trends chart
            if (this.trendsChart) {
                this.trendsChart.destroy();
                this.trendsChart = null;
            }
        }
        
        const detailContent = document.getElementById('detailContent');
        if (!detailContent || !countyData) return;
        
        detailContent.innerHTML = `
            <div class="county-detail">
                <h4>${countyName} County</h4>
                <div class="county-metrics">
                    <div class="metric">
                        <span class="label">Median Listing Price:</span>
                        <span class="value">$${countyData.median_listing_price?.toLocaleString() || 'N/A'}</span>
                    </div>
                    <div class="metric">
                        <span class="label">Active Listings:</span>
                        <span class="value">${countyData.active_listing_count?.toLocaleString() || 'N/A'}</span>
                    </div>
                    <div class="metric">
                        <span class="label">New Listings:</span>
                        <span class="value">${countyData.new_listing_count?.toLocaleString() || 'N/A'}</span>
                    </div>
                    <div class="metric">
                        <span class="label">Median Days on Market:</span>
                        <span class="value">${countyData.median_days_on_market || 'N/A'}</span>
                    </div>
                </div>
                <button onclick="dashboard.loadCountyTrends('${countyFIPS}', '${countyName}')" class="trend-button">
                    View 5-Year Trends
                </button>
            </div>
        `;
    }
    
    async loadCountyTrends(countyFIPS, countyName) {
        try {
            const response = await fetch(`${this.API_BASE_URL}/county/${countyFIPS}/trends`);
            if (!response.ok) throw new Error('Failed to load trends');
            
            const trendData = await response.json();
            this.displayTrendLightbox(trendData, `${countyName} County`);
        } catch (error) {
            console.error('Failed to load county trends:', error);
        }
    }
    
    returnToStateView() {
        console.log('Returning to state view...');
        
        // Clear county selection but keep state
        this.selectedCountyLayer = null;
        this.currentDrillLevel = 'state';
        
        // Clear county details from sidebar but don't restore to default
        const detailContent = document.getElementById('detailContent');
        const trendsSection = document.getElementById('trendsSection');
        
        if (trendsSection) {
            trendsSection.style.display = 'none';
            
            // Clear any existing trends chart when returning to state view
            if (this.trendsChart) {
                this.trendsChart.destroy();
                this.trendsChart = null;
            }
        }
        
        if (detailContent && this.currentDrilledState) {
            detailContent.innerHTML = `
                <div class="sidebar-intro">
                    <h3>${this.currentDrilledState} Counties</h3>
                    <p>Click on a county to view detailed market analysis.</p>
                </div>
            `;
        }
        
        // Update breadcrumb and header info  
        this.updateBreadcrumb('county', null, this.currentDrilledState);
        const dataInfo = document.getElementById('dataInfo');
        if (dataInfo) {
            dataInfo.textContent = `${this.currentDrilledState} counties loaded • Click a county for market data`;
        }
    }

    returnToNationalCountyView() {
        console.log('Returning to national county view...');
        this.currentDrilledState = null;
        this.currentDrillLevel = 'national';
        
        // Clear any selected county and state
        this.selectedCountyLayer = null;
        this.selectedStateLayer = null;
        
        // Restore default sidebar content
        this.restoreDefaultSidebar();
        
        // Update breadcrumb and header info
        this.updateBreadcrumb('national');
        this.hideCloseButton();
        this.hideBackButton();
        const dataInfo = document.getElementById('dataInfo');
        if (dataInfo) {
            dataInfo.textContent = 'Click on a state to view its counties';
        }
        
        // Clean up event handlers
        this.map.off('click');
        if (this.currentEscHandler) {
            document.removeEventListener('keydown', this.currentEscHandler);
            this.currentEscHandler = null;
        }
        
        // Clear the current layers first
        if (this.currentLayer) {
            this.map.removeLayer(this.currentLayer);
            this.currentLayer = null;
        }
        if (this.stateNavigationLayer) {
            this.map.removeLayer(this.stateNavigationLayer);
            this.stateNavigationLayer = null;
        }
        
        // Reset map view with smooth animation
        this.map.setView([39.50, -98.35], 4, {
            animate: true,
            duration: 0.5
        });
        
        // Reload national state boundaries after a short delay
        setTimeout(() => {
            this.showStateBoundariesForCountyView();
        }, 200);
    }
    
    updateSidebarTitle() {
        const sidebarTitle = document.querySelector('#detailPanel h3');
        if (sidebarTitle) {
            let title = '';
            switch (this.currentView) {
                case 'state':
                    title = 'State Market Analysis';
                    break;
                case 'metro':
                    title = 'Metro Market Analysis';
                    break;
                case 'county':
                    title = 'County Market Analysis';
                    break;
                default:
                    title = 'Market Analysis';
            }
            sidebarTitle.textContent = title;
        }
    }
    
    restoreDefaultSidebar() {
        const detailContent = document.getElementById('detailContent');
        const trendsSection = document.getElementById('trendsSection');
        
        // Close any open lightboxes
        const trendLightbox = document.getElementById('trendLightbox');
        if (trendLightbox) {
            trendLightbox.classList.remove('active');
            
            // Only destroy chart when closing lightbox, not on view change
            if (window.trendChart) {
                window.trendChart.destroy();
                window.trendChart = null;
            }
        }
        
        // Clear any stored county data but preserve state data for backing out
        this.currentCountyData = null;
        
        // Hide trends section
        if (trendsSection) {
            trendsSection.style.display = 'none';
        }
        
        // Restore default sidebar content based on current view
        if (detailContent) {
            let content = '';
            switch (this.currentView) {
                case 'state':
                    content = `
                        <div class="sidebar-intro">
                            <p>Click on a state to view comprehensive market analysis including:</p>
                            <ul>
                                <li>Volatility analysis</li>
                                <li>Month-over-Month changes</li>
                                <li>Year-over-Year trends</li>
                                <li>Market positioning analysis</li>
                            </ul>
                        </div>
                    `;
                    break;
                case 'metro':
                    content = `
                        <div class="sidebar-intro">
                            <p>Click on a metro area to view comprehensive market analysis including:</p>
                            <ul>
                                <li>Volatility analysis</li>
                                <li>Month-over-Month changes</li>
                                <li>Year-over-Year trends</li>
                                <li>Market positioning analysis</li>
                            </ul>
                        </div>
                    `;
                    break;
                case 'county':
                    content = `
                        <div class="sidebar-intro">
                            <p>Click on a state to view its counties, then click a county for comprehensive market analysis including:</p>
                            <ul>
                                <li>Volatility analysis</li>
                                <li>Month-over-Month changes</li>
                                <li>Year-over-Year trends</li>
                                <li>Market positioning analysis</li>
                            </ul>
                        </div>
                    `;
                    break;
                default:
                    content = `
                        <div class="sidebar-intro">
                            <p>Click on a location to view comprehensive market analysis including:</p>
                            <ul>
                                <li>Volatility analysis</li>
                                <li>Month-over-Month changes</li>
                                <li>Year-over-Year trends</li>
                                <li>Market positioning analysis</li>
                            </ul>
                        </div>
                    `;
            }
            detailContent.innerHTML = content;
        }
    }
    
    getStateNameFromFIPS(stateFIPS) {
        const fipsToState = {
            '01': 'Alabama', '02': 'Alaska', '04': 'Arizona', '05': 'Arkansas', '06': 'California',
            '08': 'Colorado', '09': 'Connecticut', '10': 'Delaware', '11': 'District of Columbia',
            '12': 'Florida', '13': 'Georgia', '15': 'Hawaii', '16': 'Idaho', '17': 'Illinois',
            '18': 'Indiana', '19': 'Iowa', '20': 'Kansas', '21': 'Kentucky', '22': 'Louisiana',
            '23': 'Maine', '24': 'Maryland', '25': 'Massachusetts', '26': 'Michigan', '27': 'Minnesota',
            '28': 'Mississippi', '29': 'Missouri', '30': 'Montana', '31': 'Nebraska', '32': 'Nevada',
            '33': 'New Hampshire', '34': 'New Jersey', '35': 'New Mexico', '36': 'New York',
            '37': 'North Carolina', '38': 'North Dakota', '39': 'Ohio', '40': 'Oklahoma',
            '41': 'Oregon', '42': 'Pennsylvania', '44': 'Rhode Island', '45': 'South Carolina',
            '46': 'South Dakota', '47': 'Tennessee', '48': 'Texas', '49': 'Utah', '50': 'Vermont',
            '51': 'Virginia', '53': 'Washington', '54': 'West Virginia', '55': 'Wisconsin', '56': 'Wyoming'
        };
        return fipsToState[stateFIPS] || 'Unknown';
    }
    
    getStateAbbreviation(stateName) {
        const stateToAbbrev = {
            'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR', 'California': 'CA',
            'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE', 'District of Columbia': 'DC',
            'Florida': 'FL', 'Georgia': 'GA', 'Hawaii': 'HI', 'Idaho': 'ID', 'Illinois': 'IL',
            'Indiana': 'IN', 'Iowa': 'IA', 'Kansas': 'KS', 'Kentucky': 'KY', 'Louisiana': 'LA',
            'Maine': 'ME', 'Maryland': 'MD', 'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN',
            'Mississippi': 'MS', 'Missouri': 'MO', 'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV',
            'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY',
            'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH', 'Oklahoma': 'OK',
            'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
            'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT', 'Vermont': 'VT',
            'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV', 'Wisconsin': 'WI', 'Wyoming': 'WY'
        };
        return stateToAbbrev[stateName] || stateName;
    }
    
    // Breadcrumb and Navigation System
    updateBreadcrumb(view, county = null, state = null) {
        const breadcrumbNav = document.getElementById('breadcrumbNav');
        const nationalCrumb = document.getElementById('nationalCrumb');
        const stateCrumb = document.getElementById('stateCrumb');
        const stateSeparator = document.getElementById('stateSeparator');
        const countyCrumb = document.getElementById('countyCrumb');
        
        if (!breadcrumbNav) return;
        
        // Show/hide breadcrumb based on drill-down state
        if (view === 'county' && (state || county)) {
            breadcrumbNav.style.display = 'flex';
            
            // Always show national level
            nationalCrumb.onclick = () => this.returnToNationalCountyView();
            
            if (state && !county) {
                // State level: National > State
                stateCrumb.textContent = state;
                stateCrumb.style.display = 'inline';
                stateSeparator.style.display = 'inline';
                stateCrumb.classList.add('active');
                countyCrumb.style.display = 'none';
                
                stateCrumb.onclick = null; // Current level, not clickable
            } else if (county && state) {
                // County level: National > State > County
                stateCrumb.textContent = state;
                stateCrumb.style.display = 'inline';
                stateSeparator.style.display = 'inline';
                stateCrumb.classList.remove('active');
                
                countyCrumb.textContent = county;
                countyCrumb.style.display = 'inline';
                countyCrumb.classList.add('active');
                
                stateCrumb.onclick = () => this.returnToStateView(state);
            }
        } else {
            // Hide breadcrumb for national views
            breadcrumbNav.style.display = 'none';
        }
    }
    
    returnToStateView(stateName) {
        console.log(`Returning to ${stateName} state view...`);
        this.currentDrilledState = stateName;
        this.currentDrillLevel = 'state';
        
        // Clear any selected county
        if (this.selectedCountyLayer) {
            this.selectedCountyLayer.setStyle({
                fillColor: '#f0f0f0',
                fillOpacity: 0.4,
                weight: 1,
                color: '#999'
            });
            this.selectedCountyLayer = null;
        }
        
        // Show back button for state view, hide close button
        this.showBackButton();
        this.hideCloseButton();
        
        // Update breadcrumb and header info for state view
        this.updateBreadcrumb('county', null, stateName);
        const dataInfo = document.getElementById('dataInfo');
        if (dataInfo) {
            dataInfo.textContent = `Viewing ${stateName} counties • Click county for details • Click ↩ to return to national view`;
        }
        
        // Clear county details from sidebar
        const detailContent = document.getElementById('detailContent');
        if (detailContent) {
            detailContent.innerHTML = `
                <div class="sidebar-intro">
                    <p>Click on a county to view comprehensive market analysis including:</p>
                    <ul>
                        <li>Volatility analysis</li>
                        <li>Month-over-Month changes</li>
                        <li>Year-over-Year trends</li>
                        <li>Market positioning analysis</li>
                    </ul>
                </div>
            `;
        }
        
        // Hide the trends section when returning to state view (no state-level chart in county view)
        const trendsSection = document.getElementById('trendsSection');
        if (trendsSection) {
            trendsSection.style.display = 'none';
            
            // Clear any existing charts
            if (this.trendsChart) {
                this.trendsChart.destroy();
                this.trendsChart = null;
            }
            if (window.trendChart) {
                window.trendChart.destroy();
                window.trendChart = null;
            }
        }
        
        this.showStateCounties(stateName);
    }
    
    showCloseButton() {
        if (this.closeButton) {
            this.closeButton.style.display = 'flex';
        }
    }
    
    hideCloseButton() {
        if (this.closeButton) {
            this.closeButton.style.display = 'none';
        }
    }
    
    showBackButton() {
        if (this.backButton) {
            this.backButton.style.display = 'flex';
        }
        if (this.backLabel) {
            this.backLabel.style.display = 'block';
        }
    }
    
    hideBackButton() {
        if (this.backButton) {
            this.backButton.style.display = 'none';
        }
        if (this.backLabel) {
            this.backLabel.style.display = 'none';
        }
    }
    
    returnToPreviousLevel() {
        console.log('Return to previous level - current level:', this.currentDrillLevel);
        
        if (this.currentView === 'county') {
            if (this.currentDrillLevel === 'county') {
                // County level: return to state counties view
                this.returnToStateView(this.currentDrilledState);
            } else if (this.currentDrillLevel === 'state') {
                // State level: return to national view
                this.returnToNationalCountyView();
            }
        } else if (this.currentView === 'state') {
            if (this.currentDrillLevel === 'state') {
                // State level: return to regional view (or national for Alaska/Hawaii)  
                this.returnToRegionalStateView();
            } else if (this.currentDrillLevel === 'regional') {
                // Regional level: return to national state view
                this.returnToNationalStateView();
            }
        }
    }
    
    async returnToRegionalView(stateName) {
        console.log(`Returning to regional view for ${stateName}`);
        
        // Handle Alaska and Hawaii - go directly to national
        if (stateName === 'Alaska' || stateName === 'Hawaii') {
            this.returnToNationalCountyView();
            return;
        }
        
        // Get regional definition for this state
        const regionalDef = this.regionalDefinitions[stateName];
        if (!regionalDef) {
            console.warn(`No regional definition for ${stateName}, returning to national`);
            this.returnToNationalCountyView();
            return;
        }
        
        // Clear current layers
        if (this.currentLayer) {
            this.map.removeLayer(this.currentLayer);
        }
        if (this.stateNavigationLayer) {
            this.map.removeLayer(this.stateNavigationLayer);
        }
        
        // Set regional drill level
        this.currentDrillLevel = 'regional';
        this.currentRegionalBounds = regionalDef.bounds;
        
        // Create regional state layer showing the current state and its neighbors
        await this.createRegionalStateLayer(stateName, regionalDef.neighbors);
        
        // Fit to regional bounds
        this.map.fitBounds(regionalDef.bounds, {
            padding: [30, 30],
            maxZoom: 6
        });
        
        // Update UI
        const dataInfo = document.getElementById('dataInfo');
        if (dataInfo) {
            dataInfo.textContent = `${stateName} region • Click states to view counties • Click back for national view`;
        }
        
        this.showBackButton();
    }
    
    async createRegionalStateLayer(currentState, neighborStates) {
        // Load state boundaries if not already loaded
        if (!this.stateBoundaries) {
            try {
                const response = await fetch('./state_boundaries.json');
                if (response.ok) {
                    this.stateBoundaries = await response.json();
                }
            } catch (error) {
                console.error('Could not load state boundaries for regional view:', error);
                return;
            }
        }
        
        // Filter states to show only current state and neighbors
        const statesToShow = [currentState, ...neighborStates];
        const filteredFeatures = this.stateBoundaries.features.filter(feature => 
            statesToShow.includes(feature.properties.NAME)
        );
        
        // Create regional layer
        this.currentLayer = L.geoJSON({
            type: 'FeatureCollection',
            features: filteredFeatures
        }, {
            style: (feature) => {
                const stateName = feature.properties.NAME;
                const isCurrentState = stateName === currentState;
                
                return {
                    fillColor: isCurrentState ? 'rgba(255, 255, 255, 0.3)' : 'transparent',
                    weight: 2,
                    opacity: 1,
                    color: '#ffffff',
                    fillOpacity: isCurrentState ? 0.3 : 0
                };
            },
            onEachFeature: (feature, layer) => {
                const stateName = feature.properties.NAME;
                
                // Basic tooltip
                layer.bindTooltip(stateName, {
                    permanent: false,
                    direction: 'center',
                    className: 'state-tooltip'
                });
                
                // Add hover effects
                layer.on('mouseover', () => {
                    layer.setStyle({
                        fillColor: '#ffffff',
                        fillOpacity: 0.7,
                        weight: 3,
                        color: '#ffffff'
                    });
                });
                
                layer.on('mouseout', () => {
                    const isCurrentState = stateName === currentState;
                    layer.setStyle({
                        fillColor: isCurrentState ? 'rgba(255, 255, 255, 0.3)' : 'transparent',
                        weight: 2,
                        opacity: 1,
                        color: '#ffffff',
                        fillOpacity: isCurrentState ? 0.3 : 0
                    });
                });
                
                // Click handler to drill down to counties
                layer.on('click', async () => {
                    console.log(`Regional navigation: Drilling down to ${stateName} counties`);
                    
                    // Clear current layers
                    if (this.currentLayer) {
                        this.map.removeLayer(this.currentLayer);
                    }
                    
                    // Update drilled state
                    this.currentDrilledState = stateName;
                    
                    // Navigate to state counties
                    await this.showStateCounties(stateName);
                });
            }
        }).addTo(this.map);
    }
    
    async returnToRegionalStateView() {
        console.log('Returning to regional state view');
        
        // Find which state is currently selected
        let selectedState = null;
        if (this.selectedStateLayer) {
            // Try to get the state name from the selected layer
            const selectedFeature = this.selectedStateLayer.feature;
            if (selectedFeature && selectedFeature.properties) {
                selectedState = selectedFeature.properties.NAME;
            }
        }
        
        if (!selectedState) {
            console.warn('No selected state found, returning to national view');
            this.returnToNationalStateView();
            return;
        }
        
        // Handle Alaska and Hawaii - go directly to national
        if (selectedState === 'Alaska' || selectedState === 'Hawaii') {
            this.returnToNationalStateView();
            return;
        }
        
        // Get regional definition
        const regionalDef = this.regionalDefinitions[selectedState];
        if (!regionalDef) {
            console.warn(`No regional definition for ${selectedState}, returning to national`);
            this.returnToNationalStateView();
            return;
        }
        
        // Set regional drill level
        this.currentDrillLevel = 'regional';
        this.currentRegionalBounds = regionalDef.bounds;
        
        // Create regional state layer for state view
        await this.createRegionalStateViewLayer(selectedState, regionalDef.neighbors);
        
        // Fit to regional bounds
        this.map.fitBounds(regionalDef.bounds, {
            padding: [30, 30],
            maxZoom: 6
        });
        
        // Update UI
        const dataInfo = document.getElementById('dataInfo');
        if (dataInfo) {
            dataInfo.textContent = `${selectedState} region • Click states for analysis • Click back for national view`;
        }
        
        this.showBackButton();
    }
    
    async createRegionalStateViewLayer(currentState, neighborStates) {
        // Filter states to show only current state and neighbors
        const statesToShow = [currentState, ...neighborStates];
        const filteredFeatures = this.stateBoundaries.features.filter(feature => 
            statesToShow.includes(feature.properties.NAME)
        );
        
        // Create regional layer with state view functionality
        this.currentLayer = L.geoJSON({
            type: 'FeatureCollection',
            features: filteredFeatures
        }, {
            style: (feature) => {
                const stateName = feature.properties.NAME;
                const isCurrentState = stateName === currentState;
                
                return {
                    fillColor: isCurrentState ? 'rgba(255, 255, 255, 0.3)' : 'transparent',
                    weight: 2,
                    opacity: 1,
                    color: '#ffffff',
                    fillOpacity: isCurrentState ? 0.3 : 0
                };
            },
            onEachFeature: (feature, layer) => {
                const stateName = feature.properties.NAME;
                const stateData = this.stateData[stateName];
                
                // Add hover effects
                layer.on('mouseover', () => {
                    if (this.selectedStateLayer !== layer) {
                        layer.setStyle({
                            fillColor: '#ffffff',
                            fillOpacity: 0.7,
                            weight: 3,
                            color: '#ffffff'
                        });
                    }
                });
                
                layer.on('mouseout', () => {
                    if (this.selectedStateLayer !== layer) {
                        const isCurrentState = stateName === currentState;
                        layer.setStyle({
                            fillColor: isCurrentState ? 'rgba(255, 255, 255, 0.3)' : 'transparent',
                            weight: 2,
                            opacity: 1,
                            color: '#ffffff',
                            fillOpacity: isCurrentState ? 0.3 : 0
                        });
                    }
                });
                
                // Handle state clicks - same as regular state view
                layer.on('click', () => {
                    if (stateData) {
                        // Clear previous selection
                        if (this.selectedStateLayer) {
                            const prevFeature = this.selectedStateLayer.feature;
                            const prevIsCurrentState = prevFeature && prevFeature.properties.NAME === currentState;
                            this.selectedStateLayer.setStyle({
                                fillColor: prevIsCurrentState ? 'rgba(255, 255, 255, 0.3)' : 'transparent',
                                fillOpacity: prevIsCurrentState ? 0.3 : 0,
                                weight: 2,
                                color: '#ffffff'
                            });
                        }
                        
                        // Set new selection with white fill
                        this.selectedStateLayer = layer;
                        layer.setStyle({
                            fillColor: '#ffffff',
                            fillOpacity: 0.7,
                            weight: 3,
                            color: '#ffffff'
                        });
                        
                        // Update drill level to state
                        this.currentDrillLevel = 'state';
                        
                        // Snap to state bounds with smooth animation
                        const bounds = layer.getBounds();
                        this.map.fitBounds(bounds, {
                            padding: [20, 20],
                            maxZoom: 6,
                            animate: true,
                            duration: 1.0
                        });
                        
                        console.log(`Regional state clicked: ${stateName} - snapping to bounds`);
                        this.showDetailPanel(stateName, stateData);
                    }
                });
                
                // Add tooltip
                layer.bindTooltip(stateName, {
                    permanent: false,
                    direction: 'center',
                    className: 'state-tooltip'
                });
            }
        }).addTo(this.map);
        
        // Set the current state as selected by default
        if (this.selectedStateLayer) {
            this.selectedStateLayer = null;
        }
        
        // Find and select the current state layer
        this.currentLayer.eachLayer((layer) => {
            if (layer.feature && layer.feature.properties.NAME === currentState) {
                this.selectedStateLayer = layer;
                layer.setStyle({
                    fillColor: '#ffffff',
                    fillOpacity: 0.7,
                    weight: 3,
                    color: '#ffffff'
                });
                this.currentDrillLevel = 'state';
            }
        });
    }
    
    returnToNationalStateView() {
        console.log('Returning to national state view');
        
        this.cleanupViewState();
        this.currentDrillLevel = 'national';
        this.createBasicStateLayer();
        
        // Reset map view to national
        this.map.setView([39.50, -98.35], 4);
        
        this.hideCloseButton();
        this.hideBackButton();
    }
    
    returnToNationalView() {
        console.log('Hierarchical navigation - current level:', this.currentDrillLevel);
        
        // Handle different view types with hierarchical navigation
        if (this.currentView === 'county') {
            if (this.currentDrillLevel === 'county') {
                // County level: go back to state view
                this.returnToStateView();
            } else if (this.currentDrillLevel === 'state') {
                // State level: go back to national view
                this.returnToNationalCountyView();
            } else {
                // Already at national level
                this.returnToNationalCountyView();
            }
        } else if (this.currentView === 'state') {
            // Future: state drill-down return logic
            this.cleanupViewState();
            this.createBasicStateLayer();
        } else if (this.currentView === 'metro') {
            // Future: metro drill-down return logic  
            this.cleanupViewState();
            this.createMetroLayer();
        }
        
        // Always hide navigation buttons when returning to national
        this.hideCloseButton();
        this.hideBackButton();
    }
    
    createMetroMarker(coords, color, radius, householdRank) {
        // Determine marker type based on household rank (1 = largest metro)
        // Triangle: Top 50 metros (1-50)
        // Square: Mid-tier metros (51-200)  
        // Circle: Smaller metros (201+)
        
        const baseOptions = {
            color: '#ffffff',
            fillColor: color,
            fillOpacity: 0.8,
            weight: 3,
            interactive: true,
            bubblingMouseEvents: false
        };
        
        if (householdRank <= 50) {
            // Large metros - Triangle (using polygon)
            const size = radius / 1000; // Convert radius to appropriate polygon size
            const height = size * 1.2;
            const width = size;
            
            const triangle = [
                [coords[0] + height/2, coords[1]], // top
                [coords[0] - height/2, coords[1] - width/2], // bottom left  
                [coords[0] - height/2, coords[1] + width/2]  // bottom right
            ];
            
            return L.polygon(triangle, baseOptions);
            
        } else if (householdRank <= 200) {
            // Mid-tier metros - Square (using rectangle)
            const size = radius / 1200; // Convert radius to appropriate size
            const bounds = [
                [coords[0] - size/2, coords[1] - size/2], // southwest
                [coords[0] + size/2, coords[1] + size/2]  // northeast
            ];
            
            return L.rectangle(bounds, baseOptions);
            
        } else {
            // Smaller metros - Circle (original)
            return L.circle(coords, {
                ...baseOptions,
                radius: radius
            });
        }
    }
    
    showPopup(latlng, stateName, stateData) {
        const popupContent = `
            <div class="popup-title" style="color: #ffffff; font-weight: bold; margin-bottom: 0.75rem; text-align: center;">${stateName}</div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; font-size: 0.75rem; min-width: 240px;">
                <!-- Header Row -->
                <div style="color: #ffffff; font-weight: bold; text-align: center; border-bottom: 1px solid #ffffff; padding-bottom: 0.25rem;">Metric</div>
                <div style="color: #ffffff; font-weight: bold; text-align: center; border-bottom: 1px solid #ffffff; padding-bottom: 0.25rem;">Current</div>
                
                <!-- Active Listings Row -->
                <div style="color: #ffffff; padding: 0.25rem 0;">Active</div>
                <div style="color: #ffffff; font-weight: bold; text-align: right; padding: 0.25rem 0;">${Math.round(stateData.active_listing_count || 0).toLocaleString()}</div>
                
                <!-- New Listings Row -->
                <div style="color: #ffffff; padding: 0.25rem 0;">New</div>
                <div style="color: #ffffff; font-weight: bold; text-align: right; padding: 0.25rem 0;">${Math.round(stateData.new_listing_count || 0).toLocaleString()}</div>
                
                <!-- Pending Listings Row -->
                <div style="color: #ffffff; padding: 0.25rem 0;">Pending</div>
                <div style="color: #ffffff; font-weight: bold; text-align: right; padding: 0.25rem 0;">${Math.round(stateData.pending_listing_count || 0).toLocaleString()}</div>
                
                <!-- Median Price Row -->
                <div style="color: #ffffff; padding: 0.25rem 0;">Median ($)</div>
                <div style="color: #ffffff; font-weight: bold; text-align: right; padding: 0.25rem 0;">$${Math.round(stateData.median_listing_price || 0).toLocaleString()}</div>
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
    
    showDetailPanel(locationName, locationData) {
        const detailContent = document.getElementById('detailContent');
        if (!detailContent || !locationData) return;
        
        // Determine if this is state or metro data
        const isState = this.stateData[locationName];
        const isMetro = this.metroData[locationName];
        const locationTypeLabel = isState ? 'STATE' : isMetro ? 'METRO AREA' : 'REGION';
        const locationId = isState ? (locationData.state_id || 'N/A') : (locationData.cbsa_code || 'N/A');
        
        // Helper function to get change class
        const getChangeClass = (value) => {
            if (value > 0) return 'change-positive';
            if (value < 0) return 'change-negative';
            return '';
        };
        
        const content = `
            <div style="text-align: center; margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 2px solid #444;">
                <h2 style="color: #ffffff; margin: 0; font-size: 1.4rem;">${locationName}</h2>
                <span style="color: #aaa; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px;">${locationTypeLabel}: ${locationId} • ${this.formatDate(locationData.last_updated)}</span>
            </div>
            
            <div style="text-align: center; margin-bottom: 1rem; color: #ccc; font-size: 0.85rem;">
                Click metric cards below for detailed trend analysis
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; grid-template-rows: auto auto; gap: 1rem; margin-bottom: 1rem;">
                <!-- Position 11-12: Active Listings (spans 2 columns) -->
                <div class="metric-card" style="grid-column: 1 / 3; display: flex; flex-direction: column; cursor: pointer;" onclick="window.dashboard.showTrendLightbox('${locationName}', 'active_listing_count')">
                    <h5>Active Listings</h5>
                    <div class="metric-value">${this.formatValue(locationData.active_listing_count)}</div>
                    <div style="flex-grow: 1; display: flex; align-items: center;">
                        <div class="metric-change" style="width: 85%;">
                            <span class="${getChangeClass(locationData.active_listing_count_mm)}">MoM: ${this.formatPercent(locationData.active_listing_count_mm)}%</span>
                            <span class="${getChangeClass(locationData.active_listing_count_yy)}">YoY: ${this.formatPercent(locationData.active_listing_count_yy)}%</span>
                        </div>
                    </div>
                </div>
                
                <!-- Position 13: Median Price -->
                <div class="metric-card" style="cursor: pointer;" onclick="window.dashboard.showTrendLightbox('${locationName}', 'median_listing_price')">
                    <h5>Median Price</h5>
                    <div class="metric-value" style="color: #ffd700;">$${this.formatPrice(locationData.median_listing_price)}</div>
                    <div class="metric-change">
                        <span class="${getChangeClass(locationData.median_listing_price_mm)}">MoM: ${this.formatPercent(locationData.median_listing_price_mm)}%</span>
                        <span class="${getChangeClass(locationData.median_listing_price_yy)}">YoY: ${this.formatPercent(locationData.median_listing_price_yy)}%</span>
                    </div>
                </div>
                
                <!-- Position 21: New Listings -->
                <div class="metric-card" style="cursor: pointer;" onclick="window.dashboard.showTrendLightbox('${locationName}', 'new_listing_count')">
                    <h5>New Listings</h5>
                    <div class="metric-value">${this.formatValue(locationData.new_listing_count)}</div>
                    <div class="metric-change">
                        <span class="${getChangeClass(locationData.new_listing_count_mm)}">MoM: ${this.formatPercent(locationData.new_listing_count_mm)}%</span>
                        <span class="${getChangeClass(locationData.new_listing_count_yy)}">YoY: ${this.formatPercent(locationData.new_listing_count_yy)}%</span>
                    </div>
                </div>
                
                <!-- Position 22: Pending Sale -->
                <div class="metric-card" style="cursor: pointer;" onclick="window.dashboard.showTrendLightbox('${locationName}', 'pending_listing_count')">
                    <h5>Pending Sale</h5>
                    <div class="metric-value">${this.formatValue(locationData.pending_listing_count)}</div>
                    <div class="metric-change">
                        <span class="${getChangeClass(locationData.pending_listing_count_mm)}">MoM: ${this.formatPercent(locationData.pending_listing_count_mm)}%</span>
                        <span class="${getChangeClass(locationData.pending_listing_count_yy)}">YoY: ${this.formatPercent(locationData.pending_listing_count_yy)}%</span>
                    </div>
                </div>
                
                <!-- Position 23: Median Days -->
                <div class="metric-card" style="cursor: pointer;" onclick="window.dashboard.showTrendLightbox('${locationName}', 'median_days_on_market')">
                    <h5>Median Days</h5>
                    <div class="metric-value">${this.formatValue(locationData.median_days_on_market)}</div>
                    <div class="metric-change">
                        <span class="${getChangeClass(locationData.median_days_on_market_mm)}">MoM: ${this.formatPercent(locationData.median_days_on_market_mm)}%</span>
                        <span class="${getChangeClass(locationData.median_days_on_market_yy)}">YoY: ${this.formatPercent(locationData.median_days_on_market_yy)}%</span>
                    </div>
                </div>
            </div>
        `;
        
        detailContent.innerHTML = content;
        
        // Mobile: Show sidebar as bottom sheet
        if (window.innerWidth <= 768) {
            this.showMobileSidebar();
        }
        
        // Show trends section for both states and metros - DISABLED
        const trendsSection = document.getElementById('trendsSection');
        if (trendsSection) {
            trendsSection.style.display = 'none'; // Keep trends section hidden
        }
    }
    
    getBetaInterpretation(beta) {
        if (!beta || isNaN(beta)) return 'Beta data unavailable';
        if (beta < 0.8) return 'Lower volatility than national market';
        if (beta > 1.2) return 'Higher volatility than national market';
        return 'Similar volatility to national market';
    }
    
    formatValue(value) {
        if (typeof value !== 'number' || isNaN(value)) return 'N/A';
        return Math.round(value).toLocaleString();
    }

    /**
     * RELATIVE PERFORMANCE ANALYSIS SYSTEM
     * 
     * PURPOSE: Compare how individual markets perform vs national market trends
     * 
     * METHODOLOGY:
     * 1. Each market (state/metro) uses its first period value as 100.0 baseline
     * 2. National market uses its first period value as 100.0 baseline  
     * 3. Both grow independently from their baselines
     * 4. Compare relative performance: Market Index vs National Index
     * 
     * EXAMPLE - Alabama Active Listings:
     * - Alabama Baseline (July 2020): 13,878 listings → 100.0 index
     * - Alabama Current (July 2025): 20,698 listings → 149.1 index (+49% growth)
     * - National Baseline (July 2020): 822,849 listings → 100.0 index
     * - National Current (July 2025): 1,102,787 listings → 134.02 index (+34% growth)
     * - RESULT: Alabama outperformed national by 15.08 points (149.1 - 134.02)
     * 
     * INTERPRETATION: Like stock performance vs S&P 500
     * - Alabama "stock" grew 49% while "market" grew 34%
     * - Alabama outperformed the market by 15 percentage points
     * 
     * USER SEES: "20,698 Active Listings" (actual count)
     * CONTEXT: Alabama performed 15 points better than national average
     */
    
    /**
     * Calculate relative performance of a market vs national trends
     * @param {number} currentValue - Current metric value for the market
     * @param {number} baselineValue - Baseline metric value for the market
     * @param {number} nationalCurrent - Current national metric value
     * @param {number} nationalBaseline - Baseline national metric value
     * @returns {Object} Performance analysis data
     */
    calculateRelativePerformance(currentValue, baselineValue, nationalCurrent, nationalBaseline) {
        if (!currentValue || !baselineValue || !nationalCurrent || !nationalBaseline) {
            return null;
        }
        
        // Calculate market index (market performance vs its baseline)
        const marketIndex = (currentValue / baselineValue) * 100;
        
        // Calculate national index (national performance vs its baseline)  
        const nationalIndex = (nationalCurrent / nationalBaseline) * 100;
        
        // Calculate relative performance difference
        const relativeDifference = marketIndex - nationalIndex;
        
        return {
            marketIndex: Math.round(marketIndex * 10) / 10,
            nationalIndex: Math.round(nationalIndex * 10) / 10,
            relativeDifference: Math.round(relativeDifference * 10) / 10,
            marketGrowth: Math.round((marketIndex - 100) * 10) / 10,
            nationalGrowth: Math.round((nationalIndex - 100) * 10) / 10,
            outperformed: relativeDifference > 0
        };
    }
    
    /**
     * Get performance indicator for metric header
     * @param {Object} locationData - Location data object
     * @param {string} metric - Metric name (e.g., 'active_listing_count')
     * @returns {string} Performance indicator (↗ or ↘ or ≈)
     */
    getPerformanceIndicator(locationData, metric) {
        // For now, we'll use sample baselines - in production this would come from data
        const sampleBaselines = {
            'Alabama': { active_listing_count: 13878 },
            'California': { active_listing_count: 180000 },
            'Texas': { active_listing_count: 140000 }
            // Add more as needed
        };
        
        const locationName = locationData.state_id || locationData.metro_name || 'Unknown';
        const baseline = sampleBaselines[locationName]?.[metric];
        
        if (!baseline) {
            return ''; // No indicator if no baseline data
        }
        
        const current = locationData[metric];
        const nationalCurrent = 1102787; // Sample current national
        const nationalBaseline = 822849; // National baseline
        
        const performance = this.calculateRelativePerformance(
            current, baseline, nationalCurrent, nationalBaseline
        );
        
        if (!performance) return '';
        
        if (performance.relativeDifference > 5) return '↗'; // Outperforming
        if (performance.relativeDifference < -5) return '↘'; // Underperforming  
        return '≈'; // Similar performance
    }
    
    /**
     * Get relative performance text for metric card
     * @param {Object} locationData - Location data object
     * @param {string} metric - Metric name
     * @returns {string} Performance text (e.g., "+15.1")
     */
    getRelativePerformanceText(locationData, metric) {
        // For now, we'll use sample baselines - in production this would come from data
        const sampleBaselines = {
            'Alabama': { active_listing_count: 13878 },
            'California': { active_listing_count: 180000 },
            'Texas': { active_listing_count: 140000 }
        };
        
        const locationName = locationData.state_id || locationData.metro_name || 'Unknown';
        const baseline = sampleBaselines[locationName]?.[metric];
        
        if (!baseline) {
            return 'vs Nat\'l';
        }
        
        const current = locationData[metric];
        const nationalCurrent = 1102787; // Sample current national
        const nationalBaseline = 822849; // National baseline
        
        const performance = this.calculateRelativePerformance(
            current, baseline, nationalCurrent, nationalBaseline
        );
        
        if (!performance) return 'vs Nat\'l';
        
        const diff = performance.relativeDifference;
        const sign = diff > 0 ? '+' : '';
        return `${sign}${diff}`;
    }
    
    /**
     * Format Active Listings using National Index (100.0 baseline)
     * NOTE: This function is kept for compatibility but main display shows raw values
     * @param {number} rawValue - The raw active listing count
     * @returns {string} Formatted indexed value (e.g., "94.7")
     */
    formatActiveListingsIndex(rawValue) {
        if (typeof rawValue !== 'number' || isNaN(rawValue) || rawValue <= 0) {
            return 'N/A';
        }

        // National baseline for Active Listings (July 2020)
        const NATIONAL_BASELINE = 822849;
        
        // Calculate the indexed value
        const indexedValue = (rawValue / NATIONAL_BASELINE) * 100;
        
        // Format to 1 decimal place
        return indexedValue.toFixed(1);
    }
    
    formatBeta(value) {
        if (typeof value !== 'number' || isNaN(value)) return 'N/A';
        return value.toFixed(2);
    }
    
    formatPercent(value) {
        if (typeof value !== 'number' || isNaN(value)) return 'N/A';
        return value.toFixed(1);
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
    
    async loadTrendChart(level, identifier) {
        console.log('Loading trend chart for:', level, identifier);
        console.log('DEBUG: Function started');
        
        const trendsSection = document.getElementById('trendsSection');
        const trendLocation = document.getElementById('trendLocation');
        
        if (!trendsSection) {
            console.error('Trends section not found');
            return;
        }
        
        // Show trends section - DISABLED
        console.log('DEBUG: About to show trends section');
        console.log('DEBUG: Trends section element:', trendsSection);
        trendsSection.style.display = 'none'; // Keep trends section hidden
        console.log('DEBUG: Trends section kept hidden');
        
        // Update location display
        if (trendLocation) {
            trendLocation.textContent = `${level === 'state' ? 'State: ' : 'Metro: '}${identifier}`;
        }
        
        // Show loading state
        this.showTrendLoading();
        
        try {
            console.log('DEBUG: Entered try block');
            let trendData;
            
            // Use SQLite API for both state and metro data - v2
            let apiIdentifier = identifier;
            let displayName = identifier; // Keep original name for display
            console.log('DEBUG: Set initial identifiers');
            
            if (level === 'metro') {
                // Check if identifier is already a CBSA code (numeric)
                console.log(`Checking identifier type: "${identifier}" (type: ${typeof identifier})`);
                if (/^\d+$/.test(String(identifier))) {
                    apiIdentifier = identifier;
                    // Find the metro name for this CBSA code
                    const metroEntry = Object.entries(this.metroData).find(([name, info]) => info.cbsa_code == identifier);
                    if (metroEntry) {
                        displayName = metroEntry[0];
                    }
                    console.log(`✅ Identifier is already CBSA code: ${apiIdentifier}, display name: ${displayName}`);
                } else {
                    displayName = identifier; // Use the metro name as display name
                    // For metros, we need to get the CBSA code from the formatted data
                    const metroInfo = this.metroData[identifier];
                    console.log(`Looking up metro: ${identifier}`);
                    console.log('Metro info found:', metroInfo);
                    
                    if (metroInfo && metroInfo.cbsa_code) {
                        apiIdentifier = metroInfo.cbsa_code;
                        console.log(`Using CBSA code: ${apiIdentifier}`);
                    } else {
                        // Fallback: try to get CBSA code from raw data
                        const rawMetroData = this.dataProcessor.metroData[identifier];
                        if (rawMetroData && rawMetroData[0] && rawMetroData[0].cbsa_code) {
                            apiIdentifier = rawMetroData[0].cbsa_code;
                            console.log(`Using CBSA code from raw data: ${apiIdentifier}`);
                        } else {
                            console.log('Available metros in formatted data:', Object.keys(this.metroData).slice(0, 5));
                            console.log('Available metros in raw data:', Object.keys(this.dataProcessor.metroData).slice(0, 5));
                            throw new Error(`CBSA code not found for metro: ${identifier}`);
                        }
                    }
                }
            }
            
            console.log('DEBUG: About to load trends data');
            let response;
            let data;
            
            if (this.useStaticData && window.completeStaticDataLoader) {
                // Use static data loader
                console.log(`Getting trends from static data: ${level}/${apiIdentifier}`);
                trendData = await window.completeStaticDataLoader.getTrends(level, apiIdentifier);
            } else {
                // Fallback to API
                console.log(`Fetching from URL: ${this.API_BASE_URL}/trends/${level}/${encodeURIComponent(apiIdentifier)}`);
                response = await fetch(`${this.API_BASE_URL}/trends/${level}/${encodeURIComponent(apiIdentifier)}`);
                console.log('DEBUG: Fetch completed');
                console.log('Response status:', response.status);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                trendData = await response.json();
            }
            console.log('DEBUG: Response parsed as JSON');
            console.log('Trend data received:', trendData);
            
            if (trendData) {
                // Override the identifier in trendData with our display name
                if (level === 'metro') {
                    trendData.identifier = displayName;
                }
                this.renderTrendChart(trendData);
            } else {
                throw new Error('No trend data available');
            }
            
        } catch (error) {
            console.error('DEBUG: Caught error in loadTrendChart');
            console.error('Error type:', error.constructor.name);
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
            console.error('Full error object:', error);
            this.showTrendError(`Failed to load trend data: ${error.message}`);
        }
    }
    
    
    showTrendLoading() {
        const chartContainer = document.querySelector('.trend-chart-container');
        if (chartContainer) {
            chartContainer.innerHTML = '<div class="trend-loading">Loading 5-year trend data...</div>';
        }
    }
    
    showTrendError(message) {
        const chartContainer = document.querySelector('.trend-chart-container');
        if (chartContainer) {
            chartContainer.innerHTML = `<div class="trend-error">${message}</div>`;
        }
    }
    
    renderTrendChart(trendData) {
        console.log('Rendering trend chart with data:', trendData);
        console.log('DEBUG: renderTrendChart started');
        
        // Destroy existing chart if it exists
        if (this.trendsChart) {
            console.log('DEBUG: Destroying existing chart');
            this.trendsChart.destroy();
        }
        
        // Reset chart container and create new canvas
        const chartContainer = document.querySelector('.trend-chart-container');
        if (!chartContainer) {
            console.error('Chart container not found');
            return;
        }
        
        console.log('DEBUG: Chart container found:', chartContainer);
        chartContainer.innerHTML = '<canvas id="trendsChart"></canvas>';
        
        // Get fresh canvas reference
        const canvas = document.getElementById('trendsChart');
        if (!canvas) {
            console.error('Canvas element not created');
            return;
        }
        
        console.log('DEBUG: Canvas created:', canvas);
        
        console.log('DEBUG: About to create Chart.js instance');
        console.log('DEBUG: Chart data:', trendData.data);
        
        try {
            this.trendsChart = new Chart(canvas, {
                type: 'line',
                data: trendData.data,
                options: {
                responsive: true,
                maintainAspectRatio: false,
                aspectRatio: 1.8,
                plugins: {
                    title: {
                        display: true,
                        text: `5-Year Market Trends - ${trendData.identifier}`,
                        color: '#ffffff',
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    },
                    legend: {
                        labels: {
                            color: '#ffffff',
                            usePointStyle: true,
                            padding: 12,
                            font: {
                                size: 10
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: '#333333',
                        borderWidth: 1,
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ${context.parsed.y?.toLocaleString() || 'N/A'}`;
                            }
                        }
                    }
                },
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Date',
                            color: '#ffffff',
                            font: {
                                size: 10
                            }
                        },
                        ticks: {
                            color: '#cccccc',
                            maxTicksLimit: 6,
                            font: {
                                size: 9
                            },
                            callback: function(value, index, values) {
                                const label = this.getLabelForValue(value);
                                // Show only January of each year (assuming labels are in 'MMM YYYY' format)
                                if (label && label.startsWith('Jan ')) {
                                    return label;
                                }
                                return '';
                            }
                        },
                        grid: {
                            color: '#333333'
                        }
                    },
                    y: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Number of Listings',
                            color: '#ffffff',
                            font: {
                                size: 10
                            }
                        },
                        ticks: {
                            color: '#cccccc',
                            font: {
                                size: 9
                            },
                            callback: function(value) {
                                return value?.toLocaleString() || '';
                            }
                        },
                        grid: {
                            color: '#333333'
                        }
                    }
                },
                elements: {
                    point: {
                        radius: 2,
                        hoverRadius: 6
                    },
                    line: {
                        tension: 0.1,
                        borderWidth: 2
                    }
                }
            }
        });
            console.log('DEBUG: Chart.js instance created successfully');
            console.log('DEBUG: Chart object:', this.trendsChart);
            
        } catch (error) {
            console.error('DEBUG: Error creating Chart.js instance');
            console.error('Error type:', error.constructor.name);
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
            console.error('Full error object:', error);
        }
    }
    
    
    // Show the trend lightbox for a specific metric
    async showTrendLightbox(locationName, metric) {
        // Check if data processor is available
        if (!this.dataProcessor) {
            console.error('Data processor not available yet');
            return;
        }
        
        // Determine if this is state or metro data
        const stateData = this.stateData[locationName];
        const metroData = this.metroData[locationName];
        const isMetro = !stateData && metroData;
        const data = stateData || metroData;
        
        if (!data) {
            console.error(`No data found for: ${locationName}`);
            return;
        }
        
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
        
        const locationLabel = isMetro ? `${locationName} Metro` : locationName;
        
        // Define which metrics support indexed performance
        const indexedMetrics = ['active_listing_count', 'median_listing_price', 'new_listing_count', 'pending_listing_count'];
        const supportsIndexed = indexedMetrics.includes(metric) && (isMetro || stateData);
        
        // Update title and subtitle based on whether indexed performance is available
        if (supportsIndexed) {
            title.textContent = `${metricLabels[metric]} vs National Index - 5 Year Trend`;
            subtitle.textContent = `${locationLabel} • Performance vs National Trends`;
        } else {
            title.textContent = `${metricLabels[metric]} - 5 Year Trend`;
            subtitle.textContent = `${locationLabel} • ${this.formatDate(data.last_updated)}`;
        }
        
        // Show overlay
        overlay.classList.add('active');
        
        // For median days on market in metro areas, show comparison with national
        if (metric === 'median_days_on_market' && isMetro && data.cbsa_code) {
            try {
                let medianDaysData = null;
                
                if (this.useStaticData && window.completeStaticDataLoader) {
                    // Use static data loader
                    medianDaysData = await window.completeStaticDataLoader.getMetroMedianDays(data.cbsa_code);
                } else {
                    // Fallback to API
                    const response = await fetch(`${this.API_BASE_URL}/median-days/metro/${data.cbsa_code}`);
                    if (response.ok) {
                        medianDaysData = await response.json();
                    }
                }
                
                if (medianDaysData) {
                    setTimeout(() => {
                        this.renderMedianDaysComparisonChart(medianDaysData, locationName);
                        this.populateMedianDaysStats(medianDaysData, statsContainer, data);
                    }, 100);
                    return;
                }
            } catch (error) {
                console.warn('Failed to load median days comparison data, falling back to regular chart:', error);
            }
        }
        
        // For median days on market in state areas, show comparison with national
        if (metric === 'median_days_on_market' && stateData && data.state_id) {
            try {
                let medianDaysData = null;
                
                if (this.useStaticData && window.completeStaticDataLoader) {
                    // Use static data loader
                    medianDaysData = await window.completeStaticDataLoader.getStateMedianDays(data.state_id);
                } else {
                    // Fallback to API
                    const response = await fetch(`${this.API_BASE_URL}/median-days/state/${data.state_id}`);
                    if (response.ok) {
                        medianDaysData = await response.json();
                    }
                }
                
                if (medianDaysData) {
                    setTimeout(() => {
                        this.renderMedianDaysComparisonChart(medianDaysData, locationName);
                        this.populateStateMedianDaysStats(medianDaysData, statsContainer, data);
                    }, 100);
                    return;
                }
            } catch (error) {
                console.warn('Failed to load state median days comparison data, falling back to regular chart:', error);
            }
        }

        // For supported metrics in metro and state areas, try to get indexed performance data
        if (supportsIndexed && (data.cbsa_code || data.state_id)) {
            try {
                let indexedData = null;
                
                if (this.useStaticData && window.completeStaticDataLoader) {
                    // Use static data loader
                    const metricMap = {
                        'active_listing_count': 'active',
                        'median_listing_price': 'median_price',
                        'new_listing_count': 'new_listings', 
                        'pending_listing_count': 'pending_sale'
                    };
                    const staticMetric = metricMap[metric];
                    
                    if (isMetro && data.cbsa_code) {
                        const rawData = await window.completeStaticDataLoader.getMetroIndexedPerformance(staticMetric, data.cbsa_code);
                        if (rawData && rawData.length > 0) {
                            indexedData = window.completeStaticDataLoader.formatChartData(rawData, data.cbsa_code, staticMetric);
                        }
                    } else if (stateData && data.state_id) {
                        const rawData = await window.completeStaticDataLoader.getStateIndexedPerformance(staticMetric, data.state_id);
                        if (rawData && rawData.length > 0) {
                            indexedData = window.completeStaticDataLoader.formatChartData(rawData, data.state_id, staticMetric);
                        }
                    }
                } else {
                    // Fallback to API calls
                    let endpointMap, apiPath;
                    
                    if (isMetro && data.cbsa_code) {
                        // Metro endpoints
                        endpointMap = {
                            'active_listing_count': 'metro',
                            'median_listing_price': 'median-price',
                            'new_listing_count': 'new-listings', 
                            'pending_listing_count': 'pending-sale'
                        };
                        const endpoint = endpointMap[metric];
                        apiPath = `${this.API_BASE_URL}/indexed-performance/${endpoint}/${data.cbsa_code}`;
                    } else if (stateData && data.state_id) {
                        // State endpoints
                        endpointMap = {
                            'active_listing_count': 'active',
                            'median_listing_price': 'median-price',
                            'new_listing_count': 'new-listings', 
                            'pending_listing_count': 'pending-sale'
                        };
                        const endpoint = endpointMap[metric];
                        apiPath = `${this.API_BASE_URL}/indexed-performance/state/${endpoint}/${data.state_id}`;
                    }
                    
                    if (apiPath) {
                        const response = await fetch(apiPath);
                        if (response.ok) {
                            indexedData = await response.json();
                        }
                    }
                }
                
                if (indexedData) {
                    setTimeout(() => {
                        this.renderIndexedPerformanceChart(indexedData, locationName);
                        this.populateIndexedPerformanceStats(indexedData, statsContainer, metric, data);
                    }, 100);
                    return;
                }
            } catch (error) {
                console.warn('Failed to load indexed performance data, falling back to regular chart:', error);
            }
        }
        
        // Fallback to regular historical data
        const trendData = isMetro 
            ? this.dataProcessor.getMetroHistoricalData(locationName, metric, 60)
            : this.dataProcessor.getStateHistoricalData(locationName, metric, 60);
        
        // Render chart
        setTimeout(() => {
            this.renderLightboxChart(trendData, metric, locationName);
            this.populateTrendStats(data, metric, trendData, statsContainer);
        }, 100);
    }
    
    // Render the lightbox trend chart using Chart.js
    renderLightboxChart(trendData, metric, stateName) {
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
                            maxTicksLimit: 6,
                            font: {
                                size: 9
                            },
                            callback: function(value, index, values) {
                                const label = this.getLabelForValue(value);
                                // Show only January of each year (assuming labels are in 'MMM YYYY' format)
                                if (label && label.startsWith('Jan ')) {
                                    return label;
                                }
                                return '';
                            }
                        },
                        grid: {
                            color: '#333333'
                        }
                    },
                    y: {
                        ticks: {
                            color: '#ffffff',
                            font: {
                                size: 9
                            },
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
        
        // Get the appropriate Beta (5Y) value for this metric
        const betaField = `${metric}_beta_5y`;
        const betaValue = stateData[betaField];
        
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
            <div class="lightbox-stat">
                <div class="lightbox-stat-label">Beta (5Y)</div>
                <div class="lightbox-stat-value" style="color: #fff">${betaValue ? this.formatBeta(betaValue) : 'N/A'}</div>
            </div>
        `;
    }
    
    // Render indexed performance chart with actual vs national trend data
    renderIndexedPerformanceChart(indexedData, locationName) {
        const canvas = document.getElementById('lightboxChart');
        if (!canvas) {
            console.error('Lightbox chart canvas not found');
            return;
        }
        
        // Destroy existing chart if it exists
        if (window.trendChart) {
            window.trendChart.destroy();
            window.trendChart = null;
        }
        
        window.trendChart = new Chart(canvas, {
            type: 'line',
            data: indexedData.data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: false // Title is handled by HTML
                    },
                    legend: {
                        labels: {
                            color: '#ffffff',
                            usePointStyle: true,
                            padding: 12,
                            font: {
                                size: 10
                            }
                        },
                        position: 'bottom'
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: '#ffffff',
                        borderWidth: 1,
                        displayColors: true,
                        callbacks: {
                            label: function(context) {
                                const value = context.parsed.y;
                                const label = context.dataset.label;
                                
                                // Show clean National Index values instead of confusing internal calculations
                                if (label.includes('Index')) {
                                    const baseline = context.chart.data.datasets[1].data[0]; // First indexed value
                                    const indexValue = ((value / baseline) * 100).toFixed(1);
                                    
                                    // Determine the metric type from the label
                                    let metricType = 'Active';
                                    if (label.includes('Median Price') || label.includes('Price')) {
                                        metricType = 'Median Price';
                                    } else if (label.includes('New')) {
                                        metricType = 'New Listings';
                                    } else if (label.includes('Pending')) {
                                        metricType = 'Pending Sale';
                                    }
                                    
                                    return `National ${metricType} Index: ${indexValue}`;
                                } else {
                                    return `${label}: ${Math.round(value).toLocaleString()}`;
                                }
                            },
                            afterBody: function(tooltipItems) {
                                if (tooltipItems.length === 2) {
                                    const actual = tooltipItems[0].parsed.y;
                                    const indexed = tooltipItems[1].parsed.y;
                                    const performance = ((actual / indexed) - 1) * 100;
                                    return [`Performance vs Index: ${performance > 0 ? '+' : ''}${performance.toFixed(1)}%`];
                                }
                                return [];
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#ffffff',
                            font: {
                                size: 9
                            },
                            callback: function(value) {
                                return Math.round(value).toLocaleString();
                            }
                        },
                        title: {
                            display: true,
                            text: 'Active Listings Count',
                            color: '#ffffff',
                            font: {
                                size: 10
                            }
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#ffffff',
                            maxTicksLimit: 6,
                            font: {
                                size: 9
                            },
                            callback: function(value, index, values) {
                                const label = this.getLabelForValue(value);
                                // Show only January of each year (assuming labels are in 'MMM YYYY' format)
                                if (label && label.startsWith('Jan ')) {
                                    return label;
                                }
                                return '';
                            }
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
    
    // Populate indexed performance statistics
    populateIndexedPerformanceStats(indexedData, container, metric, locationData) {
        const stats = indexedData.performance_stats;
        const latestPerformance = stats.latest_performance_vs_index * 100;
        const performanceColor = latestPerformance > 0 ? '#00ff7f' : '#ff6b6b';
        const performanceLabel = latestPerformance > 0 ? 'Outperforming' : 'Underperforming';
        
        // Calculate some additional metrics
        const totalGrowthActual = ((stats.latest_actual / stats.baseline_value) - 1) * 100;
        const totalGrowthIndexed = ((stats.latest_indexed / stats.baseline_value) - 1) * 100;
        
        // Determine the label for current value based on metric
        const currentValueLabel = metric === 'median_listing_price' ? 'Current Median Price' : 'Current Count';
        
        // Get the appropriate Beta (5Y) value for this metric
        let betaValue = null;
        if (locationData) {
            const betaField = `${metric}_beta_5y`;
            betaValue = locationData[betaField];
        }
        
        container.innerHTML = `
            <div class="lightbox-stat">
                <div class="lightbox-stat-label">Performance vs National</div>
                <div class="lightbox-stat-value" style="color: ${performanceColor}">
                    ${latestPerformance > 0 ? '+' : ''}${latestPerformance.toFixed(1)}%
                </div>
            </div>
            <div class="lightbox-stat">
                <div class="lightbox-stat-label">Actual Growth (5Y)</div>
                <div class="lightbox-stat-value" style="color: ${totalGrowthActual > 0 ? '#00ff7f' : '#ff6b6b'}">
                    ${totalGrowthActual > 0 ? '+' : ''}${totalGrowthActual.toFixed(1)}%
                </div>
            </div>
            <div class="lightbox-stat">
                <div class="lightbox-stat-label">National Growth (5Y)</div>
                <div class="lightbox-stat-value" style="color: ${totalGrowthIndexed > 0 ? '#00ff7f' : '#ff6b6b'}">
                    ${totalGrowthIndexed > 0 ? '+' : ''}${totalGrowthIndexed.toFixed(1)}%
                </div>
            </div>
            <div class="lightbox-stat">
                <div class="lightbox-stat-label">${currentValueLabel}</div>
                <div class="lightbox-stat-value">${Math.round(stats.latest_actual).toLocaleString()}</div>
            </div>
            <div class="lightbox-stat">
                <div class="lightbox-stat-label">Beta (5Y)</div>
                <div class="lightbox-stat-value" style="color: #fff">${betaValue ? this.formatBeta(betaValue) : 'N/A'}</div>
            </div>
        `;
    }
    
    // Render median days comparison chart with metro vs national data
    renderMedianDaysComparisonChart(medianDaysData, locationName) {
        const canvas = document.getElementById('lightboxChart');
        if (!canvas) {
            console.error('Lightbox chart canvas not found');
            return;
        }
        
        // Destroy existing chart if it exists
        if (window.trendChart) {
            window.trendChart.destroy();
            window.trendChart = null;
        }
        
        window.trendChart = new Chart(canvas, {
            type: 'line',
            data: medianDaysData.data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: false // Title is handled by HTML
                    },
                    legend: {
                        labels: {
                            color: '#ffffff',
                            usePointStyle: true,
                            padding: 12,
                            font: {
                                size: 10
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#ffffff',
                            callback: function(value) {
                                return value.toFixed(0) + ' days';
                            }
                        },
                        title: {
                            display: true,
                            text: 'Median Days on Market',
                            color: '#ffffff'
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#ffffff',
                            maxTicksLimit: 6,
                            font: {
                                size: 9
                            },
                            callback: function(value, index, values) {
                                const label = this.getLabelForValue(value);
                                // Show only January of each year (assuming labels are in 'MMM YYYY' format)
                                if (label && label.startsWith('Jan ')) {
                                    return label;
                                }
                                return '';
                            }
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
    
    // Populate median days comparison statistics
    populateMedianDaysStats(medianDaysData, container, locationData) {
        const stats = medianDaysData.stats;
        const difference = stats.difference;
        
        // Use the same conditional color as the chart (from API)
        const metroColor = medianDaysData.data.datasets[0].borderColor;
        const differenceColor = difference > 0 ? '#ff6b6b' : '#00ff7f'; // Red if slower, green if faster
        
        // Get the median days on market Beta (5Y) value
        const betaValue = locationData ? locationData.median_days_on_market_beta_5y : null;
        
        container.innerHTML = `
            <div class="lightbox-stat">
                <div class="lightbox-stat-label">Metro Median Days</div>
                <div class="lightbox-stat-value" style="color: ${metroColor}">
                    ${Math.round(stats.latest_metro)} days
                </div>
            </div>
            <div class="lightbox-stat">
                <div class="lightbox-stat-label">National Median Days</div>
                <div class="lightbox-stat-value" style="color: #64748B">
                    ${Math.round(stats.latest_national)} days
                </div>
            </div>
            <div class="lightbox-stat">
                <div class="lightbox-stat-label">Difference</div>
                <div class="lightbox-stat-value" style="color: ${differenceColor}">
                    ${difference > 0 ? '+' : ''}${Math.round(difference)} days
                </div>
            </div>
            <div class="lightbox-stat">
                <div class="lightbox-stat-label">Beta (5Y)</div>
                <div class="lightbox-stat-value" style="color: #fff">${betaValue ? this.formatBeta(betaValue) : 'N/A'}</div>
            </div>
        `;
    }
    
    // Populate state median days comparison statistics
    populateStateMedianDaysStats(medianDaysData, container, locationData) {
        const stats = medianDaysData.stats;
        const difference = stats.difference;
        
        // Use the same conditional color as the chart (from API)
        const stateColor = medianDaysData.data.datasets[0].borderColor;
        const differenceColor = difference > 0 ? '#ff6b6b' : '#00ff7f'; // Red if slower, green if faster
        
        // Get the median days on market Beta (5Y) value
        const betaValue = locationData ? locationData.median_days_on_market_beta_5y : null;
        
        container.innerHTML = `
            <div class="lightbox-stat">
                <div class="lightbox-stat-label">State Median Days</div>
                <div class="lightbox-stat-value" style="color: ${stateColor}">
                    ${Math.round(stats.latest_state)} days
                </div>
            </div>
            <div class="lightbox-stat">
                <div class="lightbox-stat-label">National Median Days</div>
                <div class="lightbox-stat-value" style="color: #64748B">
                    ${Math.round(stats.latest_national)} days
                </div>
            </div>
            <div class="lightbox-stat">
                <div class="lightbox-stat-label">Difference</div>
                <div class="lightbox-stat-value" style="color: ${differenceColor}">
                    ${difference > 0 ? '+' : ''}${Math.round(difference)} days
                </div>
            </div>
            <div class="lightbox-stat">
                <div class="lightbox-stat-label">Beta (5Y)</div>
                <div class="lightbox-stat-value" style="color: #fff">${betaValue ? this.formatBeta(betaValue) : 'N/A'}</div>
            </div>
        `;
    }

    renderCountyTrendChart(chartData, metric, countyId) {
        const canvas = document.getElementById('lightboxChart');
        if (!canvas) {
            console.error('Lightbox chart canvas not found');
            return;
        }
        
        // Destroy existing chart if it exists
        if (window.trendChart) {
            window.trendChart.destroy();
            window.trendChart = null;
        }
        
        // Determine color based on metric type
        let color;
        if (metric === 'active_listing_count') {
            color = '#3B82F6';
        } else if (metric === 'new_listing_count') {
            color = '#10B981';
        } else if (metric === 'pending_listing_count') {
            color = '#F59E0B';
        } else {
            color = '#6B7280';
        }
        
        window.trendChart = new Chart(canvas, {
            type: 'line',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: false
                    },
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: '#ffffff',
                        borderWidth: 1,
                        callbacks: {
                            label: function(context) {
                                const value = context.parsed.y;
                                const label = context.dataset.label;
                                
                                // Show clean National Index values instead of confusing internal calculations
                                if (label.includes('Index')) {
                                    const baseline = context.chart.data.datasets[1].data[0]; // First indexed value
                                    const indexValue = ((value / baseline) * 100).toFixed(1);
                                    
                                    // Determine the metric type from the label
                                    let metricType = 'Active';
                                    if (label.includes('Median Price') || label.includes('Price')) {
                                        metricType = 'Median Price';
                                    } else if (label.includes('New')) {
                                        metricType = 'New Listings';
                                    } else if (label.includes('Pending')) {
                                        metricType = 'Pending Sale';
                                    }
                                    
                                    return `National ${metricType} Index: ${indexValue}`;
                                } else {
                                    return `${label}: ${Math.round(value).toLocaleString()}`;
                                }
                            },
                            title: function(context) {
                                return context[0].label;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        display: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#ffffff',
                            maxTicksLimit: 6,
                            callback: function(value, index) {
                                const label = this.getLabelForValue(value);
                                return label.substring(0, 7);
                            }
                        }
                    },
                    y: {
                        display: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#ffffff',
                            callback: function(value) {
                                return Math.round(value).toLocaleString();
                            }
                        }
                    }
                }
            }
        });
    }

    populateCountyTrendStats(data, labels, container, metricLabel) {
        if (!data || data.length === 0) {
            container.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 2rem;">
                    <p style="color: #aaa;">No trend data available</p>
                </div>
            `;
            return;
        }
        
        // Calculate basic statistics
        const latest = data[data.length - 1];
        const earliest = data[0];
        const totalChange = ((latest - earliest) / earliest) * 100;
        const totalChangeColor = totalChange > 0 ? '#00ff7f' : '#ff6b6b';
        
        // Calculate average value
        const average = data.reduce((sum, val) => sum + val, 0) / data.length;
        
        // Find peak and valley
        const maxValue = Math.max(...data);
        const minValue = Math.min(...data);
        const maxIndex = data.indexOf(maxValue);
        const minIndex = data.indexOf(minValue);
        const peakDate = labels[maxIndex];
        const valleyDate = labels[minIndex];
        
        // Calculate 1-year change (last 12 months if available)
        const oneYearAgoIndex = Math.max(0, data.length - 13);
        const oneYearAgo = data[oneYearAgoIndex];
        const oneYearChange = ((latest - oneYearAgo) / oneYearAgo) * 100;
        const oneYearChangeColor = oneYearChange > 0 ? '#00ff7f' : '#ff6b6b';
        
        container.innerHTML = `
            <div class="lightbox-stat">
                <div class="lightbox-stat-label">Current Value</div>
                <div class="lightbox-stat-value" style="color: #fff">
                    ${Math.round(latest).toLocaleString()}
                </div>
            </div>
            <div class="lightbox-stat">
                <div class="lightbox-stat-label">5-Year Change</div>
                <div class="lightbox-stat-value" style="color: ${totalChangeColor}">
                    ${totalChange > 0 ? '+' : ''}${totalChange.toFixed(1)}%
                </div>
            </div>
            <div class="lightbox-stat">
                <div class="lightbox-stat-label">1-Year Change</div>
                <div class="lightbox-stat-value" style="color: ${oneYearChangeColor}">
                    ${oneYearChange > 0 ? '+' : ''}${oneYearChange.toFixed(1)}%
                </div>
            </div>
            <div class="lightbox-stat">
                <div class="lightbox-stat-label">5-Year Average</div>
                <div class="lightbox-stat-value" style="color: #64748B">
                    ${Math.round(average).toLocaleString()}
                </div>
            </div>
            <div class="lightbox-stat">
                <div class="lightbox-stat-label">Peak Value</div>
                <div class="lightbox-stat-value" style="color: #00ff7f">
                    ${Math.round(maxValue).toLocaleString()}
                </div>
                <div class="lightbox-stat-date" style="font-size: 0.8rem; color: #aaa; margin-top: 0.25rem;">
                    ${peakDate}
                </div>
            </div>
            <div class="lightbox-stat">
                <div class="lightbox-stat-label">Valley Value</div>
                <div class="lightbox-stat-value" style="color: #ff6b6b">
                    ${Math.round(minValue).toLocaleString()}
                </div>
                <div class="lightbox-stat-date" style="font-size: 0.8rem; color: #aaa; margin-top: 0.25rem;">
                    ${valleyDate}
                </div>
            </div>
        `;
    }

    renderCountyIndexedPerformanceChart(indexedData, countyName) {
        const canvas = document.getElementById('lightboxChart');
        if (!canvas) {
            console.error('Lightbox chart canvas not found');
            return;
        }
        
        // Destroy existing chart if it exists
        if (window.trendChart) {
            window.trendChart.destroy();
            window.trendChart = null;
        }
        
        // Override the fill settings for better visibility
        const chartData = {...indexedData.data};
        chartData.datasets = chartData.datasets.map(dataset => {
            if (dataset.label.includes('Actual')) {
                // Remove fill completely for actual data
                return {
                    ...dataset,
                    backgroundColor: 'transparent',
                    fill: false // No fill under data points
                };
            }
            return dataset;
        });

        window.trendChart = new Chart(canvas, {
            type: 'line',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                layout: {
                    padding: {
                        top: 10,
                        bottom: 20,
                        left: 10,
                        right: 10
                    }
                },
                plugins: {
                    title: {
                        display: false // Title is handled by HTML
                    },
                    legend: {
                        labels: {
                            color: '#ffffff',
                            usePointStyle: true,
                            padding: 12,
                            font: {
                                size: 10
                            }
                        },
                        position: 'bottom'
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: '#ffffff',
                        borderWidth: 1,
                        displayColors: true,
                        callbacks: {
                            label: function(context) {
                                const value = context.parsed.y;
                                const label = context.dataset.label;
                                
                                // Show clean National Index values instead of confusing internal calculations
                                if (label.includes('Index')) {
                                    const baseline = context.chart.data.datasets[1].data[0]; // First indexed value
                                    const indexValue = ((value / baseline) * 100).toFixed(1);
                                    
                                    // Determine the metric type from the label
                                    let metricType = 'Active';
                                    if (label.includes('Median Price') || label.includes('Price')) {
                                        metricType = 'Median Price';
                                    } else if (label.includes('New')) {
                                        metricType = 'New Listings';
                                    } else if (label.includes('Pending')) {
                                        metricType = 'Pending Sale';
                                    }
                                    
                                    return `National ${metricType} Index: ${indexValue}`;
                                } else {
                                    return `${label}: ${Math.round(value).toLocaleString()}`;
                                }
                            },
                            afterBody: function(tooltipItems) {
                                if (tooltipItems.length === 2) {
                                    const actual = tooltipItems[0].parsed.y;
                                    const indexed = tooltipItems[1].parsed.y;
                                    const performance = ((actual / indexed) - 1) * 100;
                                    const performanceLabel = performance > 0 ? 'Outperforming' : 'Underperforming';
                                    return `${performanceLabel}: ${performance > 0 ? '+' : ''}${performance.toFixed(1)}%`;
                                }
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        display: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#ffffff',
                            maxTicksLimit: 6,
                            callback: function(value, index) {
                                const label = this.getLabelForValue(value);
                                return label.substring(0, 7); // Show YYYY-MM format
                            }
                        }
                    },
                    y: {
                        display: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#ffffff',
                            callback: function(value) {
                                return Math.round(value).toLocaleString();
                            }
                        }
                    }
                }
            }
        });
    }

    async populateCountyIndexedPerformanceStats(indexedData, container, metric, countyData, countyFIPS) {
        const stats = indexedData.performance_stats;
        const latestPerformance = stats.latest_performance_vs_index * 100;
        const performanceColor = latestPerformance > 0 ? '#00ff7f' : '#ff6b6b';
        const performanceLabel = latestPerformance > 0 ? 'Outperforming' : 'Underperforming';
        
        // Calculate total growth - use same calculation as State view
        const totalGrowthActual = ((stats.latest_actual / stats.baseline_value) - 1) * 100;
        const totalGrowthNational = ((stats.latest_indexed / stats.baseline_value) - 1) * 100;
        
        // Determine the label for current value based on metric
        const currentValueLabel = metric === 'median_listing_price' ? 'Current Median Price' : 'Current Count';
        
        // Calculate beta value dynamically for counties
        let betaValue = null;
        let betaDisplay = '<span style="color: #888;">Calculating...</span>';
        
        // Set stats container class for 5 stats layout
        container.className = 'lightbox-stats stats-5';
        
        // Show initial content with calculating message
        container.innerHTML = `
            <div class="lightbox-stat">
                <div class="lightbox-stat-label">Performance vs National</div>
                <div class="lightbox-stat-value" style="color: ${performanceColor}">
                    ${latestPerformance > 0 ? '+' : ''}${latestPerformance.toFixed(1)}%
                </div>
            </div>
            <div class="lightbox-stat">
                <div class="lightbox-stat-label">Actual Growth (5Y)</div>
                <div class="lightbox-stat-value" style="color: ${totalGrowthActual > 0 ? '#00ff7f' : '#ff6b6b'}">
                    ${totalGrowthActual > 0 ? '+' : ''}${totalGrowthActual.toFixed(1)}%
                </div>
            </div>
            <div class="lightbox-stat">
                <div class="lightbox-stat-label">National Growth (5Y)</div>
                <div class="lightbox-stat-value" style="color: ${totalGrowthNational > 0 ? '#00ff7f' : '#ff6b6b'}">
                    ${totalGrowthNational > 0 ? '+' : ''}${totalGrowthNational.toFixed(1)}%
                </div>
            </div>
            <div class="lightbox-stat">
                <div class="lightbox-stat-label">${currentValueLabel}</div>
                <div class="lightbox-stat-value">${metric === 'median_listing_price' ? 
                    '$' + Math.round(stats.latest_actual).toLocaleString() : 
                    Math.round(stats.latest_actual).toLocaleString()}</div>
            </div>
            <div class="lightbox-stat" id="county-beta-stat">
                <div class="lightbox-stat-label">Beta (5Y)</div>
                <div class="lightbox-stat-value">${betaDisplay}</div>
            </div>
        `;
        
        // Calculate beta asynchronously and update the display
        if (countyFIPS) {
            try {
                betaValue = await this.calculateCountyBeta(countyFIPS, metric);
                const betaStat = document.getElementById('county-beta-stat');
                if (betaStat) {
                    const valueElement = betaStat.querySelector('.lightbox-stat-value');
                    if (valueElement) {
                        valueElement.innerHTML = betaValue ? 
                            `<span style="color: #fff">${this.formatBeta(betaValue)}</span>` : 
                            '<span style="color: #888;">N/A</span>';
                    }
                }
            } catch (error) {
                console.warn('Failed to calculate county beta:', error);
                const betaStat = document.getElementById('county-beta-stat');
                if (betaStat) {
                    const valueElement = betaStat.querySelector('.lightbox-stat-value');
                    if (valueElement) {
                        valueElement.innerHTML = '<span style="color: #888;">N/A</span>';
                    }
                }
            }
        }
    }

    // Calculate beta coefficient for a county metric against national index
    async calculateCountyBeta(countyFIPS, metric) {
        try {
            let countyData = null;
            
            if (metric === 'median_days_on_market') {
                // For median days, use specific median days endpoint
                const countyResponse = await fetch(`${this.API_BASE_URL}/county/${countyFIPS}/median-days-trends`);
                if (!countyResponse.ok) return null;
                
                const countyTrends = await countyResponse.json();
                countyData = countyTrends.data?.datasets?.[0]?.data;
            } else {
                // For other metrics, use general trends endpoint
                const countyResponse = await fetch(`${this.API_BASE_URL}/county/${countyFIPS}/trends`);
                if (!countyResponse.ok) return null;
                
                const countyTrends = await countyResponse.json();
                countyData = countyTrends.data?.datasets?.[0]?.data;
            }
            
            let nationalData = null;
            
            if (metric === 'median_listing_price') {
                // For median price, fetch national data from database directly
                const nationalPriceResponse = await fetch(`${this.API_BASE_URL}/trends/national-median-price`);
                if (nationalPriceResponse.ok) {
                    const nationalPriceData = await nationalPriceResponse.json();
                    nationalData = nationalPriceData.data;
                }
            } else if (metric === 'median_days_on_market') {
                // For median days, fetch national data from database directly
                const nationalDaysResponse = await fetch(`${this.API_BASE_URL}/trends/national-median-days`);
                if (nationalDaysResponse.ok) {
                    const nationalDaysData = await nationalDaysResponse.json();
                    nationalData = nationalDaysData.data;
                }
            } else {
                // For other metrics, use the existing national trends endpoint
                const nationalResponse = await fetch(`${this.API_BASE_URL}/trends/national/national`);
                if (!nationalResponse.ok) return null;
                
                const nationalTrends = await nationalResponse.json();
                
                // Map metric names to dataset indices
                const metricMap = {
                    'active_listing_count': 0,
                    'new_listing_count': 1, 
                    'pending_listing_count': 2
                };
                const datasetIndex = metricMap[metric];
                nationalData = nationalTrends.data?.datasets?.[datasetIndex]?.data;
            }
            
            if (!countyData || !nationalData || countyData.length < 24) {
                return null; // Need at least 2 years of data
            }
            
            // Calculate beta using linear regression
            return this.calculateBetaCoefficient(countyData, nationalData);
            
        } catch (error) {
            console.warn('Failed to calculate county beta:', error);
            return null;
        }
    }
    
    // Calculate beta coefficient using linear regression
    calculateBetaCoefficient(assetReturns, marketReturns) {
        if (!assetReturns || !marketReturns || assetReturns.length !== marketReturns.length) {
            return null;
        }
        
        // Calculate percentage changes (returns)
        const assetChanges = [];
        const marketChanges = [];
        
        for (let i = 1; i < assetReturns.length; i++) {
            if (assetReturns[i] && assetReturns[i-1] && assetReturns[i-1] !== 0) {
                assetChanges.push((assetReturns[i] - assetReturns[i-1]) / assetReturns[i-1]);
            }
            if (marketReturns[i] && marketReturns[i-1] && marketReturns[i-1] !== 0) {
                marketChanges.push((marketReturns[i] - marketReturns[i-1]) / marketReturns[i-1]);
            }
        }
        
        if (assetChanges.length < 12) return null; // Need at least 1 year of returns
        
        // Calculate means
        const assetMean = assetChanges.reduce((sum, val) => sum + val, 0) / assetChanges.length;
        const marketMean = marketChanges.reduce((sum, val) => sum + val, 0) / marketChanges.length;
        
        // Calculate covariance and variance
        let covariance = 0;
        let marketVariance = 0;
        
        for (let i = 0; i < Math.min(assetChanges.length, marketChanges.length); i++) {
            const assetDev = assetChanges[i] - assetMean;
            const marketDev = marketChanges[i] - marketMean;
            
            covariance += assetDev * marketDev;
            marketVariance += marketDev * marketDev;
        }
        
        if (marketVariance === 0) return null;
        
        // Beta = Covariance(asset, market) / Variance(market)
        return covariance / marketVariance;
    }

    // Show county median days trend with beta calculation
    async showCountyMedianDaysTrend(countyFIPS, countyName, container) {
        try {
            // Get county median days trend data
            const countyResponse = await fetch(`${this.API_BASE_URL}/county/${countyFIPS}/median-days-trends`);
            if (!countyResponse.ok) {
                throw new Error(`County median days trends not found (HTTP ${countyResponse.status})`);
            }
            
            const countyTrends = await countyResponse.json();
            
            // Validate the data structure
            if (!countyTrends || !countyTrends.data || !countyTrends.data.datasets || !countyTrends.data.datasets[0]) {
                throw new Error('Invalid county trend data structure');
            }
            
            // Get national median days data
            const nationalChartResponse = await fetch(`${this.API_BASE_URL}/trends/national-median-days`);
            if (!nationalChartResponse.ok) {
                throw new Error('Failed to load national median days data');
            }
            
            const nationalChartData = await nationalChartResponse.json();
            
            // Create comparison chart data structure with county-specific data
            const comparisonData = {
                data: {
                    labels: countyTrends.data.labels,
                    datasets: [
                        {
                            label: `${countyName} County`,
                            data: countyTrends.data.datasets[0].data,
                            borderColor: '#ff6347',
                            backgroundColor: '#ff634720',
                            borderWidth: 2,
                            tension: 0.4,
                            pointBackgroundColor: '#ff6347',
                            pointBorderColor: '#ffffff',
                            pointBorderWidth: 1,
                            pointRadius: 3,
                            pointHoverRadius: 5
                        },
                        {
                            label: 'National Median Days',
                            data: nationalChartData.data,
                            borderColor: '#64748B',
                            backgroundColor: '#64748B20',
                            borderWidth: 2,
                            tension: 0.4,
                            pointBackgroundColor: '#64748B',
                            pointBorderColor: '#ffffff',
                            pointBorderWidth: 1,
                            pointRadius: 3,
                            pointHoverRadius: 5
                        }
                    ]
                }
            };
            
            // Render comparison chart
            setTimeout(() => {
                this.renderMedianDaysComparisonChart(comparisonData, countyName);
            }, 100);
            
            // Set stats container class for 4 stats layout
            container.className = 'lightbox-stats stats-4';
            
            // Show initial stats with calculating beta message
            container.innerHTML = `
                <div class="lightbox-stat">
                    <div class="lightbox-stat-label">Current Days</div>
                    <div class="lightbox-stat-value">${this.currentCountyData?.median_days_on_market || 'N/A'} days</div>
                </div>
                <div class="lightbox-stat">
                    <div class="lightbox-stat-label">National Average</div>
                    <div class="lightbox-stat-value" style="color: #64748B">Calculating...</div>
                </div>
                <div class="lightbox-stat">
                    <div class="lightbox-stat-label">Difference</div>
                    <div class="lightbox-stat-value">Calculating...</div>
                </div>
                <div class="lightbox-stat" id="county-median-days-beta">
                    <div class="lightbox-stat-label">Beta (5Y)</div>
                    <div class="lightbox-stat-value" style="color: #888;">Calculating...</div>
                </div>
            `;
            
            // Calculate beta and national comparison asynchronously
            const betaValue = await this.calculateCountyBeta(countyFIPS, 'median_days_on_market');
            
            // Get latest national median days for comparison
            const nationalStatsResponse = await fetch(`${this.API_BASE_URL}/trends/national-median-days`);
            let nationalAvg = null;
            let difference = null;
            
            if (nationalStatsResponse.ok) {
                const nationalStatsData = await nationalStatsResponse.json();
                const latestNational = nationalStatsData.data[nationalStatsData.data.length - 1];
                const currentCounty = this.currentCountyData?.median_days_on_market;
                
                if (latestNational && currentCounty) {
                    nationalAvg = Math.round(latestNational);
                    difference = Math.round(currentCounty - latestNational);
                }
            }
            
            // Update the display with calculated values (keep stats-4 class)
            container.className = 'lightbox-stats stats-4';
            container.innerHTML = `
                <div class="lightbox-stat">
                    <div class="lightbox-stat-label">Current Days</div>
                    <div class="lightbox-stat-value" style="color: #ff6347;">${this.currentCountyData?.median_days_on_market || 'N/A'} days</div>
                </div>
                <div class="lightbox-stat">
                    <div class="lightbox-stat-label">National Average</div>
                    <div class="lightbox-stat-value" style="color: #64748B">${nationalAvg ? nationalAvg + ' days' : 'N/A'}</div>
                </div>
                <div class="lightbox-stat">
                    <div class="lightbox-stat-label">Difference</div>
                    <div class="lightbox-stat-value" style="color: ${difference && difference > 0 ? '#ff6b6b' : '#00ff7f'}">
                        ${difference !== null ? (difference > 0 ? '+' : '') + difference + ' days' : 'N/A'}
                    </div>
                </div>
                <div class="lightbox-stat">
                    <div class="lightbox-stat-label">Beta (5Y)</div>
                    <div class="lightbox-stat-value" style="color: #fff">${betaValue ? this.formatBeta(betaValue) : 'N/A'}</div>
                </div>
            `;
            
        } catch (error) {
            console.error(`Failed to show county median days trend for ${countyName} (${countyFIPS}):`, error);
            
            // Show specific error message to help debug
            container.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 2rem;">
                    <h3 style="color: #fff; margin-bottom: 1rem;">County Data Unavailable</h3>
                    <p style="color: #aaa; margin-bottom: 1rem;">Unable to load median days trend data for ${countyName} County.</p>
                    <p style="color: #666; font-size: 0.9rem;">County FIPS: ${countyFIPS}</p>
                    <p style="color: #666; font-size: 0.9rem;">Error: ${error.message}</p>
                </div>
            `;
        }
    }

    /**
     * Calculate National Index for time series data
     * Creates a cumulative index starting at 100.0 from the first period
     * 
     * @param {Array} timeSeriesData - Array of objects with period and value
     * @param {string} valueField - Field name containing the numeric values
     * @param {string} periodField - Field name containing the time period (e.g., 'month_date')
     * @returns {Array} Array of objects with original data plus index_value
     */
    calculateNationalIndex(timeSeriesData, valueField = 'value', periodField = 'period') {
        if (!timeSeriesData || timeSeriesData.length === 0) {
            console.warn('calculateNationalIndex: No data provided');
            return [];
        }

        // Sort data by period to ensure chronological order
        const sortedData = [...timeSeriesData].sort((a, b) => {
            return parseInt(a[periodField]) - parseInt(b[periodField]);
        });

        // Get baseline value from first period
        const baselineValue = sortedData[0][valueField];
        if (!baselineValue || baselineValue <= 0) {
            console.warn('calculateNationalIndex: Invalid baseline value:', baselineValue);
            return sortedData.map(item => ({ ...item, index_value: null }));
        }

        let previousIndexValue = 100.0; // Start at 100.0 for baseline
        
        return sortedData.map((item, index) => {
            const currentValue = item[valueField];
            
            if (index === 0) {
                // First period is always 100.0
                return {
                    ...item,
                    index_value: 100.0,
                    baseline_value: baselineValue,
                    is_baseline: true
                };
            } else {
                // Calculate period-over-period change
                const previousValue = sortedData[index - 1][valueField];
                
                if (!currentValue || !previousValue || previousValue <= 0) {
                    return { 
                        ...item, 
                        index_value: null,
                        baseline_value: baselineValue,
                        is_baseline: false
                    };
                }
                
                // Apply the change to previous index value
                const periodChange = (currentValue / previousValue) - 1;
                const currentIndexValue = previousIndexValue * (1 + periodChange);
                
                previousIndexValue = currentIndexValue;
                
                return {
                    ...item,
                    index_value: Math.round(currentIndexValue * 10) / 10, // Round to 1 decimal
                    baseline_value: baselineValue,
                    is_baseline: false,
                    period_change_pct: Math.round(periodChange * 1000) / 10 // Round to 1 decimal
                };
            }
        });
    }

    /**
     * Format index value for display
     * @param {number} indexValue - The index value to format
     * @param {boolean} includeBaseline - Whether to include " (Baseline)" for 100.0
     * @returns {string} Formatted string
     */
    formatIndexValue(indexValue, includeBaseline = false) {
        if (indexValue === null || indexValue === undefined) {
            return 'N/A';
        }
        
        const formatted = indexValue.toFixed(1);
        if (indexValue === 100.0 && includeBaseline) {
            return `${formatted} (Baseline)`;
        }
        return formatted;
    }

    /**
     * Get national index data for Active Listings
     * This will be expanded to work with API data in the future
     * @returns {Promise<Array>} Array of indexed national data
     */
    async getNationalIndexData(metric = 'active_listing_count') {
        try {
            // For now, return sample data structure
            // In the future, this will fetch from API: /api/national-index/${metric}
            const sampleData = [
                { month_date: 202007, active_listing_count: 822849 },
                { month_date: 202008, active_listing_count: 779567 },
                { month_date: 202009, active_listing_count: 749403 },
                // More data would come from API call
            ];
            
            return this.calculateNationalIndex(sampleData, metric, 'month_date');
        } catch (error) {
            console.error('Failed to get national index data:', error);
            return [];
        }
    }

    /**
     * Test the national index calculation with sample data
     * This will verify our logic works correctly
     */
    testNationalIndex() {
        console.log('=== Testing National Index Calculation ===');
        
        const sampleData = [
            { month_date: 202007, active_listing_count: 822849 },
            { month_date: 202008, active_listing_count: 779567 },
            { month_date: 202009, active_listing_count: 749403 },
            { month_date: 202010, active_listing_count: 720000 } // Example fourth period
        ];
        
        const indexedData = this.calculateNationalIndex(sampleData, 'active_listing_count', 'month_date');
        
        console.log('Original Data vs Indexed Values:');
        indexedData.forEach((item, i) => {
            const periodChange = item.period_change_pct ? `(${item.period_change_pct > 0 ? '+' : ''}${item.period_change_pct}%)` : '';
            console.log(`${item.month_date}: ${item.active_listing_count.toLocaleString()} → Index: ${this.formatIndexValue(item.index_value)} ${periodChange}`);
        });
        
        // Manual verification of calculations
        console.log('\nManual Verification:');
        console.log('Period 1 (202007): 822,849 → 100.0 (baseline)');
        console.log('Period 2 (202008): 779,567 → 94.7 (779567/822849*100)');
        console.log('Period 3 (202009): 749,403 → 91.0 (94.7 * (749403/779567))');
        console.log('Period 4 (202010): 720,000 → 87.1 (91.0 * (720000/749403))');
        
        return indexedData;
    }
    
    // Mobile-specific methods
    showMobileSidebar() {
        const sidebar = document.querySelector('.detail-panel');
        if (sidebar && window.innerWidth <= 768) {
            sidebar.classList.add('active');
            
            // Add mobile close button if not exists
            this.addMobileCloseButton(sidebar);
            
            // Add swipe/touch handlers for dismissing
            this.addMobileSidebarHandlers(sidebar);
        }
    }
    
    // Add touch handlers to collapsed sidebar for upward swipe detection
    addCollapsedSidebarHandlers() {
        const sidebar = document.querySelector('.detail-panel');
        if (!sidebar || window.innerWidth > 768) return;
        
        let startY = 0;
        let currentY = 0;
        let isDragging = false;
        
        const handleTouchStart = (e) => {
            // Only handle touches on the visible header area when collapsed
            if (!sidebar.classList.contains('active')) {
                startY = e.touches[0].clientY;
                isDragging = true;
            }
        };
        
        const handleTouchMove = (e) => {
            if (!isDragging || sidebar.classList.contains('active')) return;
            currentY = e.touches[0].clientY;
            const deltaY = currentY - startY;
            
            // Detect upward swipe (negative deltaY)
            if (deltaY < -20) {
                // Show preview of expansion
                const progress = Math.min(Math.abs(deltaY) / 100, 1);
                sidebar.style.transform = `translateY(${-80 - (progress * 100)}px)`;
            }
        };
        
        const handleTouchEnd = (e) => {
            if (!isDragging || sidebar.classList.contains('active')) return;
            isDragging = false;
            
            const deltaY = currentY - startY;
            if (deltaY < -50) {
                // Upward swipe threshold reached - show sidebar
                sidebar.style.transform = '';
                this.showMobileSidebar();
            } else {
                // Snap back to collapsed position
                sidebar.style.transform = 'translateY(-80px)';
            }
        };
        
        // Store handlers for cleanup
        this.collapsedHandlers = {
            touchStart: handleTouchStart,
            touchMove: handleTouchMove,
            touchEnd: handleTouchEnd
        };
        
        // Add event listeners
        sidebar.addEventListener('touchstart', handleTouchStart, { passive: true });
        sidebar.addEventListener('touchmove', handleTouchMove, { passive: true });
        sidebar.addEventListener('touchend', handleTouchEnd, { passive: true });
    }
    
    hideMobileSidebar() {
        const sidebar = document.querySelector('.detail-panel');
        if (sidebar) {
            sidebar.classList.remove('active');
            
            // Re-add collapsed handlers for upward swipe detection
            if (window.innerWidth <= 768) {
                setTimeout(() => {
                    this.removeCollapsedSidebarHandlers();
                    this.addCollapsedSidebarHandlers();
                }, 300); // Wait for transition to complete
            }
        }
    }
    
    addMobileCloseButton(sidebar) {
        // Check if close button already exists
        let closeButton = sidebar.querySelector('.mobile-close');
        if (!closeButton) {
            closeButton = document.createElement('button');
            closeButton.className = 'mobile-close';
            closeButton.innerHTML = '×';
            closeButton.onclick = () => {
                this.hideMobileSidebar();
                this.restoreDefaultSidebar();
            };
            sidebar.appendChild(closeButton);
        }
    }
    
    addMobileSidebarHandlers(sidebar) {
        // Remove existing handlers to avoid duplicates
        this.removeMobileSidebarHandlers();
        
        // Touch/swipe to dismiss
        let startY = 0;
        let currentY = 0;
        let isDragging = false;
        
        const handleTouchStart = (e) => {
            startY = e.touches[0].clientY;
            isDragging = true;
        };
        
        const handleTouchMove = (e) => {
            if (!isDragging) return;
            currentY = e.touches[0].clientY;
            const deltaY = currentY - startY;
            
            // Only allow downward swipe to close
            if (deltaY > 0) {
                const progress = Math.min(deltaY / 100, 1);
                sidebar.style.transform = `translateY(${deltaY}px)`;
                sidebar.style.opacity = 1 - (progress * 0.3);
            }
        };
        
        const handleTouchEnd = (e) => {
            if (!isDragging) return;
            isDragging = false;
            
            const deltaY = currentY - startY;
            if (deltaY > 100) {
                // Swipe down threshold reached - close sidebar
                this.hideMobileSidebar();
                this.restoreDefaultSidebar();
            } else {
                // Snap back to open position
                sidebar.style.transform = '';
                sidebar.style.opacity = '';
            }
        };
        
        // Tap outside to close
        const handleMapClick = (e) => {
            if (window.innerWidth <= 768) {
                this.hideMobileSidebar();
                this.restoreDefaultSidebar();
            }
        };
        
        // Store handlers for cleanup
        this.mobileHandlers = {
            touchStart: handleTouchStart,
            touchMove: handleTouchMove,
            touchEnd: handleTouchEnd,
            mapClick: handleMapClick
        };
        
        // Add event listeners
        sidebar.addEventListener('touchstart', handleTouchStart, { passive: true });
        sidebar.addEventListener('touchmove', handleTouchMove, { passive: true });
        sidebar.addEventListener('touchend', handleTouchEnd, { passive: true });
        this.map.on('click', handleMapClick);
    }
    
    removeMobileSidebarHandlers() {
        if (this.mobileHandlers) {
            const sidebar = document.querySelector('.detail-panel');
            if (sidebar) {
                sidebar.removeEventListener('touchstart', this.mobileHandlers.touchStart);
                sidebar.removeEventListener('touchmove', this.mobileHandlers.touchMove);
                sidebar.removeEventListener('touchend', this.mobileHandlers.touchEnd);
            }
            if (this.map) {
                this.map.off('click', this.mobileHandlers.mapClick);
            }
            this.mobileHandlers = null;
        }
    }
    
    removeCollapsedSidebarHandlers() {
        if (this.collapsedHandlers) {
            const sidebar = document.querySelector('.detail-panel');
            if (sidebar) {
                sidebar.removeEventListener('touchstart', this.collapsedHandlers.touchStart);
                sidebar.removeEventListener('touchmove', this.collapsedHandlers.touchMove);
                sidebar.removeEventListener('touchend', this.collapsedHandlers.touchEnd);
            }
            this.collapsedHandlers = null;
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    const dashboard = new RealEstateDashboard();
    
    // Bind methods to ensure 'this' context is preserved
    dashboard.showTrendLightbox = dashboard.showTrendLightbox.bind(dashboard);
    
    window.dashboard = dashboard;
    
    // Debug logging
    console.log('Dashboard initialized:', {
        dashboard: dashboard,
        dataProcessor: dashboard.dataProcessor,
        hasShowTrendLightbox: typeof dashboard.showTrendLightbox === 'function'
    });
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
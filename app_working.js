// Real Estate Beta Dashboard Application - Clean Working Version
class RealEstateDashboard {
    constructor() {
        this.map = null;
        this.currentLayer = null;
        this.dataProcessor = null;
        this.stateData = {};
        this.metroData = {};
        this.isDataLoaded = false;
        this.currentView = 'state'; // 'state' or 'metro'
        this.trendsChart = null;
        this.API_BASE_URL = 'http://localhost:5001/api';
        this.init();
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
        this.createBasicStateLayer();
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
        this.map.setMaxZoom(8);
        
        // Add dark theme tile layer
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '© OpenStreetMap contributors, © CARTO',
            maxZoom: 8,
            subdomains: 'abcd'
        }).addTo(this.map);
        
        // Add zoom event listener to update circle sizes
        this.map.on('zoomend', () => {
            if (this.currentLayer) {
                this.updateCircleSizes();
            }
        });
        
        this.map.getContainer().style.background = '#000000';
        
        // Disable map interactions that might interfere with circle clicks
        this.map.on('click', (e) => {
            // Prevent map click from interfering with circle clicks
            e.originalEvent.stopPropagation();
        });
    }
    
    setupViewSelector() {
        const viewSelector = document.getElementById('viewSelector');
        const dataInfo = document.getElementById('dataInfo');
        
        if (!viewSelector || !dataInfo) return;
        
        viewSelector.addEventListener('change', async (e) => {
            this.currentView = e.target.value;
            await this.switchView();
            
            // Update header text and legend
            if (this.currentView === 'metro') {
                dataInfo.textContent = 'Large circles: Major markets • Medium circles: Regional markets • Small circles: Local markets';
                this.updateLegendForMetroView();
            } else {
                dataInfo.textContent = 'Hover over states for market summary • Click for detailed analysis';
                this.updateLegendForStateView();
            }
        });
    }
    
    async switchView() {
        // Clear existing layer
        if (this.currentLayer) {
            this.map.removeLayer(this.currentLayer);
            this.currentLayer = null;
        }
        
        // Create appropriate layer based on current view
        if (this.currentView === 'metro') {
            await this.createMetroLayer();
        } else {
            this.createBasicStateLayer();
        }
    }
    
    createBasicStateLayer() {
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
            
            const beta5y = stateData.active_listing_count_beta_5y || 1;
            const color = this.getBetaColor(beta5y);
            const listingCount = stateData.active_listing_count || 1000;
            
            // Calculate zoom-adjusted radius
            const radius = this.calculateCircleRadius(listingCount);
            
            const circle = L.circle(coords, {
                color: '#ffffff',
                fillColor: color,
                fillOpacity: 0.8,
                radius: radius,
                weight: 3,  // Thicker border for better visibility
                interactive: true,
                bubblingMouseEvents: false  // Prevent event conflicts
            });
            
            // Store data for zoom updates
            circle._stateData = {
                stateName,
                stateData,
                listingCount,
                color
            };
            
            circle.on({
                mouseover: (e) => {
                    e.originalEvent.stopPropagation();
                    circle.setStyle({ fillOpacity: 1.0, weight: 5 }); // More dramatic highlight
                    this.showPopup(e.latlng, stateName, stateData);
                },
                mouseout: (e) => {
                    e.originalEvent.stopPropagation();
                    circle.setStyle({ fillOpacity: 0.8, weight: 3 }); // Reset to default
                    this.map.closePopup();
                },
                click: (e) => {
                    e.originalEvent.stopPropagation();
                    console.log(`Circle clicked: ${stateName}`);
                    this.showDetailPanel(stateName, stateData);
                    this.loadTrendChart('state', stateName);
                }
            });
            
            circles.push(circle);
        });
        
        this.currentLayer = L.layerGroup(circles).addTo(this.map);
    }
    
    async createMetroLayer() {
        if (Object.keys(this.metroData).length === 0) {
            console.warn('No metro data available');
            return;
        }
        
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
                    this.showDetailPanel(csvMetroName, metroData);
                    // For metros, we need to get the CBSA code from the metro data
                    const cbsaCode = metroData.cbsa_code || csvMetroName;
                    this.loadTrendChart('metro', cbsaCode);
                }
            });
            
            markers.push(marker);
        });
        
        this.currentLayer = L.layerGroup(markers).addTo(this.map);
    }
    
    async loadMetroCoordinatesFromDB() {
        console.log('🔄 Attempting to load metro coordinates from API...');
        try {
            // Try to load from SQLite database via API
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

    updateLegendForStateView() {
        const legend = document.querySelector('.legend');
        if (!legend) return;

        legend.innerHTML = `
            <h4>Beta Scale</h4>
            <div class="legend-scale">
                <div class="legend-item">
                    <div class="legend-color" style="background-color: #00bfff;"></div>
                    <span>&lt; 0.5 (Low Beta)</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color" style="background-color: #40e0d0;"></div>
                    <span>0.5 - 0.8</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color" style="background-color: #ffd700;"></div>
                    <span>0.8 - 1.2 (Market Beta)</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color" style="background-color: #ff6347;"></div>
                    <span>1.2 - 1.5</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color" style="background-color: #ff1493;"></div>
                    <span>&gt; 1.5 (High Beta)</span>
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
            
            <div class="beta-summary">
                <h4 style="color: #ffffff; margin-bottom: 0.75rem; text-align: center;">Active Listings Beta Timeline</h4>
                <div class="beta-timeline">
                    <div class="beta-item">
                        <div class="period">1 Year</div>
                        <div class="value">${this.formatBeta(locationData.active_listing_count_beta_1y)}</div>
                    </div>
                    <div class="beta-item">
                        <div class="period">3 Year</div>
                        <div class="value">${this.formatBeta(locationData.active_listing_count_beta_3y)}</div>
                    </div>
                    <div class="beta-item">
                        <div class="period">5 Year</div>
                        <div class="value">${this.formatBeta(locationData.active_listing_count_beta_5y)}</div>
                    </div>
                </div>
                <div style="text-align: center; margin-top: 0.75rem; font-size: 0.7rem; color: #999;">
                    ${this.getBetaInterpretation(locationData.active_listing_count_beta_5y)}
                </div>
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
        
        // Show trends section for both states and metros
        const trendsSection = document.getElementById('trendsSection');
        if (trendsSection) {
            trendsSection.style.display = 'block';
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
    
    async loadTrendChart(level, identifier) {
        console.log('Loading trend chart for:', level, identifier);
        
        const trendsSection = document.getElementById('trendsSection');
        const trendLocation = document.getElementById('trendLocation');
        
        if (!trendsSection) {
            console.error('Trends section not found');
            return;
        }
        
        // Show trends section
        trendsSection.style.display = 'block';
        
        // Update location display
        if (trendLocation) {
            trendLocation.textContent = `${level === 'state' ? 'State: ' : 'Metro: '}${identifier}`;
        }
        
        // Show loading state
        this.showTrendLoading();
        
        try {
            let trendData;
            
            // Use SQLite API for both state and metro data - v2
            let apiIdentifier = identifier;
            let displayName = identifier; // Keep original name for display
            
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
            
            const response = await fetch(`${this.API_BASE_URL}/trends/${level}/${encodeURIComponent(apiIdentifier)}`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            trendData = await response.json();
            
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
            console.error('Error loading trend data:', error);
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
        
        // Destroy existing chart if it exists
        if (this.trendsChart) {
            this.trendsChart.destroy();
        }
        
        // Reset chart container and create new canvas
        const chartContainer = document.querySelector('.trend-chart-container');
        if (!chartContainer) {
            console.error('Chart container not found');
            return;
        }
        
        chartContainer.innerHTML = '<canvas id="trendsChart"></canvas>';
        
        // Get fresh canvas reference
        const canvas = document.getElementById('trendsChart');
        if (!canvas) {
            console.error('Canvas element not created');
            return;
        }
        
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
                            padding: 20
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
                            color: '#ffffff'
                        },
                        ticks: {
                            color: '#cccccc',
                            maxTicksLimit: 12
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
                            color: '#ffffff'
                        },
                        ticks: {
                            color: '#cccccc',
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
    }
    
    
    // Show the trend lightbox for a specific metric
    showTrendLightbox(locationName, metric) {
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
        title.textContent = `${metricLabels[metric]} - 5 Year Trend`;
        subtitle.textContent = `${locationLabel} • ${this.formatDate(data.last_updated)}`;
        
        // Get real historical data from CSV
        const trendData = isMetro 
            ? this.dataProcessor.getMetroHistoricalData(locationName, metric, 60)
            : this.dataProcessor.getStateHistoricalData(locationName, metric, 60);
        
        // Show overlay
        overlay.classList.add('active');
        
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
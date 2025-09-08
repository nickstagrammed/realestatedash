/**
 * Complete Static Data Loader - Replaces ALL API calls with static JSON file loading
 * Handles all endpoints for 100% standalone deployment
 */

class CompleteStaticDataLoader {
    constructor() {
        this.cache = new Map();
        this.loadingPromises = new Map();
        this.dataPath = './data/';
    }

    /**
     * Load JSON data with caching and error handling
     */
    async loadData(filename) {
        if (this.cache.has(filename)) {
            return this.cache.get(filename);
        }

        if (this.loadingPromises.has(filename)) {
            return this.loadingPromises.get(filename);
        }

        const loadPromise = this._fetchData(filename);
        this.loadingPromises.set(filename, loadPromise);

        try {
            const data = await loadPromise;
            this.cache.set(filename, data);
            return data;
        } catch (error) {
            console.error(`Failed to load ${filename}:`, error);
            throw error;
        } finally {
            this.loadingPromises.delete(filename);
        }
    }

    async _fetchData(filename) {
        const response = await fetch(`${this.dataPath}${filename}`);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return await response.json();
    }

    // Core Data Methods

    async getStates() {
        return await this.loadData('states.json');
    }

    async getMetros() {
        return await this.loadData('metros.json');
    }

    async getNationalTimeseries() {
        return await this.loadData('national_timeseries.json');
    }

    // Timeseries Data Methods
    
    async getStateTimeseries(stateId = null) {
        const data = await this.loadData('state_timeseries.json');
        return stateId ? data.filter(row => row.state_id === stateId) : data;
    }

    async getMetroTimeseries(cbsaCode = null) {
        const data = await this.loadData('metro_timeseries.json');
        return cbsaCode ? data.filter(row => row.cbsa_code === parseInt(cbsaCode)) : data;
    }

    async getCountyTimeseries(countyFips = null) {
        const data = await this.loadData('county_timeseries_full.json');
        return countyFips ? data.filter(row => row.county_fips === countyFips) : data;
    }

    // Indexed Performance Methods

    async getStateIndexedPerformance(metric, stateId) {
        const data = await this.loadData(`state_indexed_${metric}.json`);
        return data.filter(row => row.state_id === stateId);
    }

    async getMetroIndexedPerformance(metric, cbsaCode) {
        const data = await this.loadData(`metro_indexed_${metric}.json`);
        return data.filter(row => row.cbsa_code === parseInt(cbsaCode));
    }

    async getCountyIndexedPerformance(metric, countyFips) {
        const data = await this.loadData(`county_indexed_${metric}.json`);
        return data.filter(row => row.county_fips === countyFips);
    }

    // Beta/Volatility Data

    async getMetroBetas() {
        return await this.loadData('metro_betas.json');
    }

    async getMetroBeta(cbsaCode) {
        const betas = await this.getMetroBetas();
        return betas.find(beta => beta.cbsa_code === parseInt(cbsaCode));
    }

    // Lookup Tables

    async getCountyLookup() {
        return await this.loadData('county_lookup.json');
    }

    async getStateLookup() {
        return await this.loadData('state_lookup.json');
    }

    async getMetroLookup() {
        return await this.loadData('metro_lookup.json');
    }

    // API Endpoint Simulation Methods

    /**
     * Simulate /api/county/{fips} endpoint
     * Returns latest county data with calculated MoM and YoY changes
     */
    async getCountyData(countyFips) {
        const data = await this.getCountyTimeseries(countyFips);
        if (!data || data.length === 0) {
            throw new Error(`No data found for county ${countyFips}`);
        }
        
        // Sort by date and get latest record
        const sortedData = data.sort((a, b) => b.month_date - a.month_date);
        const latest = sortedData[0];
        
        // Calculate MoM and YoY changes
        const oneMonthAgo = sortedData.find(record => 
            record.month_date === this.subtractMonths(latest.month_date, 1)
        );
        const oneYearAgo = sortedData.find(record => 
            record.month_date === this.subtractMonths(latest.month_date, 12)
        );
        
        // Add calculated percentage changes
        const metrics = ['active_listing_count', 'median_listing_price', 'new_listing_count', 'pending_listing_count', 'median_days_on_market'];
        
        metrics.forEach(metric => {
            // Month-over-month
            if (oneMonthAgo && oneMonthAgo[metric] && latest[metric]) {
                latest[`${metric}_mm`] = ((latest[metric] - oneMonthAgo[metric]) / oneMonthAgo[metric]) * 100;
            } else {
                latest[`${metric}_mm`] = null;
            }
            
            // Year-over-year
            if (oneYearAgo && oneYearAgo[metric] && latest[metric]) {
                latest[`${metric}_yy`] = ((latest[metric] - oneYearAgo[metric]) / oneYearAgo[metric]) * 100;
            } else {
                latest[`${metric}_yy`] = null;
            }
        });
        
        return latest;
    }
    
    /**
     * Helper to subtract months from YYYYMM format
     */
    subtractMonths(yyyymm, months) {
        const year = Math.floor(yyyymm / 100);
        const month = yyyymm % 100;
        
        let newYear = year;
        let newMonth = month - months;
        
        while (newMonth <= 0) {
            newMonth += 12;
            newYear -= 1;
        }
        while (newMonth > 12) {
            newMonth -= 12;
            newYear += 1;
        }
        
        return newYear * 100 + newMonth;
    }

    /**
     * Simulate /api/state/{stateId} endpoint  
     */
    async getStateData(stateId) {
        const data = await this.getStateTimeseries(stateId);
        if (!data || data.length === 0) {
            throw new Error(`No data found for state ${stateId}`);
        }
        return data;
    }

    /**
     * Simulate /api/metros endpoint - returns coordinate format
     */
    async getMetroCoordinates() {
        const metros = await this.getMetros();
        const coordinates = {};
        metros.forEach(metro => {
            coordinates[metro.metro_name] = [metro.latitude, metro.longitude];
        });
        return coordinates;
    }

    /**
     * Simulate /api/counties/{stateName} endpoint
     */
    async getCountiesByState(stateName) {
        const allCounties = await this.getCountyTimeseries();
        const lookup = await this.getCountyLookup();
        
        // Filter counties by state (approximate matching)
        const stateCounties = allCounties.filter(county => {
            const countyName = lookup[county.county_fips];
            return countyName && countyName.toLowerCase().includes(stateName.toLowerCase());
        });
        
        // Group by county for summary
        const countyMap = {};
        stateCounties.forEach(record => {
            if (!countyMap[record.county_fips]) {
                countyMap[record.county_fips] = {
                    county_fips: record.county_fips,
                    county_name: record.county_name,
                    records: []
                };
            }
            countyMap[record.county_fips].records.push(record);
        });
        
        return Object.values(countyMap);
    }

    /**
     * Simulate /api/median-days/metro/{cbsaCode} endpoint
     */
    async getMetroMedianDays(cbsaCode) {
        const metroData = await this.getMetroTimeseries(cbsaCode);
        const nationalData = await this.getNationalTimeseries();
        
        const metroMedianDays = metroData.map(record => ({
            month_date: record.month_date,
            median_days_on_market: record.median_days_on_market
        })).filter(record => record.median_days_on_market != null);
        
        const nationalMedianDays = nationalData.map(record => ({
            month_date: record.month_date,
            median_days_on_market: record.median_days_on_market
        })).filter(record => record.median_days_on_market != null);
        
        // Create lookup for national data
        const nationalLookup = {};
        nationalMedianDays.forEach(record => {
            nationalLookup[record.month_date] = record.median_days_on_market;
        });
        
        // Format chart data
        const labels = [];
        const metroValues = [];
        const nationalValues = [];
        
        metroMedianDays.forEach(record => {
            const monthStr = record.month_date.toString();
            const year = monthStr.substring(0, 4);
            const month = monthStr.substring(4, 6);
            const label = `${year}-${month}`;
            
            const nationalValue = nationalLookup[record.month_date];
            if (nationalValue != null) {
                labels.push(label);
                metroValues.push(record.median_days_on_market);
                nationalValues.push(nationalValue);
            }
        });
        
        // Calculate stats
        const latestMetro = metroValues[metroValues.length - 1];
        const latestNational = nationalValues[nationalValues.length - 1];
        const difference = latestMetro - latestNational;
        
        // Determine metro line color based on performance
        let metroColor;
        if (difference <= -10) {
            metroColor = '#00bfff'; // Very Fast - Light Blue
        } else if (difference <= -5) {
            metroColor = '#40e0d0'; // Fast - Turquoise
        } else if (Math.abs(difference) <= 5) {
            metroColor = '#ffd700'; // Average - Gold
        } else if (difference <= 15) {
            metroColor = '#ff6347'; // Slow - Tomato
        } else {
            metroColor = '#ff1493'; // Very Slow - Hot Pink
        }
        
        return {
            cbsa_code: cbsaCode.toString(),
            data: {
                labels,
                datasets: [
                    {
                        label: 'Metro Median Days',
                        data: metroValues,
                        borderColor: metroColor,
                        backgroundColor: metroColor + '20', // Add transparency
                        tension: 0.1
                    },
                    {
                        label: 'National Median Days',
                        data: nationalValues,
                        borderColor: '#64748B',
                        backgroundColor: 'rgba(100, 116, 139, 0.1)',
                        tension: 0.1,
                        borderDash: [5, 5]
                    }
                ]
            },
            stats: {
                latest_metro: latestMetro,
                latest_national: latestNational,
                difference: difference
            }
        };
    }

    /**
     * Simulate /api/median-days/state/{stateId} endpoint
     */
    async getStateMedianDays(stateId) {
        const stateData = await this.getStateTimeseries(stateId);
        const nationalData = await this.getNationalTimeseries();
        
        const stateMedianDays = stateData.map(record => ({
            month_date: record.month_date,
            median_days_on_market: record.median_days_on_market
        })).filter(record => record.median_days_on_market != null);
        
        const nationalMedianDays = nationalData.map(record => ({
            month_date: record.month_date,
            median_days_on_market: record.median_days_on_market
        })).filter(record => record.median_days_on_market != null);
        
        // Create lookup for national data
        const nationalLookup = {};
        nationalMedianDays.forEach(record => {
            nationalLookup[record.month_date] = record.median_days_on_market;
        });
        
        // Format chart data
        const labels = [];
        const stateValues = [];
        const nationalValues = [];
        
        stateMedianDays.forEach(record => {
            const monthStr = record.month_date.toString();
            const year = monthStr.substring(0, 4);
            const month = monthStr.substring(4, 6);
            const label = `${year}-${month}`;
            
            const nationalValue = nationalLookup[record.month_date];
            if (nationalValue != null) {
                labels.push(label);
                stateValues.push(record.median_days_on_market);
                nationalValues.push(nationalValue);
            }
        });
        
        // Calculate stats
        const latestState = stateValues[stateValues.length - 1];
        const latestNational = nationalValues[nationalValues.length - 1];
        const difference = latestState - latestNational;
        
        // Determine state line color based on performance
        let stateColor;
        if (difference <= -10) {
            stateColor = '#00bfff'; // Very Fast - Light Blue
        } else if (difference <= -5) {
            stateColor = '#40e0d0'; // Fast - Turquoise
        } else if (Math.abs(difference) <= 5) {
            stateColor = '#ffd700'; // Average - Gold
        } else if (difference <= 15) {
            stateColor = '#ff6347'; // Slow - Tomato
        } else {
            stateColor = '#ff1493'; // Very Slow - Hot Pink
        }
        
        return {
            state_id: stateId,
            data: {
                labels,
                datasets: [
                    {
                        label: 'State Median Days',
                        data: stateValues,
                        borderColor: stateColor,
                        backgroundColor: stateColor + '20', // Add transparency
                        tension: 0.1
                    },
                    {
                        label: 'National Median Days',
                        data: nationalValues,
                        borderColor: '#64748B',
                        backgroundColor: 'rgba(100, 116, 139, 0.1)',
                        tension: 0.1,
                        borderDash: [5, 5]
                    }
                ]
            },
            stats: {
                latest_state: latestState,
                latest_national: latestNational,
                difference: difference
            }
        };
    }

    /**
     * Simulate /api/trends/ endpoints
     */
    async getTrends(level, identifier) {
        console.log(`Getting trends for ${level}: ${identifier}`);
        
        switch (level) {
            case 'state':
                return await this.getStateTimeseries(identifier);
            case 'metro':
                return await this.getMetroTimeseries(identifier);
            case 'county':
                return await this.getCountyTimeseries(identifier);
            case 'national':
                return await this.getNationalTimeseries();
            default:
                throw new Error(`Unknown trend level: ${level}`);
        }
    }

    /**
     * Format data for Chart.js - matches API format
     */
    formatChartData(data, identifier, metric = 'active') {
        if (!data || data.length === 0) {
            return null;
        }

        const result = {
            cbsa_code: identifier,
            data: {
                labels: [],
                datasets: [
                    {
                        label: this._getMetricLabel(metric),
                        data: [],
                        borderColor: '#3B82F6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        tension: 0.1
                    },
                    {
                        label: `National ${this._getMetricLabel(metric)} Index`,
                        data: [],
                        borderColor: '#64748B',
                        backgroundColor: 'rgba(100, 116, 139, 0.1)',
                        tension: 0.1,
                        borderDash: [5, 5]
                    }
                ]
            },
            performance_stats: {
                baseline_date: null,
                baseline_value: null,
                latest_actual: null,
                latest_indexed: null,
                latest_performance_vs_index: null
            }
        };

        // Sort by date
        data.sort((a, b) => a.month_date - b.month_date);

        // Format data points
        for (const row of data) {
            const month_date = String(row.month_date);
            const year = month_date.substring(0, 4);
            const month = month_date.substring(4, 6);
            const label = `${year}-${month}`;

            result.data.labels.push(label);
            result.data.datasets[0].data.push(row.actual_value);
            result.data.datasets[1].data.push(row.indexed_value);

            // Update performance stats
            if (!result.performance_stats.baseline_date) {
                result.performance_stats.baseline_date = row.month_date;
                result.performance_stats.baseline_value = row.baseline_value;
            }
        }

        // Set latest values
        const latest = data[data.length - 1];
        result.performance_stats.latest_actual = latest.actual_value;
        result.performance_stats.latest_indexed = latest.indexed_value;
        result.performance_stats.latest_performance_vs_index = latest.performance_vs_index;

        return result;
    }

    _getMetricLabel(metric) {
        const labels = {
            'active': 'Active Listings',
            'median_price': 'Median Price',
            'new_listings': 'New Listings',
            'pending_sale': 'Pending Sale'
        };
        return labels[metric] || 'Active Listings';
    }

    /**
     * Get cache statistics
     */
    getCacheStats() {
        return {
            cachedFiles: this.cache.size,
            loadingFiles: this.loadingPromises.size,
            cacheKeys: Array.from(this.cache.keys())
        };
    }

    /**
     * Clear cache (useful for data updates)
     */
    clearCache() {
        this.cache.clear();
        console.log('Static data cache cleared');
    }
}

// Global instance
window.completeStaticDataLoader = new CompleteStaticDataLoader();
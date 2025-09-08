/**
 * Static Data Loader - Replaces API calls with static JSON file loading
 * Optimized for GitHub Pages deployment with caching and performance
 */

class StaticDataLoader {
    constructor() {
        this.cache = new Map();
        this.loadingPromises = new Map();
        this.dataPath = './data/';
    }

    /**
     * Load JSON data with caching and error handling
     */
    async loadData(filename) {
        // Return cached data if available
        if (this.cache.has(filename)) {
            return this.cache.get(filename);
        }

        // Return existing promise if already loading
        if (this.loadingPromises.has(filename)) {
            return this.loadingPromises.get(filename);
        }

        // Create new loading promise
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

    // API Replacement Methods

    /**
     * Get state coordinates - replaces /api/states
     */
    async getStates() {
        return await this.loadData('states.json');
    }

    /**
     * Get metro coordinates - replaces /api/metros
     */
    async getMetros() {
        return await this.loadData('metros.json');
    }

    /**
     * Get national timeseries - replaces /api/national/timeseries
     */
    async getNationalTimeseries() {
        return await this.loadData('national_timeseries.json');
    }

    /**
     * Get state indexed performance data - replaces /api/indexed-performance/state/{metric}/{state_id}
     */
    async getStateIndexedPerformance(metric, stateId) {
        const data = await this.loadData(`state_indexed_${metric}.json`);
        return data.filter(row => row.state_id === stateId);
    }

    /**
     * Get metro indexed performance data - replaces /api/indexed-performance/metro/{metric}/{cbsa_code}
     */
    async getMetroIndexedPerformance(metric, cbsaCode) {
        const data = await this.loadData(`metro_indexed_${metric}.json`);
        return data.filter(row => row.cbsa_code === parseInt(cbsaCode));
    }

    /**
     * Get county indexed performance data - replaces /api/indexed-performance/county/{metric}/{county_fips}
     */
    async getCountyIndexedPerformance(metric, countyFips) {
        const data = await this.loadData(`county_indexed_${metric}.json`);
        return data.filter(row => row.county_fips === countyFips);
    }

    /**
     * Get state timeseries data - replaces /api/state/{state_id}
     */
    async getStateTimeseries(stateId) {
        const data = await this.loadData('state_timeseries.json');
        return data.filter(row => row.state_id === stateId);
    }

    /**
     * Get metro timeseries data - replaces /api/metro/{cbsa_code}
     */
    async getMetroTimeseries(cbsaCode) {
        const data = await this.loadData('metro_timeseries.json');
        return data.filter(row => row.cbsa_code === parseInt(cbsaCode));
    }

    /**
     * Get county timeseries data - replaces /api/county/{county_fips}
     */
    async getCountyTimeseries(countyFips) {
        const data = await this.loadData('county_timeseries.json');
        return data.filter(row => row.county_fips === countyFips);
    }

    /**
     * Format data for Chart.js - matches API format
     */
    formatChartData(data, cbsaCode, metric = 'active') {
        if (!data || data.length === 0) {
            return null;
        }

        const result = {
            cbsa_code: cbsaCode,
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
window.staticDataLoader = new StaticDataLoader();
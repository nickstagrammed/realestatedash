// Real Estate Data Processor for Realtor.com CSV Data
class DataProcessor {
    constructor() {
        this.nationalData = [];
        this.stateData = {};
        this.metroData = {};
        this.processedBetas = {};
        this.processedMetroBetas = {};
    }
    
    async loadData() {
        try {
            await this.loadNationalData();
            await this.loadStateData();
            await this.loadMetroData();
            this.calculateBetas();
            this.calculateMetroBetas();
            return true;
        } catch (error) {
            console.error('Error loading data:', error);
            return false;
        }
    }
    
    async loadNationalData() {
        const response = await fetch('./data/national_data.csv');
        const csvText = await response.text();
        this.nationalData = this.parseCSV(csvText);
        
        // Sort by date descending (newest first)
        this.nationalData.sort((a, b) => parseInt(b.month_date_yyyymm) - parseInt(a.month_date_yyyymm));
    }
    
    async loadStateData() {
        const response = await fetch('./data/state_data.csv');
        const csvText = await response.text();
        const stateRows = this.parseCSV(csvText);
        
        // Group by state
        stateRows.forEach(row => {
            const state = row.state;
            if (!this.stateData[state]) {
                this.stateData[state] = [];
            }
            this.stateData[state].push(row);
        });
        
        // Sort each state's data by date descending
        Object.keys(this.stateData).forEach(state => {
            this.stateData[state].sort((a, b) => 
                parseInt(b.month_date_yyyymm) - parseInt(a.month_date_yyyymm)
            );
        });
    }
    
    async loadMetroData() {
        try {
            const response = await fetch('./data/metro_data.csv');
            const csvText = await response.text();
            const metroRows = this.parseCSV(csvText);
            
            // Group by metro
            metroRows.forEach(row => {
                const metro = row.cbsa_title || row.metro_name || row.metro;
                if (!this.metroData[metro]) {
                    this.metroData[metro] = [];
                }
                this.metroData[metro].push(row);
            });
            
            // Sort each metro's data by date descending
            Object.keys(this.metroData).forEach(metro => {
                this.metroData[metro].sort((a, b) => 
                    parseInt(b.month_date_yyyymm) - parseInt(a.month_date_yyyymm)
                );
            });
        } catch (error) {
            console.warn('Metro data not found, skipping:', error);
            this.metroData = {};
        }
    }
    
    parseCSV(csvText) {
        const lines = csvText.trim().split('\n');
        const headers = lines[0].split(',');
        const rows = [];
        
        for (let i = 1; i < lines.length; i++) {
            const values = this.parseCSVLine(lines[i]);
            if (values.length === headers.length) {
                const row = {};
                headers.forEach((header, index) => {
                    const value = values[index];
                    // Convert numeric fields
                    if (this.isNumeric(value)) {
                        row[header] = parseFloat(value);
                    } else {
                        row[header] = value;
                    }
                });
                rows.push(row);
            }
        }
        
        return rows;
    }
    
    parseCSVLine(line) {
        const values = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        
        values.push(current.trim());
        return values;
    }
    
    isNumeric(value) {
        return !isNaN(parseFloat(value)) && isFinite(value) && value !== '';
    }
    
    calculateBetas() {
        Object.keys(this.stateData).forEach(state => {
            this.processedBetas[state] = this.calculateStateBetas(state);
        });
    }
    
    calculateMetroBetas() {
        Object.keys(this.metroData).forEach(metro => {
            this.processedMetroBetas[metro] = this.calculateMetroAreaBetas(metro);
        });
    }
    
    calculateStateBetas(state) {
        const stateTimeSeries = this.stateData[state];
        const nationalTimeSeries = this.nationalData;
        
        // Ensure we have matching time periods
        const commonDates = this.getCommonDates(stateTimeSeries, nationalTimeSeries);
        
        const metrics = [
            'active_listing_count',
            'new_listing_count', 
            'pending_listing_count',
            'median_listing_price'
        ];
        
        const result = {
            state_name: state,
            latest_data: stateTimeSeries[0], // Most recent month
            betas: {}
        };
        
        metrics.forEach(metric => {
            result.betas[metric] = {
                beta_5y: this.calculateBeta(state, metric, 60, commonDates), // 5 years = 60 months
                beta_3y: this.calculateBeta(state, metric, 36, commonDates), // 3 years = 36 months
                beta_1y: this.calculateBeta(state, metric, 12, commonDates)  // 1 year = 12 months
            };
        });
        
        return result;
    }
    
    calculateMetroAreaBetas(metro) {
        const metroTimeSeries = this.metroData[metro];
        const nationalTimeSeries = this.nationalData;
        
        // Ensure we have matching time periods
        const commonDates = this.getCommonDatesMetro(metroTimeSeries, nationalTimeSeries);
        
        const metrics = [
            'active_listing_count',
            'new_listing_count', 
            'pending_listing_count',
            'median_listing_price'
        ];
        
        const result = {
            metro_name: metro,
            latest_data: metroTimeSeries[0], // Most recent month
            betas: {}
        };
        
        metrics.forEach(metric => {
            result.betas[metric] = {
                beta_5y: this.calculateMetroBeta(metro, metric, 60, commonDates), // 5 years = 60 months
                beta_3y: this.calculateMetroBeta(metro, metric, 36, commonDates), // 3 years = 36 months
                beta_1y: this.calculateMetroBeta(metro, metric, 12, commonDates)  // 1 year = 12 months
            };
        });
        
        return result;
    }
    
    getCommonDates(stateData, nationalData) {
        const stateDates = new Set(stateData.map(d => d.month_date_yyyymm));
        const nationalDates = new Set(nationalData.map(d => d.month_date_yyyymm));
        
        return Array.from(stateDates).filter(date => nationalDates.has(date))
            .map(d => parseInt(d))
            .sort((a, b) => b - a); // Sort descending (newest first)
    }
    
    getCommonDatesMetro(metroData, nationalData) {
        const metroDates = new Set(metroData.map(d => d.month_date_yyyymm));
        const nationalDates = new Set(nationalData.map(d => d.month_date_yyyymm));
        
        return Array.from(metroDates).filter(date => nationalDates.has(date))
            .map(d => parseInt(d))
            .sort((a, b) => b - a); // Sort descending (newest first)
    }
    
    calculateBeta(state, metric, months, commonDates) {
        if (commonDates.length < months) {
            return null; // Not enough data
        }
        
        const relevantDates = commonDates.slice(0, months);
        
        // Get state and national returns for the metric
        const stateReturns = this.getReturns(this.stateData[state], metric, relevantDates);
        const nationalReturns = this.getReturns(this.nationalData, metric, relevantDates);
        
        if (stateReturns.length !== nationalReturns.length || stateReturns.length < 2) {
            return null;
        }
        
        // Calculate beta = Covariance(state, national) / Variance(national)
        const covariance = this.calculateCovariance(stateReturns, nationalReturns);
        const nationalVariance = this.calculateVariance(nationalReturns);
        
        if (nationalVariance === 0) return null;
        
        return covariance / nationalVariance;
    }
    
    calculateMetroBeta(metro, metric, months, commonDates) {
        if (commonDates.length < months) {
            return null; // Not enough data
        }
        
        const relevantDates = commonDates.slice(0, months);
        
        // Get metro and national returns for the metric
        const metroReturns = this.getMetroReturns(this.metroData[metro], metric, relevantDates);
        const nationalReturns = this.getReturns(this.nationalData, metric, relevantDates);
        
        if (metroReturns.length !== nationalReturns.length || metroReturns.length < 2) {
            return null;
        }
        
        // Calculate beta = Covariance(metro, national) / Variance(national)
        const covariance = this.calculateCovariance(metroReturns, nationalReturns);
        const nationalVariance = this.calculateVariance(nationalReturns);
        
        if (nationalVariance === 0) return null;
        
        return covariance / nationalVariance;
    }
    
    getReturns(timeSeries, metric, dates) {
        const returns = [];
        
        // Create a map for quick lookup
        const dataMap = {};
        timeSeries.forEach(row => {
            dataMap[parseInt(row.month_date_yyyymm)] = row;
        });
        
        // Calculate month-over-month returns
        for (let i = 0; i < dates.length - 1; i++) {
            const currentDate = dates[i];
            const previousDate = dates[i + 1];
            
            const currentValue = dataMap[currentDate]?.[metric];
            const previousValue = dataMap[previousDate]?.[metric];
            
            if (currentValue && previousValue && previousValue !== 0) {
                const return_ = (currentValue - previousValue) / previousValue;
                returns.push(return_);
            }
        }
        
        return returns;
    }
    
    getMetroReturns(timeSeries, metric, dates) {
        const returns = [];
        
        // Create a map for quick lookup
        const dataMap = {};
        timeSeries.forEach(row => {
            dataMap[parseInt(row.month_date_yyyymm)] = row;
        });
        
        // Calculate month-over-month returns
        for (let i = 0; i < dates.length - 1; i++) {
            const currentDate = dates[i];
            const previousDate = dates[i + 1];
            
            const currentValue = dataMap[currentDate]?.[metric];
            const previousValue = dataMap[previousDate]?.[metric];
            
            if (currentValue && previousValue && previousValue !== 0) {
                const return_ = (currentValue - previousValue) / previousValue;
                returns.push(return_);
            }
        }
        
        return returns;
    }
    
    calculateCovariance(x, y) {
        const n = x.length;
        if (n !== y.length || n === 0) return 0;
        
        const meanX = x.reduce((sum, val) => sum + val, 0) / n;
        const meanY = y.reduce((sum, val) => sum + val, 0) / n;
        
        let covariance = 0;
        for (let i = 0; i < n; i++) {
            covariance += (x[i] - meanX) * (y[i] - meanY);
        }
        
        return covariance / (n - 1);
    }
    
    calculateVariance(x) {
        const n = x.length;
        if (n === 0) return 0;
        
        const mean = x.reduce((sum, val) => sum + val, 0) / n;
        let variance = 0;
        
        for (let i = 0; i < n; i++) {
            variance += Math.pow(x[i] - mean, 2);
        }
        
        return variance / (n - 1);
    }
    
    getStateList() {
        return Object.keys(this.processedBetas);
    }
    
    getStateBetas(state) {
        return this.processedBetas[state] || null;
    }
    
    getAllStatesData() {
        return this.processedBetas;
    }
    
    getMetroList() {
        return Object.keys(this.processedMetroBetas);
    }
    
    getMetroBetas(metro) {
        return this.processedMetroBetas[metro] || null;
    }
    
    getAllMetroData() {
        return this.processedMetroBetas;
    }
    
    // Helper method to get formatted data for the map visualization
    getFormattedStateData() {
        const formatted = {};
        
        Object.keys(this.processedBetas).forEach(state => {
            const stateInfo = this.processedBetas[state];
            const latest = stateInfo.latest_data;
            const stateTimeSeries = this.stateData[state];
            
            // Calculate MoM and YoY changes for median price
            const medianChanges = this.calculateChanges(stateTimeSeries, 'median_listing_price');
            
            formatted[state] = {
                // Current values
                active_listing_count: latest.active_listing_count || 0,
                new_listing_count: latest.new_listing_count || 0,
                pending_listing_count: latest.pending_listing_count || 0,
                median_listing_price: latest.median_listing_price || 0,
                
                // Month over month changes (use existing columns if available, otherwise calculate)
                active_listing_count_mm: latest.active_listing_count_mm || 0,
                new_listing_count_mm: latest.new_listing_count_mm || 0,
                pending_listing_count_mm: latest.pending_listing_count_mm || 0,
                median_listing_price_mm: latest.median_listing_price_mm || medianChanges.mom || 0,
                
                // Year over year changes (use existing columns if available, otherwise calculate)
                active_listing_count_yy: latest.active_listing_count_yy || 0,
                new_listing_count_yy: latest.new_listing_count_yy || 0,
                pending_listing_count_yy: latest.pending_listing_count_yy || 0,
                median_listing_price_yy: latest.median_listing_price_yy || medianChanges.yoy || 0,
                
                // Beta values
                active_listing_count_beta_5y: stateInfo.betas?.active_listing_count?.beta_5y || 0,
                active_listing_count_beta_3y: stateInfo.betas?.active_listing_count?.beta_3y || 0,
                active_listing_count_beta_1y: stateInfo.betas?.active_listing_count?.beta_1y || 0,
                
                new_listing_count_beta_5y: stateInfo.betas?.new_listing_count?.beta_5y || 0,
                new_listing_count_beta_3y: stateInfo.betas?.new_listing_count?.beta_3y || 0,
                new_listing_count_beta_1y: stateInfo.betas?.new_listing_count?.beta_1y || 0,
                
                pending_listing_count_beta_5y: stateInfo.betas?.pending_listing_count?.beta_5y || 0,
                pending_listing_count_beta_3y: stateInfo.betas?.pending_listing_count?.beta_3y || 0,
                pending_listing_count_beta_1y: stateInfo.betas?.pending_listing_count?.beta_1y || 0,
                
                median_listing_price_beta_5y: stateInfo.betas?.median_listing_price?.beta_5y || 0,
                median_listing_price_beta_3y: stateInfo.betas?.median_listing_price?.beta_3y || 0,
                median_listing_price_beta_1y: stateInfo.betas?.median_listing_price?.beta_1y || 0,
                
                // Add state identifier
                state_id: latest.state_id || state,
                last_updated: latest.month_date_yyyymm
            };
        });
        
        return formatted;
    }
    
    // Helper method to get formatted metro data for the map visualization
    getFormattedMetroData() {
        const formatted = {};
        
        Object.keys(this.processedMetroBetas).forEach(metro => {
            const metroInfo = this.processedMetroBetas[metro];
            const latest = metroInfo.latest_data;
            const metroTimeSeries = this.metroData[metro];
            
            // Calculate MoM and YoY changes for median price
            const medianChanges = this.calculateChanges(metroTimeSeries, 'median_listing_price');
            
            formatted[metro] = {
                // CBSA identifiers
                cbsa_code: latest.cbsa_code || null,
                cbsa_title: latest.cbsa_title || metro,
                
                // Current values
                active_listing_count: latest.active_listing_count || 0,
                new_listing_count: latest.new_listing_count || 0,
                pending_listing_count: latest.pending_listing_count || 0,
                median_listing_price: latest.median_listing_price || 0,
                
                // Month over month changes (use existing columns if available, otherwise calculate)
                active_listing_count_mm: latest.active_listing_count_mm || 0,
                new_listing_count_mm: latest.new_listing_count_mm || 0,
                pending_listing_count_mm: latest.pending_listing_count_mm || 0,
                median_listing_price_mm: latest.median_listing_price_mm || medianChanges.mom || 0,
                
                // Year over year changes (use existing columns if available, otherwise calculate)
                active_listing_count_yy: latest.active_listing_count_yy || 0,
                new_listing_count_yy: latest.new_listing_count_yy || 0,
                pending_listing_count_yy: latest.pending_listing_count_yy || 0,
                median_listing_price_yy: latest.median_listing_price_yy || medianChanges.yoy || 0,
                
                // Beta values
                active_listing_count_beta_5y: metroInfo.betas?.active_listing_count?.beta_5y || 0,
                active_listing_count_beta_3y: metroInfo.betas?.active_listing_count?.beta_3y || 0,
                active_listing_count_beta_1y: metroInfo.betas?.active_listing_count?.beta_1y || 0,
                
                new_listing_count_beta_5y: metroInfo.betas?.new_listing_count?.beta_5y || 0,
                new_listing_count_beta_3y: metroInfo.betas?.new_listing_count?.beta_3y || 0,
                new_listing_count_beta_1y: metroInfo.betas?.new_listing_count?.beta_1y || 0,
                
                pending_listing_count_beta_5y: metroInfo.betas?.pending_listing_count?.beta_5y || 0,
                pending_listing_count_beta_3y: metroInfo.betas?.pending_listing_count?.beta_3y || 0,
                pending_listing_count_beta_1y: metroInfo.betas?.pending_listing_count?.beta_1y || 0,
                
                median_listing_price_beta_5y: metroInfo.betas?.median_listing_price?.beta_5y || 0,
                median_listing_price_beta_3y: metroInfo.betas?.median_listing_price?.beta_3y || 0,
                median_listing_price_beta_1y: metroInfo.betas?.median_listing_price?.beta_1y || 0,
                
                // Add metro identifier
                metro_id: latest.cbsa_code || latest.metro_id || metro.substring(0, 3).toUpperCase(),
                metro_name: metro,
                last_updated: latest.month_date_yyyymm
            };
        });
        
        return formatted;
    }
    
    // Calculate MoM and YoY changes for any metric using SQL-style formula
    calculateChanges(timeSeries, metric) {
        if (!timeSeries || timeSeries.length < 2) {
            return { mom: 0, yoy: 0 };
        }
        
        // Sort by date descending (most recent first)
        const sortedData = [...timeSeries].sort((a, b) => 
            parseInt(b.month_date_yyyymm) - parseInt(a.month_date_yyyymm)
        );
        
        let mom = 0;
        let yoy = 0;
        
        // Get current month value
        const currentValue = sortedData[0]?.[metric];
        
        // Calculate Month-over-Month: (Current/Previous) - 1
        if (sortedData.length >= 2) {
            const previousMonthValue = sortedData[1]?.[metric];
            if (currentValue && previousMonthValue && previousMonthValue !== 0) {
                mom = (currentValue / previousMonthValue) - 1;
            }
        }
        
        // Calculate Year-over-Year: (Current/YearAgo) - 1
        if (sortedData.length >= 13) {
            const yearAgoValue = sortedData[12]?.[metric];  // 12 months back
            if (currentValue && yearAgoValue && yearAgoValue !== 0) {
                yoy = (currentValue / yearAgoValue) - 1;
            }
        }
        
        console.log(`${metric} calculations for ${sortedData[0]?.state || 'unknown'}:`, {
            current: currentValue,
            previousMonth: sortedData[1]?.[metric],
            yearAgo: sortedData[12]?.[metric],
            mom: mom,
            yoy: yoy,
            dataPoints: sortedData.length
        });
        
        return { mom, yoy };
    }
}
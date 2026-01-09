// Real Estate Data Processor for Realtor.com CSV Data
class DataProcessor {
    constructor() {
        this.nationalData = [];
        this.stateData = {};
        this.metroData = {};
        this.countyData = {};
        this.processedBetas = {};
        this.processedMetroBetas = {};
    }

    async loadData() {
        try {
            await this.loadNationalData();
            await this.loadStateData();
            await this.loadMetroData();
            await this.loadCountyData();
            this.calculateBetas();
            this.calculateMetroBetas();
            return true;
        } catch (error) {
            console.error('Error loading data:', error);
            return false;
        }
    }
    
    async loadNationalData() {
        console.log('Loading national_data.csv...');
        const response = await fetch('./data/national_data.csv');
        if (!response.ok) {
            throw new Error(`Failed to load national_data.csv: ${response.status} ${response.statusText}`);
        }
        const csvText = await response.text();
        this.nationalData = this.parseCSV(csvText);
        console.log(`Loaded ${this.nationalData.length} national data rows`);

        // Sort by date descending (newest first)
        this.nationalData.sort((a, b) => parseInt(b.month_date_yyyymm) - parseInt(a.month_date_yyyymm));
        console.log(`Latest national data date: ${this.nationalData[0]?.month_date_yyyymm}`);
    }

    async loadStateData() {
        console.log('Loading state_data.csv...');
        const response = await fetch('./data/state_data.csv');
        if (!response.ok) {
            throw new Error(`Failed to load state_data.csv: ${response.status} ${response.statusText}`);
        }
        const csvText = await response.text();
        const stateRows = this.parseCSV(csvText);
        console.log(`Loaded ${stateRows.length} state data rows`);
        
        // Group by state
        let dec2025Count = 0;
        stateRows.forEach(row => {
            const state = row.state;
            if (!this.stateData[state]) {
                this.stateData[state] = [];
            }
            this.stateData[state].push(row);

            // Count December 2025 rows
            if (row.month_date_yyyymm === 202512) {
                dec2025Count++;
            }
        });
        console.log(`Rows with December 2025 (202512): ${dec2025Count}`);
        
        // Sort each state's data by date descending
        Object.keys(this.stateData).forEach(state => {
            this.stateData[state].sort((a, b) =>
                parseInt(b.month_date_yyyymm) - parseInt(a.month_date_yyyymm)
            );
        });

        // Log sample state data with more detail
        const firstState = Object.keys(this.stateData)[0];
        if (firstState) {
            const stateRows = this.stateData[firstState];
            console.log(`Sample state (${firstState}):`, {
                totalRows: stateRows.length,
                latestDate: stateRows[0]?.month_date_yyyymm,
                latestDateType: typeof stateRows[0]?.month_date_yyyymm,
                firstFiveDates: stateRows.slice(0, 5).map(r => r.month_date_yyyymm),
                lastFiveDates: stateRows.slice(-5).map(r => r.month_date_yyyymm)
            });
        }
    }
    
    async loadCountyData() {
        try {
            console.log('Loading county_data.csv...');
            const response = await fetch('./data/county_data.csv');
            if (!response.ok) {
                throw new Error(`Failed to load county_data.csv: ${response.status} ${response.statusText}`);
            }
            const csvText = await response.text();
            const countyRows = this.parseCSV(csvText);
            console.log(`Loaded ${countyRows.length} county data rows`);

            // Group by county FIPS code
            countyRows.forEach(row => {
                // Keep FIPS as string and ensure it has leading zeros (5 digits)
                const fips = String(row.county_fips).padStart(5, '0');
                if (!this.countyData[fips]) {
                    this.countyData[fips] = [];
                }
                this.countyData[fips].push(row);
            });

            // Sort each county's data by date descending
            Object.keys(this.countyData).forEach(fips => {
                this.countyData[fips].sort((a, b) =>
                    parseInt(b.month_date_yyyymm) - parseInt(a.month_date_yyyymm)
                );
            });

            // Log sample county data
            const countyKeys = Object.keys(this.countyData);
            console.log(`Loaded ${countyKeys.length} unique counties`);
            const firstCounty = countyKeys[0];
            if (firstCounty) {
                console.log(`Sample county (${firstCounty}) - Latest date: ${this.countyData[firstCounty][0]?.month_date_yyyymm}, Rows: ${this.countyData[firstCounty].length}`);
                console.log(`First 10 county FIPS codes: ${countyKeys.slice(0, 10).join(', ')}`);
            }
        } catch (error) {
            console.warn('County data not found, skipping:', error);
            this.countyData = {};
        }
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
        let skippedRows = 0;

        console.log(`CSV has ${headers.length} columns, ${lines.length - 1} data lines`);
        console.log(`First 5 headers: ${headers.slice(0, 5).join(', ')}`);

        for (let i = 1; i < lines.length; i++) {
            const values = this.parseCSVLine(lines[i]);

            // Log first few rows to debug
            if (i <= 3) {
                console.log(`Row ${i}: ${values.length} columns, month=${values[0]}, state=${values[1]}, first_5_vals=[${values.slice(0, 5).join(', ')}]`);
            }

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

                // Log first row with December 2025 data
                if (rows.length === 1) {
                    console.log('First parsed row:', {
                        month_date: row.month_date_yyyymm,
                        state: row.state,
                        active_count: row.active_listing_count
                    });
                }
            } else {
                skippedRows++;
            }
        }

        if (skippedRows > 0) {
            console.log(`Skipped ${skippedRows} rows due to column mismatch`);
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
            'median_listing_price',
            'median_days_on_market'
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
            'median_listing_price',
            'median_days_on_market'
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
    
    // Get available years from the dataset
    getAvailableYears() {
        const years = new Set();
        Object.values(this.stateData).forEach(stateTimeSeries => {
            stateTimeSeries.forEach(row => {
                const yearStr = String(row.month_date_yyyymm).substring(0, 4);
                years.add(parseInt(yearStr));
            });
        });
        return Array.from(years).sort((a, b) => b - a);
    }

    // Get data for a specific time period
    getFormattedStateDataForPeriod(year = '', month = '') {
        const formatted = {};

        Object.keys(this.processedBetas).forEach(state => {
            const stateInfo = this.processedBetas[state];
            const stateTimeSeries = this.stateData[state];

            // Find the data point for the selected period
            let targetData;
            if (year && month) {
                // Specific month and year selected
                const targetYYYYMM = parseInt(`${year}${month}`);
                targetData = stateTimeSeries.find(row => row.month_date_yyyymm === targetYYYYMM);
            } else if (year && !month) {
                // Only year selected - get December of that year (or latest month in that year)
                const yearData = stateTimeSeries.filter(row =>
                    String(row.month_date_yyyymm).startsWith(year)
                );
                if (yearData.length > 0) {
                    yearData.sort((a, b) => b.month_date_yyyymm - a.month_date_yyyymm);
                    targetData = yearData[0];
                }
            } else {
                // Use latest data (default)
                targetData = stateInfo.latest_data;
            }

            if (!targetData) {
                // No data for this period, skip this state
                return;
            }

            // Calculate MoM and YoY changes for median price relative to the target date
            const medianChanges = this.calculateChangesFromDate(stateTimeSeries, 'median_listing_price', targetData.month_date_yyyymm);

            formatted[state] = this.formatStateDataPoint(stateInfo, targetData, medianChanges, stateTimeSeries);
        });

        return formatted;
    }

    // Calculate changes from a specific date
    calculateChangesFromDate(timeSeries, metric, targetYYYYMM) {
        const sortedData = [...timeSeries].sort((a, b) =>
            parseInt(b.month_date_yyyymm) - parseInt(a.month_date_yyyymm)
        );

        const currentIndex = sortedData.findIndex(row => row.month_date_yyyymm === targetYYYYMM);
        if (currentIndex === -1) return { mom: 0, yoy: 0 };

        const currentValue = sortedData[currentIndex]?.[metric];
        let mom = 0, yoy = 0;

        // MoM
        if (currentIndex + 1 < sortedData.length) {
            const previousMonthValue = sortedData[currentIndex + 1]?.[metric];
            if (currentValue && previousMonthValue && previousMonthValue !== 0) {
                mom = (currentValue / previousMonthValue) - 1;
            }
        }

        // YoY
        if (currentIndex + 12 < sortedData.length) {
            const yearAgoValue = sortedData[currentIndex + 12]?.[metric];
            if (currentValue && yearAgoValue && yearAgoValue !== 0) {
                yoy = (currentValue / yearAgoValue) - 1;
            }
        }

        return { mom, yoy };
    }

    // Format a single state data point
    formatStateDataPoint(stateInfo, dataPoint, medianChanges, stateTimeSeries) {
        return {
            // Current values
            active_listing_count: dataPoint.active_listing_count || 0,
            new_listing_count: dataPoint.new_listing_count || 0,
            pending_listing_count: dataPoint.pending_listing_count || 0,
            median_listing_price: dataPoint.median_listing_price || 0,
            median_days_on_market: dataPoint.median_days_on_market || 0,

            // Month over month changes
            active_listing_count_mm: dataPoint.active_listing_count_mm || 0,
            new_listing_count_mm: dataPoint.new_listing_count_mm || 0,
            pending_listing_count_mm: dataPoint.pending_listing_count_mm || 0,
            median_listing_price_mm: dataPoint.median_listing_price_mm || medianChanges.mom || 0,
            median_days_on_market_mm: dataPoint.median_days_on_market_mm || 0,

            // Year over year changes
            active_listing_count_yy: dataPoint.active_listing_count_yy || 0,
            new_listing_count_yy: dataPoint.new_listing_count_yy || 0,
            pending_listing_count_yy: dataPoint.pending_listing_count_yy || 0,
            median_listing_price_yy: dataPoint.median_listing_price_yy || medianChanges.yoy || 0,
            median_days_on_market_yy: dataPoint.median_days_on_market_yy || 0,

            // Beta values (remain constant across time periods)
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

            median_days_on_market_beta_5y: stateInfo.betas?.median_days_on_market?.beta_5y || 0,
            median_days_on_market_beta_3y: stateInfo.betas?.median_days_on_market?.beta_3y || 0,
            median_days_on_market_beta_1y: stateInfo.betas?.median_days_on_market?.beta_1y || 0,

            // Add state identifier
            state_id: dataPoint.state_id || stateInfo.state_name,
            last_updated: dataPoint.month_date_yyyymm
        };
    }

    // Helper method to get formatted data for the map visualization
    getFormattedStateData() {
        const formatted = {};

        Object.keys(this.processedBetas).forEach(state => {
            const stateInfo = this.processedBetas[state];
            const latest = stateInfo.latest_data;
            const stateTimeSeries = this.stateData[state];

            // Debug log to verify latest data
            if (state === 'California' || state === 'Texas') {
                console.log(`Latest data for ${state}:`, {
                    month_date_yyyymm: latest.month_date_yyyymm,
                    active_listing_count: latest.active_listing_count,
                    median_listing_price: latest.median_listing_price,
                    new_listing_count: latest.new_listing_count
                });
            }

            // Calculate MoM and YoY changes for median price
            const medianChanges = this.calculateChanges(stateTimeSeries, 'median_listing_price');
            
            formatted[state] = {
                // Current values
                active_listing_count: latest.active_listing_count || 0,
                new_listing_count: latest.new_listing_count || 0,
                pending_listing_count: latest.pending_listing_count || 0,
                median_listing_price: latest.median_listing_price || 0,
                median_days_on_market: latest.median_days_on_market || 0,
                
                // Month over month changes (use existing columns if available, otherwise calculate)
                active_listing_count_mm: latest.active_listing_count_mm || 0,
                new_listing_count_mm: latest.new_listing_count_mm || 0,
                pending_listing_count_mm: latest.pending_listing_count_mm || 0,
                median_listing_price_mm: latest.median_listing_price_mm || medianChanges.mom || 0,
                median_days_on_market_mm: latest.median_days_on_market_mm || 0,
                
                // Year over year changes (use existing columns if available, otherwise calculate)
                active_listing_count_yy: latest.active_listing_count_yy || 0,
                new_listing_count_yy: latest.new_listing_count_yy || 0,
                pending_listing_count_yy: latest.pending_listing_count_yy || 0,
                median_listing_price_yy: latest.median_listing_price_yy || medianChanges.yoy || 0,
                median_days_on_market_yy: latest.median_days_on_market_yy || 0,
                
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
                
                median_days_on_market_beta_5y: stateInfo.betas?.median_days_on_market?.beta_5y || 0,
                median_days_on_market_beta_3y: stateInfo.betas?.median_days_on_market?.beta_3y || 0,
                median_days_on_market_beta_1y: stateInfo.betas?.median_days_on_market?.beta_1y || 0,
                
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
                median_days_on_market: latest.median_days_on_market || 0,
                
                // Month over month changes (use existing columns if available, otherwise calculate)
                active_listing_count_mm: latest.active_listing_count_mm || 0,
                new_listing_count_mm: latest.new_listing_count_mm || 0,
                pending_listing_count_mm: latest.pending_listing_count_mm || 0,
                median_listing_price_mm: latest.median_listing_price_mm || medianChanges.mom || 0,
                median_days_on_market_mm: latest.median_days_on_market_mm || 0,
                
                // Year over year changes (use existing columns if available, otherwise calculate)
                active_listing_count_yy: latest.active_listing_count_yy || 0,
                new_listing_count_yy: latest.new_listing_count_yy || 0,
                pending_listing_count_yy: latest.pending_listing_count_yy || 0,
                median_listing_price_yy: latest.median_listing_price_yy || medianChanges.yoy || 0,
                median_days_on_market_yy: latest.median_days_on_market_yy || 0,
                
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
                
                median_days_on_market_beta_5y: metroInfo.betas?.median_days_on_market?.beta_5y || 0,
                median_days_on_market_beta_3y: metroInfo.betas?.median_days_on_market?.beta_3y || 0,
                median_days_on_market_beta_1y: metroInfo.betas?.median_days_on_market?.beta_1y || 0,
                
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
    
    // Get historical time series data for a specific state and metric
    getStateHistoricalData(stateName, metric, monthsBack = 60) {
        const stateTimeSeries = this.stateData[stateName];

        console.log(`getStateHistoricalData called for ${stateName}, metric: ${metric}`);

        if (!stateTimeSeries || stateTimeSeries.length === 0) {
            console.warn(`No time series data found for state: ${stateName}`);
            console.log('Available states:', Object.keys(this.stateData).slice(0, 10));
            return [];
        }

        console.log(`Found ${stateTimeSeries.length} rows for ${stateName}, latest: ${stateTimeSeries[0]?.month_date_yyyymm}`);

        // Take the most recent monthsBack months, already sorted by date descending
        const recentData = stateTimeSeries.slice(0, monthsBack);

        // Reverse to get chronological order (oldest to newest)
        const result = recentData.reverse().map(row => ({
            date: row.month_date_yyyymm,
            label: this.formatDateLabel(row.month_date_yyyymm),
            value: parseFloat(row[metric]) || 0
        }));

        console.log(`Returning ${result.length} data points, date range: ${result[0]?.date} to ${result[result.length-1]?.date}`);

        return result;
    }
    
    // Get historical time series data for a specific county and metric
    getCountyHistoricalData(countyFIPS, metric, monthsBack = 60) {
        // County data is stored by FIPS code
        const countyTimeSeries = this.countyData?.[countyFIPS];

        console.log(`getCountyHistoricalData called for ${countyFIPS}, metric: ${metric}`);

        if (!countyTimeSeries || countyTimeSeries.length === 0) {
            console.warn(`No time series data found for county: ${countyFIPS}`);
            console.log(`Available county FIPS (first 10): ${Object.keys(this.countyData).slice(0, 10).join(', ')}`);
            console.log(`Type of lookup key: ${typeof countyFIPS}, Type of stored key: ${typeof Object.keys(this.countyData)[0]}`);
            return [];
        }

        console.log(`Found ${countyTimeSeries.length} rows for county ${countyFIPS}, latest: ${countyTimeSeries[0]?.month_date_yyyymm}`);

        // Take the most recent monthsBack months, already sorted by date descending
        const recentData = countyTimeSeries.slice(0, monthsBack);

        // Reverse to get chronological order (oldest to newest)
        const result = recentData.reverse().map(row => ({
            date: row.month_date_yyyymm,
            label: this.formatDateLabel(row.month_date_yyyymm),
            value: parseFloat(row[metric]) || 0
        }));

        console.log(`Returning ${result.length} county data points, date range: ${result[0]?.date} to ${result[result.length-1]?.date}`);

        return result;
    }

    // Format YYYYMM to readable date label
    formatDateLabel(yyyymm) {
        const dateStr = String(yyyymm);
        const year = dateStr.substring(0, 4);
        const month = dateStr.substring(4, 6);
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                           'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${monthNames[parseInt(month) - 1]} ${year}`;
    }
    
    // Get historical time series data for a specific metro and metric
    getMetroHistoricalData(metroName, metric, monthsBack = 60) {
        const metroTimeSeries = this.metroData[metroName];
        if (!metroTimeSeries || metroTimeSeries.length === 0) {
            return [];
        }
        
        // Take the most recent monthsBack months, already sorted by date descending
        const recentData = metroTimeSeries.slice(0, monthsBack);
        
        // Reverse to get chronological order (oldest to newest)
        return recentData.reverse().map(row => ({
            date: row.month_date_yyyymm,
            label: this.formatDateLabel(row.month_date_yyyymm),
            value: parseFloat(row[metric]) || 0
        }));
    }
}
// Test data embedded directly to avoid CORS issues
const TEST_STATE_DATA = {
    'Nevada': {
        month_date_yyyymm: 202507,
        state: 'Nevada',
        state_id: 'NV',
        median_listing_price: 499450,
        active_listing_count: 13097,
        new_listing_count: 4406,
        pending_listing_count: 3870,
        active_listing_count_mm: 0.0265,
        new_listing_count_mm: -0.0614,
        pending_listing_count_mm: -0.0552,
        active_listing_count_yy: 0.5295,
        new_listing_count_yy: 0.0367,
        pending_listing_count_yy: -0.0894
    },
    'Washington': {
        month_date_yyyymm: 202507,
        state: 'Washington',
        state_id: 'WA',
        median_listing_price: 659475,
        active_listing_count: 24224,
        new_listing_count: 10460,
        pending_listing_count: 9811,
        active_listing_count_mm: 0.0625,
        new_listing_count_mm: -0.095,
        pending_listing_count_mm: -0.0648,
        active_listing_count_yy: 0.3158,
        new_listing_count_yy: 0.04,
        pending_listing_count_yy: -0.0737
    },
    'Minnesota': {
        month_date_yyyymm: 202507,
        state: 'Minnesota',
        state_id: 'MN',
        median_listing_price: 399000,
        active_listing_count: 14196,
        new_listing_count: 8270,
        pending_listing_count: 9340,
        active_listing_count_mm: 0.0403,
        new_listing_count_mm: -0.0702,
        pending_listing_count_mm: -0.0695,
        active_listing_count_yy: 0.1513,
        new_listing_count_yy: -0.0043,
        pending_listing_count_yy: 0.016
    },
    'Kansas': {
        month_date_yyyymm: 202507,
        state: 'Kansas',
        state_id: 'KS',
        median_listing_price: 301126,
        active_listing_count: 7619,
        new_listing_count: 3904,
        pending_listing_count: 4768,
        active_listing_count_mm: 0.0327,
        new_listing_count_mm: -0.0166,
        pending_listing_count_mm: -0.068,
        active_listing_count_yy: 0.2387,
        new_listing_count_yy: 0.0495,
        pending_listing_count_yy: 0.0663
    },
    'Colorado': {
        month_date_yyyymm: 202507,
        state: 'Colorado',
        state_id: 'CO',
        median_listing_price: 599000,
        active_listing_count: 32276,
        new_listing_count: 9836,
        pending_listing_count: 9502,
        active_listing_count_mm: 0.0399,
        new_listing_count_mm: -0.1997,
        pending_listing_count_mm: -0.0662,
        active_listing_count_yy: 0.3597,
        new_listing_count_yy: -0.0281,
        pending_listing_count_yy: 0.0193
    }
};

// Mock beta calculations for testing
function calculateMockBetas(stateData) {
    const formattedData = {};
    
    Object.keys(stateData).forEach(state => {
        const data = stateData[state];
        
        // Generate realistic beta values based on actual volatility patterns
        const baseVolatility = Math.abs(data.active_listing_count_yy || 0) + Math.abs(data.new_listing_count_yy || 0);
        const betaMultiplier = 0.5 + (baseVolatility * 2);
        
        // Calculate median price MoM and YoY using the specified syntax
        // MoM = (Jul2025/Jun2025)-1, YoY = (Jul2025/Jul2024)-1
        const currentPrice = data.median_listing_price || 0;
        const previousMonthPrice = currentPrice * (1 - (Math.random() * 0.1 - 0.05)); // ±5% variation
        const yearAgoPrice = currentPrice * (1 - (Math.random() * 0.2 - 0.1)); // ±10% variation
        
        const medianPriceMoM = currentPrice > 0 ? (currentPrice / previousMonthPrice) - 1 : 0;
        const medianPriceYoY = currentPrice > 0 ? (currentPrice / yearAgoPrice) - 1 : 0;
        
        formattedData[state] = {
            // Raw data
            active_listing_count: data.active_listing_count,
            new_listing_count: data.new_listing_count,
            pending_listing_count: data.pending_listing_count,
            median_listing_price: data.median_listing_price,
            
            // MoM changes
            active_listing_count_mm: data.active_listing_count_mm,
            new_listing_count_mm: data.new_listing_count_mm,
            pending_listing_count_mm: data.pending_listing_count_mm,
            median_listing_price_mm: medianPriceMoM,
            
            // YoY changes
            active_listing_count_yy: data.active_listing_count_yy,
            new_listing_count_yy: data.new_listing_count_yy,
            pending_listing_count_yy: data.pending_listing_count_yy,
            median_listing_price_yy: medianPriceYoY,
            
            // Mock beta calculations
            active_listing_count_beta_5y: betaMultiplier * 0.9,
            active_listing_count_beta_3y: betaMultiplier * 1.1,
            active_listing_count_beta_1y: betaMultiplier * 1.3,
            
            new_listing_count_beta_5y: betaMultiplier * 0.8,
            new_listing_count_beta_3y: betaMultiplier * 1.0,
            new_listing_count_beta_1y: betaMultiplier * 1.2,
            
            pending_listing_count_beta_5y: betaMultiplier * 0.7,
            pending_listing_count_beta_3y: betaMultiplier * 0.9,
            pending_listing_count_beta_1y: betaMultiplier * 1.1,
            
            median_listing_price_beta_5y: betaMultiplier * 0.6,
            median_listing_price_beta_3y: betaMultiplier * 0.8,
            median_listing_price_beta_1y: betaMultiplier * 1.0,
            
            // Metadata
            state_id: data.state_id,
            last_updated: data.month_date_yyyymm
        };
    });
    
    return formattedData;
}
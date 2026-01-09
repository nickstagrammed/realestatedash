# Real Estate Beta Dashboard - Project Brief

## ⚠️ IMPORTANT: Recent Updates (January 8, 2026)

### Data Loading Changes
- **Dashboard now uses CSV files exclusively** for all trend charts (state, metro, county views)
- **Indexed performance JSON files are DISABLED** until they can be regenerated with current data
- CSV files updated to December 2025 - all views now show correct latest data

### Disabled Features (Temporarily)
The following features are **intentionally disabled** in the code and should remain disabled until indexed JSON files are regenerated:
1. **Indexed Performance Charts** - State/Metro/County "vs National Index" comparison charts
   - Location: `app_working.js` lines 3334, 3278, 3307, 1583
   - Disabled with: `if (false && supportsIndexed)`
2. **Median Days Comparison Charts** - State/Metro median days with national comparison
   - Location: `app_working.js` lines 3278, 3307
   - Disabled with: `if (false && metric === 'median_days_on_market')`

### Files Requiring Updates
When new data arrives (e.g., January 2026):
- ✅ **CSV Files** (will auto-update charts):
  - `data/national_data.csv`
  - `data/state_data.csv`
  - `data/metro_data.csv`
  - `data/county_data.csv`
- ❌ **JSON Files** (need regeneration, currently disabled):
  - `data/*_indexed_*.json` (12 files for state/metro/county indexed performance)

### Server Configuration
- `serve.py` configured to disable caching for `.js` files to ensure updates load properly
- Cache-busting query parameters added to script tags in `index.html`

---

## Project Overview
Building a single-page web application that analyzes real estate market data using beta calculations (similar to stock market beta analysis) to understand how local markets correlate with national trends.

## Core Concept
- **Beta Analysis**: Calculate correlation between local real estate markets and national market movements
- **Time Periods**: 5-year baseline beta + 3-year recent trends beta
- **Market Insight**: Identify markets that are more/less correlated to national real estate trends
- **Use Cases**: Market forecasting, price analysis, risk assessment

## Data Structure

### Data Source
- Monthly aggregated data from realtor.com (2016/2017 to present)
- Pre-aggregated by geographic groupings (no individual listings)
- Automated monthly updates when new data is released

### Core Metrics
1. **Total Inventory** - Active listings count
2. **New Listings** - Fresh market entries
3. **Pending Sales** - Properties under contract
4. **MoM Change** - Month-over-month percentage change
5. **YoY Change** - Year-over-year percentage change

### Geographic Hierarchy
```
National Level
├── State Level (50 states)
    ├── Metro Markets (cross-state boundaries allowed)
    ├── Counties (within state boundaries)
    └── Zip Codes (within state boundaries)
```

### Beta Calculations
For each geography and each metric:
- **5-Year Beta**: Baseline correlation (60 monthly data points)
- **3-Year Beta**: Recent trend correlation (36 monthly data points)
- **Beta Formula**: Covariance(Local Returns, National Returns) / Variance(National Returns)
- **Returns**: Month-over-month percentage changes

## Technical Architecture

### Backend
- **Database**: SQLite (file-based, handles millions of rows efficiently)
- **Data Processing**: Monthly automated pipeline
- **API**: Serve pre-calculated betas and raw data

### Database Schema
```sql
-- Raw monthly data
CREATE TABLE market_data (
    date TEXT,                    -- 'YYYY-MM-01'
    geography_type TEXT,          -- 'national', 'state', 'metro', 'county', 'zip'
    geography_id TEXT,            -- specific identifier
    total_inventory INTEGER,
    new_listings INTEGER,
    pending_sales INTEGER,
    PRIMARY KEY (date, geography_type, geography_id)
);

-- Pre-calculated returns
CREATE TABLE market_returns (
    date TEXT,
    geography_type TEXT,
    geography_id TEXT,
    total_inventory_return REAL,
    new_listings_return REAL,
    pending_sales_return REAL,
    PRIMARY KEY (date, geography_type, geography_id)
);

-- Current beta calculations
CREATE TABLE current_betas (
    geography_type TEXT,
    geography_id TEXT,
    -- 5-year betas
    total_inventory_beta_5y REAL,
    new_listings_beta_5y REAL,
    pending_sales_beta_5y REAL,
    -- 3-year betas
    total_inventory_beta_3y REAL,
    new_listings_beta_3y REAL,
    pending_sales_beta_3y REAL,
    last_updated DATE,
    PRIMARY KEY (geography_type, geography_id)
);

-- Geographic relationships (for cross-boundary metros/zips)
CREATE TABLE geography_relationships (
    child_id TEXT,
    child_type TEXT,
    parent_id TEXT,
    parent_type TEXT,
    is_primary BOOLEAN,
    PRIMARY KEY (child_id, child_type, parent_id, parent_type)
);
```

### Frontend
- **Single Page Application** with interactive mapping
- **Map Library**: Leaflet or Mapbox for base mapping
- **Data Visualization**: Charts for time-series and beta trends
- **Client-side filtering** and search functionality

## User Interface Design

### Navigation Flow
```
National Map (State-level choropleth)
    ↓ Click Any State
State Detail View
    ↓ Dropdown Selection:
    ├── Metro Markets (includes cross-state metros)
    ├── Counties (clean state boundaries)
    └── Zip Codes (within state)
```

### Map Features
- **Default View**: US national map colored by selected metric
- **Color Coding**: Cool colors (low values/beta) to warm colors (high values/beta)
- **Hover**: Quick popup with key metrics
- **Click**: Detailed panel with all calculations
- **Toggle Controls**: 
  - Metric selector (Inventory/New Listings/Pending Sales/MoM%/YoY%)
  - Timeframe (5-year beta vs 3-year beta)
  - Raw data vs Beta analysis views

### Dashboard Components
1. **Interactive Map** (primary interface)
2. **Metric Selector** (dropdown/buttons)
3. **Geographic Level Controls** (National/State/Metro/County/Zip)
4. **Search Box** (autocomplete for specific locations)
5. **Detail Panel** (shows selected market information)
6. **Comparison Tool** (side-by-side market analysis)

## Implementation Priorities

### Phase 1: Core Infrastructure
1. Set up project structure and dependencies
2. Design and implement SQLite database schema
3. Create data processing pipeline for CSV ingestion
4. Implement beta calculation algorithms

### Phase 2: Basic Interface
1. Set up mapping framework (Leaflet/Mapbox)
2. Create basic choropleth visualization
3. Implement geographic hierarchy navigation
4. Add metric toggle functionality

### Phase 3: Advanced Features
1. Add detailed drill-down panels
2. Implement search and filtering
3. Create comparison tools
4. Add time-series charts

### Phase 4: Automation & Polish
1. Automate monthly data updates
2. Add error handling and data validation
3. Optimize performance
4. Polish UI/UX

## Key Technical Considerations

### Data Volume
- ~33,000 zip codes × 60+ months × 3 metrics = ~6M+ rows
- ~400 metro areas × 60+ months × 3 metrics = ~72K rows
- ~3,100 counties × 60+ months × 3 metrics = ~558K rows
- SQLite can handle this scale efficiently

### Performance Optimizations
- Pre-calculate and store betas (avoid real-time calculation)
- Load current betas client-side for fast filtering
- Lazy-load historical data for drill-down views
- Implement proper database indexing

### Data Quality
- Handle missing months in time series
- Validate data consistency across geographic levels
- Flag geographies with insufficient data for beta calculations
- Implement outlier detection and handling

## Expected Deliverables
1. **Working web application** with interactive mapping
2. **SQLite database** with optimized schema and indexes
3. **Data processing pipeline** for monthly updates
4. **Documentation** for setup, usage, and maintenance
5. **Beta calculation algorithms** properly implemented and tested

## Success Metrics
- Fast, responsive mapping interface (< 2 second load times)
- Accurate beta calculations matching financial industry standards
- Intuitive navigation between geographic levels
- Successful monthly automated data updates
- Clear, actionable market insights from beta analysis

## National Adjusted Index Methodology

### Overview
The National Adjusted Index system provides a sophisticated comparison of local market performance against national trends. Instead of using beta correlation (which shows volatility), this system shows whether a market is outperforming or underperforming national trends over time.

### Mathematical Foundation

#### 1. Baseline Establishment
- Each subgroup (metro, state, etc.) uses its **first available data point** in the analysis period as the baseline (index = 1.0)
- Analysis period: **Dynamic 5-year window** from the latest available date
- Example: If latest data is July 2025, analysis covers July 2020 to July 2025

#### 2. National Periodic Returns Calculation
```
National Return(t) = [National Value(t) / National Value(t-1)] - 1
```
- Calculated month-over-month for the entire national dataset
- First month return = 0 (no prior period for comparison)
- Creates a time series of national market movements

#### 3. Cumulative National Performance
For any given month, calculate cumulative national performance from baseline:
```
Cumulative Return = ∏(1 + National Return(i)) for i = baseline+1 to current month
```
- Multiplies (1 + return) for each month from baseline to current
- Results in compound growth rate following national trends

#### 4. Indexed Value Calculation
```
Indexed Value = Baseline Value × Cumulative Return
```
- Shows what the local market value **would be** if it followed national trends exactly
- Uses the local baseline but applies national growth patterns

#### 5. Performance vs Index
```
Performance vs Index = (Actual Value / Indexed Value) - 1
```
- **Positive values** = Outperforming national trends
- **Negative values** = Underperforming national trends  
- **Zero** = Exactly following national trends

### Implementation Process

#### Step 1: Data Alignment
- Ensure both national and subgroup data start from the same period
- Calculate dynamic 5-year window: `start_date = latest_year - 5, same_month`
- Verify data completeness for accurate comparison

#### Step 2: National Baseline Calculation
```python
# Calculate national periodic returns
national_df['prev_count'] = national_df['metric_column'].shift(1)
national_df['national_return'] = (national_df['metric_column'] / national_df['prev_count']) - 1
national_df['national_return'] = national_df['national_return'].fillna(0)
```

#### Step 3: Subgroup Processing
For each subgroup:
1. **Establish baseline**: First month's value in analysis period
2. **Calculate indexed performance** for each subsequent month:
   ```python
   # Get national returns from baseline to current month
   cumulative_return = 1.0
   for nat_row in national_subset:
       if nat_row['month_date'] > baseline_date:
           cumulative_return *= (1 + nat_row['national_return'])
   
   # Calculate what value should be following national trends
   indexed_value = baseline_value * cumulative_return
   
   # Calculate performance differential
   performance_vs_index = (actual_value / indexed_value) - 1
   ```

#### Step 4: Database Storage
Store results in structured tables:
```sql
CREATE TABLE indexed_performance_[metric] (
    cbsa_code INTEGER,
    cbsa_title TEXT,
    month_date INTEGER,
    baseline_value REAL,
    baseline_date INTEGER,
    actual_value REAL,
    indexed_value REAL,
    performance_vs_index REAL,
    cumulative_national_return REAL,
    PRIMARY KEY (cbsa_code, month_date)
);
```

### Visualization and Interpretation

#### Color Coding System
- **Green (#22c55e)**: Outperforming by ≥5% (`performance_vs_index ≥ 0.05`)
- **Yellow (#eab308)**: Within ±5% of national trends (`-0.05 ≤ performance_vs_index < 0.05`)
- **Red (#ef4444)**: Underperforming by >5% (`performance_vs_index < -0.05`)

#### Chart Display
- **Actual Line**: Shows real market performance with color coding
- **Index Line**: Gray dashed line showing national trend baseline
- **Performance Stats**: 
  - Performance vs National: Percentage difference
  - Actual Growth (5Y): Total growth from baseline
  - National Growth (5Y): What growth would have been following national trends

### Scalability to Other Subgroups

This methodology can be applied to any geographic or demographic subgroup:

#### 1. State-Level Analysis
- Same process using state data vs national baseline
- Useful for understanding regional economic patterns
- API endpoint: `/api/indexed-performance/state/<state_code>`

#### 2. County-Level Analysis  
- County performance vs national/state trends
- Granular local market analysis
- API endpoint: `/api/indexed-performance/county/<county_code>`

#### 3. Custom Subgroups
- Property type segments (single-family, condo, etc.)
- Price tiers (luxury, affordable, median)
- Market segments (first-time buyers, investors, etc.)

#### Implementation Template
```python
def calculate_indexed_performance(subgroup_data, national_data, metric_column):
    # 1. Establish analysis period
    # 2. Calculate national returns  
    # 3. Process each subgroup with baseline indexing
    # 4. Store in appropriate database table
    # 5. Create API endpoints for data access
    # 6. Update frontend to handle new subgroup types
```

### Key Benefits

1. **Intuitive Interpretation**: Clear outperform/underperform signals
2. **Temporal Consistency**: All comparisons use aligned time periods  
3. **Scalable Framework**: Easily extensible to new metrics and subgroups
4. **Visual Clarity**: Green/Yellow/Red system provides immediate insights
5. **Mathematical Rigor**: Compound growth calculations mirror real market dynamics

### Current Implementation Status

**Completed Metrics:**
- Active Listings Count (`indexed_performance_active`) - 56,425 records
- Median Listing Price (`indexed_performance_median_price`) - 56,425 records  
- New Listing Count (`indexed_performance_new_listings`) - 56,303 records
- Pending Sale Count (`indexed_performance_pending_sale`) - 55,691 records

**Geographic Coverage:**
- 925 Metro Areas across all metrics
- 61 months of data (July 2020 - July 2025)
- ~225,000 total indexed performance records

## Median Days on Market Direct Comparison Methodology

### Overview
The Median Days on Market comparison provides a straightforward apples-to-apples comparison between local metro markets and national trends. Unlike other metrics that require indexed performance calculations, median days are already in a directly comparable unit (days), making the analysis more intuitive.

### Mathematical Foundation

#### 1. Data Alignment
- Both metro and national data use the same **dynamic 5-year window** methodology
- Analysis period: Latest available date minus 5 years, same month
- Example: If latest data is July 2025, analysis covers July 2020 to July 2025
- Ensures temporal consistency between local and national comparisons

#### 2. Direct Comparison Logic
```
Metro Performance = Metro Median Days - National Median Days
```
- **Negative values** = Metro is faster than national (fewer days on market)
- **Positive values** = Metro is slower than national (more days on market)
- **Zero** = Metro matches national performance exactly

### Implementation Process

#### Step 1: Dynamic Time Window Calculation
```python
# Get latest date and calculate 5-year window dynamically
cursor.execute('SELECT MAX(month_date) FROM national_timeseries')
latest_date = cursor.fetchone()[0]

latest_year = int(str(latest_date)[:4])
latest_month = int(str(latest_date)[4:6])
start_year = latest_year - 5
start_date = int(f'{start_year}{latest_month:02d}')
```

#### Step 2: Data Retrieval
```python
# Get metro median days data
cursor.execute('''
    SELECT month_date, median_days_on_market
    FROM metro_timeseries
    WHERE cbsa_code = ? AND month_date BETWEEN ? AND ?
    ORDER BY month_date
''', (cbsa_code, start_date, latest_date))

# Get national median days data for same period
cursor.execute('''
    SELECT month_date, median_days_on_market
    FROM national_timeseries
    WHERE month_date BETWEEN ? AND ?
    ORDER BY month_date
''', (start_date, latest_date))
```

#### Step 3: Data Processing and Statistics
```python
# Create lookup for national data by month_date
national_lookup = {}
for row in national_data:
    national_lookup[row['month_date']] = row['median_days_on_market']

# Process metro data and align with national
for row in metro_data:
    metro_days = row['median_days_on_market']
    national_days = national_lookup.get(month_date)
    
    # Calculate simple difference
    difference = metro_days - national_days
```

### API Implementation

#### Endpoint Structure
```
GET /api/median-days/metro/<cbsa_code>
```

#### Response Format
```json
{
    "cbsa_code": "13820",
    "data": {
        "labels": ["2020-07", "2020-08", ...],
        "datasets": [
            {
                "label": "Metro Median Days",
                "data": [58, 54, 54, ...],
                "borderColor": "#ff6347",
                "backgroundColor": "rgba(255, 99, 71, 0.1)"
            },
            {
                "label": "National Median Days", 
                "data": [53, 51, 50, ...],
                "borderColor": "#64748B",
                "borderDash": [5, 5]
            }
        ]
    },
    "stats": {
        "latest_metro": 57.0,
        "latest_national": 58,
        "difference": -1.0
    }
}
```

### Frontend Integration

#### Chart Visualization
- **Dual-line Chart**: Metro vs National trends over 5-year period
- **Metro Line**: Color-coded based on performance vs national average (conditional formatting)
- **National Line**: Dashed gray line (`#64748B`)
- **Y-Axis**: Formatted as "X days" for clarity

#### Conditional Color Coding System
The metro line color is determined by performance relative to national average:
- **Light Blue (`#00bfff`)**: Very Fast - More than 10 days faster than national
- **Turquoise (`#40e0d0`)**: Fast - 5-10 days faster than national
- **Gold (`#ffd700`)**: Average - Within 5 days of national (±5 days)
- **Tomato (`#ff6347`)**: Slow - 5-15 days slower than national
- **Hot Pink (`#ff1493`)**: Very Slow - More than 15 days slower than national

#### Statistics Display
```html
<div class="lightbox-stat">
    <div class="lightbox-stat-label">Metro Median Days</div>
    <div class="lightbox-stat-value" style="color: #ff6347">57 days</div>
</div>
<div class="lightbox-stat">
    <div class="lightbox-stat-label">National Median Days</div>
    <div class="lightbox-stat-value" style="color: #64748B">58 days</div>
</div>
<div class="lightbox-stat">
    <div class="lightbox-stat-label">Difference</div>
    <div class="lightbox-stat-value" style="color: #00ff7f">-1 days</div>
</div>
```

#### Color Coding System
- **Green (`#00ff7f`)**: Metro is faster than national (negative difference)
- **Red (`#ff6b6b`)**: Metro is slower than national (positive difference)

### Key Benefits

1. **Intuitive Interpretation**: Days are universally understood units
2. **No Mathematical Transformation**: Direct comparison without indexing
3. **Immediate Insights**: Positive/negative difference shows performance clearly
4. **Consistent Methodology**: Uses same 5-year dynamic window as other metrics
5. **Visual Clarity**: Dual-line chart shows trends and current performance

### Integration with Existing System

#### Metric Detection Logic
```javascript
// For median days on market in metro areas, show comparison with national
if (metric === 'median_days_on_market' && isMetro && data.cbsa_code) {
    // Use direct comparison approach
    const response = await fetch(`${API_BASE_URL}/median-days/metro/${data.cbsa_code}`);
    // Render comparison chart
} else if (supportsIndexed && data.cbsa_code) {
    // Use indexed performance for other metrics
}
```

#### Function Implementation
- `renderMedianDaysComparisonChart()`: Handles Chart.js visualization
- `populateMedianDaysStats()`: Displays comparison statistics
- Integrated seamlessly with existing lightbox system

### Scalability

This methodology can be easily extended to:
- **State-level comparisons**: State vs National median days
- **County-level analysis**: County vs State/National benchmarks
- **Time period variations**: 3-year, 10-year comparison windows
- **Seasonal analysis**: Month-over-month comparisons within years

## Manual Update
- Remember that I updated the triangle and square modifiers to the metro view to 0 so I could test functionality. This happened at lines 582 - 583 in app_working.js
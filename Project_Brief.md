# Real Estate Beta Dashboard - Project Brief

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

## Manual Update
- Remember that I updated the triangle and square modifiers to the metro view to 0 so I could test functionality. This happened at lines 582 - 583 in app_working.js
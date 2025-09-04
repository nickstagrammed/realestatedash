# Real Estate Beta Dashboard

A single-page web application that analyzes real estate market data using beta calculations to understand how local markets correlate with national trends.

## 🚀 Quick Start

### Option 1: Using Python Server (Recommended)
```bash
python serve.py
```
Then open: http://localhost:8000

### Option 2: Using Node.js (if you have it)
```bash
npx serve .
```

### Option 3: Using any HTTP server
The app needs to be served via HTTP to load CSV files (not file://)

## 📊 Features

- **Interactive US Map** with state-level real estate data
- **Beta Analysis** - 5-year, 3-year, and 1-year market correlations
- **Multiple Metrics**:
  - Active Listings Count
  - New Listings Count  
  - Pending Listings Count
  - Median Listing Price
- **Real-time Data** from realtor.com CSV exports
- **Hover & Click Interactions** for detailed market analysis

## 📁 Project Structure

```
RealEstateDashboard/
├── index.html          # Main application
├── app.js              # Core application logic  
├── dataProcessor.js    # CSV parsing & beta calculations
├── testData.js         # Fallback test data
├── styles.css          # Styling
├── serve.py            # HTTP server
├── data/
│   ├── national_data.csv    # National market data
│   └── state_data.csv       # State-level market data
└── README.md
```

## 💾 Data Format

The app expects CSV files from realtor.com with these key columns:
- `month_date_yyyymm` - Date in YYYYMM format
- `active_listing_count` - Active listings
- `new_listing_count` - New listings 
- `pending_listing_count` - Pending listings
- `*_mm` - Month-over-month changes
- `*_yy` - Year-over-year changes

## 🔧 Technical Details

- **Frontend**: Vanilla JavaScript, Leaflet.js for mapping
- **Data Processing**: Client-side CSV parsing and beta calculations
- **Beta Formula**: Covariance(Local Returns, National Returns) / Variance(National Returns)
- **Fallback**: Test data when CSV files can't be loaded

## 🎨 Beta Color Scale

- **Blue (< 0.5)**: Less volatile than national market
- **Light Blue (0.5-0.8)**: Moderately correlated
- **Gray (0.8-1.2)**: Similar to national market  
- **Orange (1.2-1.5)**: More volatile than national
- **Red (> 1.5)**: Highly volatile market

## 🛠️ Troubleshooting

**"Failed to load data" error?**
- Use the Python server: `python serve.py`
- Don't open index.html directly (file:// won't work)

**No data showing?**
- Check that CSV files are in the `data/` folder
- Verify CSV format matches realtor.com exports
- App will show test data as fallback

## 📈 Future Enhancements

- Metro-level and county-level drill-down
- Time-series charts
- Automated data updates
- Advanced statistical analysis
- Export functionality
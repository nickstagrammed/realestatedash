import json
import os
from pathlib import Path

def split_counties_by_state():
    """Split the large county boundaries file into individual state files"""
    
    # State FIPS to name mapping
    fips_to_state = {
        '01': 'alabama', '02': 'alaska', '04': 'arizona', '05': 'arkansas', '06': 'california',
        '08': 'colorado', '09': 'connecticut', '10': 'delaware', '12': 'florida', '13': 'georgia',
        '15': 'hawaii', '16': 'idaho', '17': 'illinois', '18': 'indiana', '19': 'iowa',
        '20': 'kansas', '21': 'kentucky', '22': 'louisiana', '23': 'maine', '24': 'maryland',
        '25': 'massachusetts', '26': 'michigan', '27': 'minnesota', '28': 'mississippi', '29': 'missouri',
        '30': 'montana', '31': 'nebraska', '32': 'nevada', '33': 'newhampshire', '34': 'newjersey',
        '35': 'newmexico', '36': 'newyork', '37': 'northcarolina', '38': 'northdakota', '39': 'ohio',
        '40': 'oklahoma', '41': 'oregon', '42': 'pennsylvania', '44': 'rhodeisland', '45': 'southcarolina',
        '46': 'southdakota', '47': 'tennessee', '48': 'texas', '49': 'utah', '50': 'vermont',
        '51': 'virginia', '53': 'washington', '54': 'westvirginia', '55': 'wisconsin', '56': 'wyoming'
    }
    
    print("Loading county boundaries file...")
    with open('county_boundaries.json', 'r') as f:
        data = json.load(f)
    
    print(f"Processing {len(data['features'])} counties...")
    
    # Create counties directory
    counties_dir = Path('counties')
    counties_dir.mkdir(exist_ok=True)
    
    # Group counties by state
    state_counties = {}
    for feature in data['features']:
        state_fips = feature['properties']['STATE']
        state_name = fips_to_state.get(state_fips)
        
        if state_name:
            if state_name not in state_counties:
                state_counties[state_name] = {
                    "type": "FeatureCollection",
                    "features": []
                }
            state_counties[state_name]['features'].append(feature)
    
    # Save individual state files
    print(f"Creating {len(state_counties)} state files...")
    total_size_before = os.path.getsize('county_boundaries.json')
    total_size_after = 0
    
    for state_name, state_data in state_counties.items():
        filename = counties_dir / f'{state_name}_counties.json'
        with open(filename, 'w') as f:
            json.dump(state_data, f, separators=(',', ':'))  # Compact JSON
        
        file_size = os.path.getsize(filename)
        total_size_after += file_size
        county_count = len(state_data['features'])
        
        print(f"  {state_name.title()}: {county_count} counties, {file_size/1024:.1f}KB")
    
    print(f"\nSummary:")
    print(f"  Original file: {total_size_before/1024/1024:.1f}MB")
    print(f"  Split files total: {total_size_after/1024/1024:.1f}MB")
    print(f"  Average per state: {(total_size_after/len(state_counties))/1024:.1f}KB")
    print(f"  Largest state file: {max(os.path.getsize(counties_dir / f) for f in os.listdir(counties_dir))/1024:.1f}KB")

if __name__ == "__main__":
    split_counties_by_state()
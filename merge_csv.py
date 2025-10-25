#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Merge purines_no.csv into purine_data.json
Handles duplicates by keeping existing JSON data
Auto-categorizes new entries
"""

import csv
import json
import re
from difflib import SequenceMatcher

def normalize_name(name):
    """Normalize name for comparison (lowercase, remove special chars)"""
    return re.sub(r'[^a-zæøå]', '', name.lower())

def similarity(a, b):
    """Calculate similarity ratio between two strings"""
    return SequenceMatcher(None, normalize_name(a), normalize_name(b)).ratio()

def is_duplicate(csv_entry, json_data):
    """
    Check if CSV entry is a duplicate of existing JSON entry
    Returns (is_duplicate, matching_json_entry) tuple
    """
    csv_name = csv_entry['name']
    csv_total = csv_entry['total_purines']

    for json_entry in json_data:
        json_name = json_entry['name']
        json_total = json_entry.get('total_purines', 0)

        # Check name similarity (threshold: 0.7 = 70% similar)
        name_sim = similarity(csv_name, json_name)

        # Check if total purines are within 5% of each other
        if json_total > 0:
            purine_diff = abs(csv_total - json_total) / json_total
        else:
            purine_diff = 1.0

        # Consider it a duplicate if names are very similar OR (somewhat similar + purine values close)
        if name_sim > 0.85 or (name_sim > 0.6 and purine_diff < 0.05):
            return True, json_entry

    return False, None

def categorize_food(matvarer, del_field):
    """
    Auto-categorize food based on Norwegian name
    """
    matvarer_lower = matvarer.lower()
    del_lower = (del_field or "").lower()

    # Vegetables
    vegetables = ['asparges', 'avokado', 'bittermelon', 'bambusskudd', 'bønnespirer',
                  'brokkoli', 'kål', 'gulrot', 'blomkål', 'tomat', 'mais', 'agurk',
                  'aubergine', 'hvitløk', 'gressløk', 'ingefær', 'paprika', 'okra',
                  'purre', 'gresskar', 'komatsuna', 'løk', 'persille', 'perilla',
                  'potet', 'spinat', 'spirer', 'søtpotet', 'reddik', 'squash', 'kinakål']

    for veg in vegetables:
        if veg in matvarer_lower:
            return "Grønnsaker"

    # Beef
    if 'storfe' in matvarer_lower or 'okse' in matvarer_lower:
        # Organs
        if any(organ in del_lower for organ in ['hjerte', 'nyre', 'lever', 'tarm', 'tunge', 'kråse']):
            return "Okse - Innmat"
        else:
            return "Okse - Kjøtt"

    # Chicken
    if 'kylling' in matvarer_lower:
        if any(organ in del_lower for organ in ['hjerte', 'lever', 'kråse']):
            return "Kylling - Innmat"
        else:
            return "Kylling - Kjøtt"

    # Pork
    if 'svine' in matvarer_lower or 'svin' in matvarer_lower:
        if any(organ in del_lower for organ in ['hjerte', 'nyre', 'lever']):
            return "Svin - Innmat"
        else:
            return "Svin - Kjøtt"

    # Lamb
    if 'fåre' in matvarer_lower or 'lam' in matvarer_lower:
        return "Lam"

    # Processed meats
    processed = ['bacon', 'skinke', 'pølse', 'postei', 'corned beef', 'salami', 'prosciutto']
    if any(proc in matvarer_lower for proc in processed):
        return "Bearbeidet kjøtt"

    # Horse
    if 'hest' in matvarer_lower:
        return "Hest"

    # Whale
    if 'hval' in matvarer_lower:
        return "Hval"

    # Default
    return "Annet"

def parse_csv_value(value):
    """Parse CSV value, handling ND and empty strings"""
    if not value or value.strip() == '' or value.strip().upper() == 'ND':
        return 0.0
    try:
        return float(value.replace(',', '.'))
    except ValueError:
        return 0.0

def main():
    print("=" * 70)
    print("MERGING purines_no.csv INTO purine_data.json")
    print("=" * 70)

    # Load existing JSON
    print("\n[1/5] Loading existing JSON data...")
    with open('purine_data.json', 'r', encoding='utf-8') as f:
        existing_data = json.load(f)
    print(f"   OK Loaded {len(existing_data)} existing entries")

    # Read CSV
    print("\n[2/5] Reading CSV file...")
    csv_entries = []
    with open('purines_no.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            matvarer = row['Matvarer'].strip()
            del_field = row['Del'].strip() if row['Del'] else ""

            # Create name and preparation
            if del_field:
                name = f"{matvarer} - {del_field}"
                preparation = del_field.lower()
            else:
                name = matvarer
                preparation = "rå"

            # Parse values
            entry = {
                'name': name,
                'preparation': preparation,
                'category': categorize_food(matvarer, del_field),
                'adenine': parse_csv_value(row['Adenin']),
                'guanine': parse_csv_value(row['Guanin']),
                'hypoxanthine': parse_csv_value(row['Hypoxantin']),
                'xanthine': parse_csv_value(row['Xantin']),
                'total_purines': parse_csv_value(row['Total']),
                'uric_acid': parse_csv_value(row['Beregnet som urinsyre']),
                'serving': 100
            }
            csv_entries.append(entry)

    print(f"   OK Read {len(csv_entries)} CSV entries")

    # Detect duplicates
    print("\n[3/5] Detecting duplicates...")
    duplicates = []
    new_entries = []

    for csv_entry in csv_entries:
        is_dup, matching_entry = is_duplicate(csv_entry, existing_data)
        if is_dup:
            duplicates.append({
                'csv_name': csv_entry['name'],
                'json_name': matching_entry['name'],
                'csv_total': csv_entry['total_purines'],
                'json_total': matching_entry['total_purines']
            })
        else:
            new_entries.append(csv_entry)

    print(f"   OK Found {len(duplicates)} duplicates (will keep existing JSON data)")
    print(f"   OK Found {len(new_entries)} new entries (will add to JSON)")

    # Merge data
    print("\n[4/5] Merging data...")
    merged_data = existing_data + new_entries
    print(f"   OK Merged data: {len(existing_data)} existing + {len(new_entries)} new = {len(merged_data)} total")

    # Save merged data
    print("\n[5/5] Saving results...")

    # Backup original
    import shutil
    shutil.copy('purine_data.json', 'purine_data.json.backup')
    print(f"   OK Backed up original to purine_data.json.backup")

    # Save merged data
    with open('purine_data.json', 'w', encoding='utf-8') as f:
        json.dump(merged_data, f, ensure_ascii=False, indent=2)
    print(f"   OK Saved merged data to purine_data.json")

    # Generate report
    report = []
    report.append("=" * 70)
    report.append("MERGE REPORT")
    report.append("=" * 70)
    report.append("")
    report.append(f"CSV entries processed:    {len(csv_entries)}")
    report.append(f"Duplicates found:         {len(duplicates)}")
    report.append(f"New entries added:        {len(new_entries)}")
    report.append(f"Total entries in JSON:    {len(merged_data)}")
    report.append("")
    report.append("=" * 70)
    report.append("DUPLICATES (kept existing JSON data):")
    report.append("=" * 70)
    for dup in duplicates:
        report.append(f"  CSV: {dup['csv_name']} (total: {dup['csv_total']:.1f})")
        report.append(f"  ≈ JSON: {dup['json_name']} (total: {dup['json_total']:.1f})")
        report.append("")

    report.append("=" * 70)
    report.append("NEW ENTRIES ADDED:")
    report.append("=" * 70)

    # Group by category
    by_category = {}
    for entry in new_entries:
        cat = entry['category']
        if cat not in by_category:
            by_category[cat] = []
        by_category[cat].append(entry)

    for category in sorted(by_category.keys()):
        report.append(f"\n{category}:")
        for entry in sorted(by_category[category], key=lambda x: x['name']):
            report.append(f"  - {entry['name']} (total: {entry['total_purines']:.1f} mg/100g)")

    report_text = "\n".join(report)

    with open('merge_report.txt', 'w', encoding='utf-8') as f:
        f.write(report_text)
    print(f"   OK Saved report to merge_report.txt")

    print("\n" + "=" * 70)
    print("MERGE COMPLETE!")
    print("=" * 70)
    print(f"\nSummary:")
    print(f"  - Original entries: {len(existing_data)}")
    print(f"  - New entries added: {len(new_entries)}")
    print(f"  - Duplicates skipped: {len(duplicates)}")
    print(f"  - Total entries: {len(merged_data)}")
    print(f"\nFiles created:")
    print(f"  - purine_data.json (merged data)")
    print(f"  - purine_data.json.backup (original backup)")
    print(f"  - merge_report.txt (detailed report)")
    print()

if __name__ == '__main__':
    main()

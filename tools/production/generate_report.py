
import os
from pathlib import Path
from datetime import datetime

WP_DIR = Path("docs/whitepaper")
OUTPUT_FILE = Path("APEX_SYSTEM_AUDIT_V2.5_ELITE.md")

# Order the chapters
CHAPTERS = [
    "01_introduction.md",
    "02_architecture.md",
    "03_data_ingestion.md",
    "04_smc_engine.md",
    "05_machine_learning.md",
    "06_risk_blockchain.md",
    "07_reliability.md",
    "08_conclusion.md"
]

def generate():
    print(f"📖 Generating Comprehensive System Audit Report...")
    
    report_content = []
    
    # 1. Add Cover Page
    report_content.append("# 🌌 APEX Trade AI: Institutional Intelligence OS")
    report_content.append("*Comprehensive System Audit & Architectural Whitepaper*")
    report_content.append(f"\n**Version:** 2.5.0 Elite")
    report_content.append(f"**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    report_content.append(f"**Author:** Aditya | APEX Intelligence Engine")
    report_content.append("\n---\n")
    report_content.append("\n<div style='page-break-after: always;'></div>\n")
    
    # 2. Add Table of Contents
    report_content.append("## 📋 Table of Contents\n")
    for ch in CHAPTERS:
        title = ch.replace("_", " ").replace(".md", "").title()
        report_content.append(f"- {title}")
    report_content.append("\n---\n")
    report_content.append("\n<div style='page-break-after: always;'></div>\n")
    
    # 3. Concatenate Chapters
    for i, ch in enumerate(CHAPTERS):
        ch_path = WP_DIR / ch
        if not ch_path.exists():
            print(f"⚠️ Warning: Missing chapter {ch}")
            continue
            
        print(f"  + Adding {ch}...")
        with open(ch_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
            # Remove redundant headers if any, or just add a clear separator
            report_content.append(content)
            
            # Add page break between chapters (for PDF export)
            if i < len(CHAPTERS) - 1:
                report_content.append("\n\n---\n")
                report_content.append("\n<div style='page-break-after: always;'></div>\n")

    # 4. Save Final Report
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        f.write("\n\n".join(report_content))
    
    print(f"✨ SUCCESS! Final report generated at: {OUTPUT_FILE}")
    print(f"💡 TIP: You can now open this file and 'Export to PDF' for your submission.")

if __name__ == "__main__":
    generate()

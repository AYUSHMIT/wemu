#!/usr/bin/env python3
"""
WeMu Trace Visualizer
=====================

Generates HTML visualizations and Mermaid diagrams from WeMu execution traces.

Usage:
    python generate_trace_viz.py <log_file> [--output <output_dir>] [--format <format>]

Examples:
    # Generate HTML visualization
    python generate_trace_viz.py output/gitm_and/emulation_log.txt

    # Generate Mermaid diagram only
    python generate_trace_viz.py output/flexo_simon32/emulation_log.txt --format mermaid

    # Specify custom output directory
    python generate_trace_viz.py log.txt --output ./visualizations/

"""

import os
import sys
import json
import re
import argparse
from pathlib import Path
from typing import List, Dict, Tuple, Optional
from datetime import datetime


class ExecutionTrace:
    """Represents a parsed execution trace."""
    
    def __init__(self):
        self.instructions = []
        self.cache_events = []
        self.rsb_events = []
        self.metadata = {}
        
    def add_instruction(self, addr: int, insn: str, state: str):
        """Add an instruction to the trace."""
        self.instructions.append({
            'address': addr,
            'instruction': insn,
            'state': state
        })
    
    def add_cache_event(self, addr: int, event_type: str):
        """Add a cache event (hit/miss/write)."""
        self.cache_events.append({
            'address': addr,
            'type': event_type
        })
    
    def add_rsb_event(self, addr: int, event_type: str):
        """Add an RSB event (push/pop/predict)."""
        self.rsb_events.append({
            'address': addr,
            'type': event_type
        })


class TraceParser:
    """Parses WeMu log files into structured trace data."""
    
    def __init__(self, log_file: str):
        self.log_file = log_file
        self.trace = ExecutionTrace()
        
    def parse(self) -> ExecutionTrace:
        """Parse the log file and return an ExecutionTrace object."""
        if not os.path.exists(self.log_file):
            raise FileNotFoundError(f"Log file not found: {self.log_file}")
        
        with open(self.log_file, 'r') as f:
            lines = f.readlines()
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # Parse instruction execution
            if re.match(r'\[0x[0-9a-fA-F]+\]', line):
                self._parse_instruction(line)
            
            # Parse cache events
            elif 'Cache' in line:
                self._parse_cache_event(line)
            
            # Parse RSB events
            elif 'RSB' in line:
                self._parse_rsb_event(line)
            
            # Parse metadata
            elif line.startswith('Starting emulation'):
                self._parse_metadata(line)
        
        return self.trace
    
    def _parse_instruction(self, line: str):
        """Parse an instruction line."""
        # Format: [0x401106] xor rdx, rdx
        # or: [TRANSIENT] [0x401109] div dl
        
        state = 'committed'
        if '[TRANSIENT]' in line:
            state = 'transient'
            line = line.replace('[TRANSIENT]', '').strip()
        elif '[SPECULATIVE]' in line:
            state = 'speculative'
            line = line.replace('[SPECULATIVE]', '').strip()
        elif '[FAULTING]' in line:
            state = 'faulting'
            line = line.replace('[FAULTING]', '').strip()
        
        match = re.match(r'\[0x([0-9a-fA-F]+)\]\s+(.+)', line)
        if match:
            addr = int(match.group(1), 16)
            insn = match.group(2).strip()
            self.trace.add_instruction(addr, insn, state)
    
    def _parse_cache_event(self, line: str):
        """Parse a cache event line."""
        # Format: Cache HIT at 0x404040
        # or: Cache MISS at 0x404050
        # or: Cache WRITE at 0x404060
        
        match = re.search(r'Cache\s+(HIT|MISS|WRITE)\s+at\s+0x([0-9a-fA-F]+)', line)
        if match:
            event_type = match.group(1).lower()
            addr = int(match.group(2), 16)
            self.trace.add_cache_event(addr, event_type)
    
    def _parse_rsb_event(self, line: str):
        """Parse an RSB event line."""
        # Format: RSB PUSH: 0x401205
        # or: RSB POP: 0x401205
        # or: RSB PREDICT: 0x401205
        
        match = re.search(r'RSB\s+(PUSH|POP|PREDICT):\s+0x([0-9a-fA-F]+)', line)
        if match:
            event_type = match.group(1).lower()
            addr = int(match.group(2), 16)
            self.trace.add_rsb_event(addr, event_type)
    
    def _parse_metadata(self, line: str):
        """Parse metadata from the log."""
        # Format: Starting emulation of gitm_and with bits=(1, 1) ...
        
        match = re.search(r'Starting emulation of (\w+)', line)
        if match:
            self.trace.metadata['name'] = match.group(1)
        
        match = re.search(r'with bits=\(([^)]+)\)', line)
        if match:
            self.trace.metadata['inputs'] = match.group(1)


class MermaidGenerator:
    """Generates Mermaid flowchart diagrams from execution traces."""
    
    def __init__(self, trace: ExecutionTrace):
        self.trace = trace
    
    def generate(self) -> str:
        """Generate a Mermaid flowchart diagram."""
        lines = ['graph TD']
        
        # Add nodes for each instruction
        prev_node = None
        for i, insn in enumerate(self.trace.instructions):
            node_id = f"N{i}"
            label = f"{hex(insn['address'])}: {insn['instruction']}"
            
            # Color based on state
            style = self._get_style_for_state(insn['state'])
            lines.append(f"    {node_id}[\"{label}\"]")
            lines.append(f"    style {node_id} {style}")
            
            # Add edge from previous node
            if prev_node:
                lines.append(f"    {prev_node} --> {node_id}")
            
            prev_node = node_id
        
        return '\n'.join(lines)
    
    def _get_style_for_state(self, state: str) -> str:
        """Get Mermaid style for an instruction state."""
        styles = {
            'committed': 'fill:#10b981',
            'transient': 'fill:#fbbf24',
            'speculative': 'fill:#f97316',
            'faulting': 'fill:#ef4444'
        }
        return styles.get(state, 'fill:#94a3b8')


class HTMLGenerator:
    """Generates interactive HTML visualizations from execution traces."""
    
    def __init__(self, trace: ExecutionTrace):
        self.trace = trace
    
    def generate(self) -> str:
        """Generate a complete HTML visualization."""
        mermaid_gen = MermaidGenerator(self.trace)
        flowchart = mermaid_gen.generate()
        
        html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WeMu Trace Visualization - {self.trace.metadata.get('name', 'Unknown')}</title>
    <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            margin: 0;
            padding: 20px;
            background: #f8fafc;
            color: #1e293b;
        }}
        .container {{
            max-width: 1200px;
            margin: 0 auto;
        }}
        h1 {{
            color: #667eea;
            margin-bottom: 10px;
        }}
        .metadata {{
            background: white;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }}
        .section {{
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }}
        .section h2 {{
            margin-top: 0;
            color: #334155;
        }}
        .timeline {{
            display: flex;
            gap: 10px;
            overflow-x: auto;
            padding: 10px 0;
        }}
        .timeline-item {{
            min-width: 120px;
            padding: 10px;
            border-radius: 6px;
            border: 2px solid #e2e8f0;
            text-align: center;
        }}
        .timeline-item.committed {{ border-color: #10b981; background: rgba(16,185,129,0.1); }}
        .timeline-item.transient {{ border-color: #fbbf24; background: rgba(251,191,36,0.1); }}
        .timeline-item.speculative {{ border-color: #f97316; background: rgba(249,115,22,0.1); }}
        .timeline-item.faulting {{ border-color: #ef4444; background: rgba(239,68,68,0.1); }}
        .cache-list, .rsb-list {{
            list-style: none;
            padding: 0;
        }}
        .cache-list li, .rsb-list li {{
            padding: 8px 12px;
            margin: 5px 0;
            background: #f1f5f9;
            border-radius: 4px;
            display: flex;
            justify-content: space-between;
        }}
        .cache-list li.hit {{ background: rgba(16,185,129,0.1); border-left: 3px solid #10b981; }}
        .cache-list li.miss {{ background: rgba(239,68,68,0.1); border-left: 3px solid #ef4444; }}
        .cache-list li.write {{ background: rgba(102,126,234,0.1); border-left: 3px solid #667eea; }}
        .flowchart-container {{
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            overflow-x: auto;
        }}
        .legend {{
            display: flex;
            gap: 20px;
            margin-top: 20px;
            flex-wrap: wrap;
        }}
        .legend-item {{
            display: flex;
            align-items: center;
            gap: 8px;
        }}
        .legend-color {{
            width: 24px;
            height: 24px;
            border-radius: 4px;
        }}
    </style>
</head>
<body>
    <div class="container">
        <h1>WeMu Execution Trace Visualization</h1>
        
        <div class="metadata">
            <strong>µWM Name:</strong> {self.trace.metadata.get('name', 'Unknown')}<br>
            <strong>Inputs:</strong> {self.trace.metadata.get('inputs', 'N/A')}<br>
            <strong>Total Instructions:</strong> {len(self.trace.instructions)}<br>
            <strong>Transient Instructions:</strong> {sum(1 for i in self.trace.instructions if i['state'] == 'transient')}<br>
            <strong>Cache Events:</strong> {len(self.trace.cache_events)}<br>
            <strong>RSB Events:</strong> {len(self.trace.rsb_events)}
        </div>
        
        <div class="section">
            <h2>Execution Timeline</h2>
            <div class="timeline">
                {self._generate_timeline()}
            </div>
            <div class="legend">
                <div class="legend-item">
                    <div class="legend-color" style="background: #10b981;"></div>
                    <span>Committed</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color" style="background: #fbbf24;"></div>
                    <span>Transient</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color" style="background: #f97316;"></div>
                    <span>Speculative</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color" style="background: #ef4444;"></div>
                    <span>Faulting</span>
                </div>
            </div>
        </div>
        
        <div class="section">
            <h2>Control Flow Graph</h2>
            <div class="flowchart-container">
                <pre class="mermaid">
{flowchart}
                </pre>
            </div>
        </div>
        
        <div class="section">
            <h2>Cache Events</h2>
            <ul class="cache-list">
                {self._generate_cache_events()}
            </ul>
        </div>
        
        <div class="section">
            <h2>RSB Events</h2>
            <ul class="rsb-list">
                {self._generate_rsb_events()}
            </ul>
        </div>
    </div>
    
    <script>
        mermaid.initialize({{ startOnLoad: true, theme: 'default' }});
    </script>
</body>
</html>"""
        
        return html
    
    def _generate_timeline(self) -> str:
        """Generate HTML for the timeline view."""
        html_parts = []
        for i, insn in enumerate(self.trace.instructions):
            html_parts.append(f"""
                <div class="timeline-item {insn['state']}" title="{insn['instruction']}">
                    <div style="font-size: 0.75rem; color: #64748b;">Step {i+1}</div>
                    <div style="font-weight: 600; margin: 4px 0;">{hex(insn['address'])}</div>
                    <div style="font-size: 0.875rem;">{insn['state']}</div>
                </div>
            """)
        return ''.join(html_parts) if html_parts else '<p>No instructions recorded</p>'
    
    def _generate_cache_events(self) -> str:
        """Generate HTML for cache events."""
        html_parts = []
        for event in self.trace.cache_events:
            html_parts.append(f"""
                <li class="{event['type']}">
                    <span><strong>Address:</strong> {hex(event['address'])}</span>
                    <span style="text-transform: uppercase;">{event['type']}</span>
                </li>
            """)
        return ''.join(html_parts) if html_parts else '<li>No cache events recorded</li>'
    
    def _generate_rsb_events(self) -> str:
        """Generate HTML for RSB events."""
        html_parts = []
        for event in self.trace.rsb_events:
            html_parts.append(f"""
                <li>
                    <span><strong>Address:</strong> {hex(event['address'])}</span>
                    <span style="text-transform: uppercase;">{event['type']}</span>
                </li>
            """)
        return ''.join(html_parts) if html_parts else '<li>No RSB events recorded</li>'


class JSONExporter:
    """Exports trace data to JSON format."""
    
    def __init__(self, trace: ExecutionTrace):
        self.trace = trace
    
    def export(self) -> str:
        """Export trace as JSON."""
        data = {
            'metadata': self.trace.metadata,
            'instructions': self.trace.instructions,
            'cache_events': [
                {'address': hex(e['address']), 'type': e['type']}
                for e in self.trace.cache_events
            ],
            'rsb_events': [
                {'address': hex(e['address']), 'type': e['type']}
                for e in self.trace.rsb_events
            ],
            'statistics': {
                'total_instructions': len(self.trace.instructions),
                'transient_instructions': sum(1 for i in self.trace.instructions if i['state'] == 'transient'),
                'cache_events': len(self.trace.cache_events),
                'rsb_events': len(self.trace.rsb_events)
            }
        }
        return json.dumps(data, indent=2)


def main():
    parser = argparse.ArgumentParser(
        description='Generate visualizations from WeMu execution traces',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__
    )
    parser.add_argument('log_file', help='Path to WeMu log file')
    parser.add_argument('--output', '-o', default='./trace_viz',
                       help='Output directory (default: ./trace_viz)')
    parser.add_argument('--format', '-f', choices=['html', 'mermaid', 'json', 'all'],
                       default='all', help='Output format (default: all)')
    
    args = parser.parse_args()
    
    # Parse the log file
    print(f"Parsing log file: {args.log_file}")
    parser_obj = TraceParser(args.log_file)
    trace = parser_obj.parse()
    
    # Create output directory
    output_dir = Path(args.output)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Generate base filename
    log_name = Path(args.log_file).stem
    base_name = f"{log_name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    
    # Generate requested formats
    if args.format in ['html', 'all']:
        html_gen = HTMLGenerator(trace)
        html_content = html_gen.generate()
        html_file = output_dir / f"{base_name}.html"
        html_file.write_text(html_content)
        print(f"✓ Generated HTML: {html_file}")
    
    if args.format in ['mermaid', 'all']:
        mermaid_gen = MermaidGenerator(trace)
        mermaid_content = mermaid_gen.generate()
        mermaid_file = output_dir / f"{base_name}.mmd"
        mermaid_file.write_text(mermaid_content)
        print(f"✓ Generated Mermaid: {mermaid_file}")
    
    if args.format in ['json', 'all']:
        json_exporter = JSONExporter(trace)
        json_content = json_exporter.export()
        json_file = output_dir / f"{base_name}.json"
        json_file.write_text(json_content)
        print(f"✓ Generated JSON: {json_file}")
    
    print(f"\n📊 Trace Statistics:")
    print(f"   Total Instructions: {len(trace.instructions)}")
    print(f"   Transient Instructions: {sum(1 for i in trace.instructions if i['state'] == 'transient')}")
    print(f"   Cache Events: {len(trace.cache_events)}")
    print(f"   RSB Events: {len(trace.rsb_events)}")


if __name__ == '__main__':
    main()

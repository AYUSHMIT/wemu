# WeMu Interactive Demo

Welcome to the WeMu interactive demo! This directory contains a browser-based visualization tool for exploring Microarchitectural Weird Machines.

## 🎮 Quick Start

### Option 1: Open Directly

Simply open `index.html` in your web browser:

```bash
# From repository root
firefox demo/index.html
# or
chrome demo/index.html
# or
open demo/index.html  # macOS
```

### Option 2: Local Server (Recommended)

For best results, serve via HTTP:

```bash
# Python 3
cd demo
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000

# Node.js
npx http-server -p 8000

# Then open: http://localhost:8000
```

## 📁 Directory Structure

```
demo/
├── index.html          # Main demo page
├── styles.css          # Styling and animations
├── visualizer.js       # Execution visualization logic
├── data/
│   └── examples.json   # Pre-loaded µWM examples
└── assets/             # Additional resources (images, etc.)
```

## ✨ Features

### 🎯 Interactive Playground
- Select from 24 pre-built µWM examples
- Adjust input bits with toggle buttons
- Run emulations and see immediate results
- Real-time output display

### 📊 Execution Visualizer
- **Timeline View** - Step-by-step instruction execution
- **Cache State** - Visual representation of cached addresses
- **RSB Stack** - Return Stack Buffer operations
- **Control Flow** - Mermaid diagrams showing execution paths

### 🎨 Themes
- Light and dark modes
- Persistent preference (localStorage)
- Smooth transitions

### 📱 Responsive Design
- Works on desktop, tablet, and mobile
- Adaptive layouts for all screen sizes
- Touch-friendly controls

## 🔧 Customization

### Adding Custom Examples

Edit `data/examples.json` to add your own µWM:

```json
{
  "id": "custom-gate",
  "name": "Custom Gate",
  "category": "CUSTOM",
  "description": "Your custom µWM implementation",
  "code_snippet": "xor rdx, rdx\ndiv dl\n...",
  "inputs": 2,
  "expected_outputs": {
    "0,0": 0,
    "1,1": 1
  }
}
```

### Modifying Visualizations

The `visualizer.js` file contains all visualization logic:

- **`loadExample()`** - Loads and displays example code
- **`runEmulation()`** - Simulates µWM execution
- **`updateTimeline()`** - Renders execution timeline
- **`updateCacheVisualization()`** - Shows cache state
- **`updateRSBVisualization()`** - Displays RSB stack

### Styling

Customize appearance by editing CSS variables in `styles.css`:

```css
:root {
    --accent-primary: #667eea;  /* Change primary color */
    --bg-primary: #ffffff;       /* Background color */
    /* ... more variables ... */
}
```

## 🐛 Troubleshooting

### Demo Doesn't Load

**Problem:** Blank page or errors

**Solutions:**
1. Check browser console (F12) for errors
2. Ensure all files are in correct locations
3. Try serving via HTTP instead of opening directly
4. Clear browser cache (Ctrl+Shift+R)

### Visualizations Not Updating

**Problem:** Static displays, no animations

**Solutions:**
1. Verify JavaScript is enabled
2. Check CDN connectivity (Mermaid.js, Prism.js)
3. Disable browser extensions that might interfere
4. Try a different browser

### Mermaid Diagrams Not Rendering

**Problem:** Flowcharts show as plain text

**Solutions:**
1. Check internet connection (CDN required)
2. Wait a few seconds for CDN to load
3. Refresh the page
4. Check browser console for errors

## 📚 Documentation

- **[DEMO.md](../DEMO.md)** - Comprehensive demo guide
- **[Tutorials](../examples/tutorials/)** - Step-by-step learning
- **[README.md](../README.md)** - Main project documentation

## 🌐 Browser Compatibility

Tested and supported browsers:
- ✅ Chrome/Chromium 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

**Note:** Older browsers may have limited support for modern CSS/JS features.

## 🔒 Privacy

The demo runs entirely in your browser:
- ✅ No data sent to external servers
- ✅ No tracking or analytics
- ✅ localStorage only for theme preference
- ✅ CDN libraries loaded from trusted sources (cdnjs, jsdelivr)

## 🤝 Contributing

Want to improve the demo? We welcome contributions!

**Ideas:**
- Add more visualization types
- Improve mobile responsiveness
- Create animated tutorials
- Add more example µWMs
- Enhance accessibility

See [Contributing Guide](../CONTRIBUTING.md) for details.

## 📞 Support

- **Issues:** [GitHub Issues](https://github.com/AYUSHMIT/wemu/issues)
- **Discussions:** [GitHub Discussions](https://github.com/AYUSHMIT/wemu/discussions)
- **Documentation:** [DEMO.md](../DEMO.md)

---

**Enjoy exploring µWMs!** 🚀

For a deeper dive, check out the [complete tutorials](../examples/tutorials/) or [run WeMu locally](../README.md#quick-start).

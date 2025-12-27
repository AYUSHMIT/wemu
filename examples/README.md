# WeMu Examples & Tutorials

This directory contains educational resources and example implementations for learning about Microarchitectural Weird Machines (µWMs).

## 📚 Tutorials

Progressive learning path from beginner to advanced:

### 1. [Building Your First µWM](tutorials/01-basic-and-gate.md)
**Difficulty:** Beginner | **Time:** 15-20 minutes

Learn the fundamentals by implementing a simple AND gate using exception-based transient execution (GITM framework).

**What you'll learn:**
- Basic µWM concepts
- Cache side-effect encoding
- Exception-based transient execution
- Testing with WeMu

### 2. [RSB-Based Cryptography](tutorials/02-rsb-crypto.md)
**Difficulty:** Intermediate | **Time:** 30-40 minutes

Understand how FLEXO implements Simon32 encryption using Return Stack Buffer manipulation.

**What you'll learn:**
- RSB prediction mechanisms
- FLEXO framework architecture
- Cryptographic primitives as µWMs
- Performance analysis

### 3. [Creating Custom µWMs](tutorials/03-custom-muwm.md)
**Difficulty:** Advanced | **Time:** 45-60 minutes

Master the art of designing your own microarchitectural weird machines from scratch.

**What you'll learn:**
- Custom µWM design methodology
- Integration with WeMu framework
- Debugging strategies
- Research applications

## 🚀 Getting Started

**Prerequisites:**
- Completed [Quick Start](../README.md#quick-start) setup
- Basic understanding of x86-64 assembly
- Familiarity with CPU microarchitecture concepts

**Recommended Path:**
1. Try the [Interactive Demo](../demo/index.html) first
2. Follow tutorials in order (1 → 2 → 3)
3. Read [DEMO.md](../DEMO.md) for comprehensive documentation
4. Experiment with custom implementations

## 📖 Additional Resources

- **[Main README](../README.md)** - Project overview and installation
- **[DEMO Guide](../DEMO.md)** - Interactive demo documentation
- **[Trace Visualizer](../scripts/generate_trace_viz.py)** - Generate visualizations

## 🤝 Contributing Examples

Have a cool µWM implementation to share? We welcome contributions!

**Guidelines:**
1. Follow the tutorial format (objectives, code, explanations)
2. Include working code examples
3. Add diagrams using Mermaid syntax
4. Provide troubleshooting tips
5. Test thoroughly before submitting

See [Contributing Guide](../CONTRIBUTING.md) for more details.

## 💡 Example Ideas

Looking for inspiration? Try implementing:
- **Majority Gate** - Outputs 1 if most inputs are 1
- **Half Adder** - Basic arithmetic without carry
- **Decoder** - N-to-2^N output selector
- **Priority Encoder** - Find highest set bit
- **Custom Cipher** - Design your own lightweight encryption

## 📞 Help & Support

- **Questions?** Open a [Discussion](https://github.com/AYUSHMIT/wemu/discussions)
- **Found a bug?** File an [Issue](https://github.com/AYUSHMIT/wemu/issues)
- **Need help?** Check [Troubleshooting](../DEMO.md#troubleshooting)

Happy learning! 🎓✨

# Contributing to WeMu

Thank you for your interest in contributing to WeMu! This document provides guidelines and instructions for contributing to the project.

## 🌟 Ways to Contribute

### 1. Report Bugs
Found a bug? Help us fix it!
- Check [existing issues](https://github.com/AYUSHMIT/wemu/issues) first
- Open a new issue with detailed reproduction steps
- Include error messages, logs, and system information

### 2. Implement New µWMs
Add new microarchitectural weird machine examples:
- Logic gates and circuits
- Cryptographic primitives
- Arithmetic operations
- Novel µWM designs

### 3. Improve Documentation
Help others learn:
- Fix typos and clarify explanations
- Add code examples
- Create new tutorials
- Improve API documentation

### 4. Enhance Visualizations
Make the demo more interactive:
- Add new visualization types
- Improve animations
- Enhance mobile experience
- Create interactive tutorials

### 5. Optimize Performance
Speed up emulation:
- Profile and optimize hot paths
- Reduce memory usage
- Parallelize operations
- Cache frequently-used data

### 6. Write Tests
Improve code quality:
- Add unit tests for new features
- Increase test coverage
- Add integration tests
- Test edge cases

## 🔧 Development Setup

### Prerequisites
- Python 3.9 or higher
- Git
- GCC (for assembly compilation)
- Code editor (VS Code recommended)

### Setup Steps

1. **Fork and Clone**
   ```bash
   git clone https://github.com/YOUR_USERNAME/wemu.git
   cd wemu
   ```

2. **Create Virtual Environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # Linux/Mac
   # or
   venv\Scripts\activate  # Windows
   ```

3. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run Tests**
   ```bash
   cd src
   python unit_tests.py all
   ```

5. **Create a Branch**
   ```bash
   git checkout -b feature/my-new-feature
   # or
   git checkout -b fix/bug-description
   ```

## 📝 Coding Guidelines

### Python Code Style

Follow [PEP 8](https://pep8.org/) guidelines:

```python
# Good
def emulate_and_gate(input1: int, input2: int) -> int:
    """
    Emulate AND gate using cache side-effects.
    
    Args:
        input1: First input bit (0 or 1)
        input2: Second input bit (0 or 1)
    
    Returns:
        Output bit (0 or 1)
    """
    # Implementation
    pass

# Bad
def emulate_and_gate(input1,input2):
    # No docstring, no type hints
    pass
```

### Assembly Code

Keep assembly clean and commented:

```nasm
; Good - descriptive comments
xor rdx, rdx               ; Clear rdx register
div dl                     ; Trigger divide-by-zero exception

; Transient execution begins here
movzx rcx, byte [r13]      ; Load input A from memory

; Bad - unclear purpose
xor rdx, rdx
div dl
movzx rcx, byte [r13]      ; What is this doing?
```

### Documentation

- Add docstrings to all public functions
- Include type hints for parameters and returns
- Document complex logic with inline comments
- Update README.md for new features

## 🧪 Testing Guidelines

### Writing Tests

```python
def test_new_gate() -> bool:
    """Test the new gate implementation."""
    # Define expected behavior
    verifier = lambda a, b: a and b
    
    # Run test suite
    result = run_gate_test('NEW_GATE', emulate_new_gate, verifier, 2)
    
    return result
```

### Running Tests

```bash
# Run all tests
python unit_tests.py all

# Run specific category
python unit_tests.py gitm
python unit_tests.py flexo

# Run single test
python unit_tests.py test_gitm_and
```

### Test Coverage

Aim for high coverage:
- Test all input combinations for logic gates
- Test edge cases (overflow, boundary values)
- Test error conditions
- Verify against reference implementations

## 📤 Submitting Changes

### Pull Request Process

1. **Update Documentation**
   - Add/update docstrings
   - Update README if needed
   - Add to CHANGELOG.md

2. **Run Tests**
   ```bash
   python unit_tests.py all
   ```

3. **Commit Changes**
   ```bash
   git add .
   git commit -m "Add: Brief description of changes"
   ```

4. **Push to Fork**
   ```bash
   git push origin feature/my-new-feature
   ```

5. **Open Pull Request**
   - Go to [WeMu repository](https://github.com/AYUSHMIT/wemu)
   - Click "New Pull Request"
   - Select your fork and branch
   - Fill in the PR template

### Commit Message Guidelines

Use clear, descriptive commit messages:

```
Format: <type>: <description>

Types:
- Add: New feature or µWM implementation
- Fix: Bug fix
- Docs: Documentation changes
- Style: Code style/formatting
- Refactor: Code restructuring
- Test: Add or modify tests
- Perf: Performance improvements

Examples:
✅ Add: Implement majority gate µWM
✅ Fix: Correct RSB stack overflow handling
✅ Docs: Update tutorial 2 with clarity improvements
❌ fixed stuff
❌ changes
```

## 🎯 Adding a New µWM

### Step-by-Step Guide

1. **Add Assembly Code** (`src/gates/asm.py`)
   ```python
   ASM_MY_GATE = """
   ; Your gate implementation
   xor rdx, rdx
   div dl
   ; ... rest of code ...
   """
   ```

2. **Create Emulation Function** (`src/tests/asm_tests.py`)
   ```python
   def emulate_asm_my_gate(in1: int, in2: int) -> int:
       # Setup and run emulation
       pass
   ```

3. **Add Unit Test** (`src/unit_tests.py`)
   ```python
   def test_asm_my_gate() -> bool:
       verifier = lambda a, b: # your logic
       return run_gate_test('MY_GATE', emulate_asm_my_gate, verifier, 2)
   ```

4. **Add to Demo** (`demo/data/examples.json`)
   ```json
   {
     "id": "my-gate",
     "name": "My Custom Gate",
     "category": "CUSTOM",
     ...
   }
   ```

5. **Update Visualizer** (`demo/visualizer.js`)
   ```javascript
   EXAMPLES['my-gate'] = {
       name: 'My Gate',
       code: '...',
       logic: (a, b) => a && b
   };
   ```

## 🐛 Debugging Tips

### Enable Debug Logging

```python
emulator = MuWMEmulator(name='test', loader=loader, debug=True)
```

### Check Execution Traces

```bash
cat output/test_name/emulation_log.txt
```

### Use Visualization Tool

```bash
python scripts/generate_trace_viz.py output/test_name/emulation_log.txt
```

### Common Issues

**Issue:** Cache not priming correctly
```python
# Verify cache state
print(f"Cached: {emulator.cache.is_cached(addr)}")
```

**Issue:** Wrong memory addresses
```python
# Debug memory layout
print(f"Code: {hex(emulator.code_start_address)}")
print(f"Data: {hex(emulator.data_start_addr)}")
```

## 📚 Resources

### Documentation
- [README.md](README.md) - Project overview
- [DEMO.md](DEMO.md) - Demo guide
- [Tutorials](examples/tutorials/) - Learning resources

### Research Papers
- **GITM (2023):** Exception-based µWMs
- **FLEXO (2024):** RSB-based µWMs
- **Spectre (2019):** Transient execution attacks

### Tools
- [Unicorn Engine](https://www.unicorn-engine.org/) - CPU emulator
- [Capstone](https://www.capstone-engine.org/) - Disassembler
- [Mermaid](https://mermaid-js.github.io/) - Diagrams

## 🤝 Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors.

### Expected Behavior
- ✅ Be respectful and considerate
- ✅ Welcome newcomers and help them learn
- ✅ Give and receive constructive feedback
- ✅ Focus on what's best for the project

### Unacceptable Behavior
- ❌ Harassment or discrimination
- ❌ Trolling or insulting comments
- ❌ Personal attacks
- ❌ Unprofessional conduct

### Reporting

Report issues to project maintainers via:
- Email: [Maintainer Email]
- Private message on GitHub

## 📞 Getting Help

**Questions?** Ask in:
- [GitHub Discussions](https://github.com/AYUSHMIT/wemu/discussions)
- [Issue Tracker](https://github.com/AYUSHMIT/wemu/issues)

**Stuck?** Check:
- [Troubleshooting Guide](DEMO.md#troubleshooting)
- [Tutorial Series](examples/tutorials/)
- Existing issues and PRs

## 🙏 Thank You!

Your contributions make WeMu better for everyone. We appreciate your time and effort!

---

**Ready to contribute?** Start by exploring [good first issues](https://github.com/AYUSHMIT/wemu/labels/good%20first%20issue) or join the [discussion](https://github.com/AYUSHMIT/wemu/discussions)!

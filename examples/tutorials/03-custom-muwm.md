# Tutorial 3: Creating Custom µWMs from Scratch

## 🎯 Learning Objectives

By the end of this tutorial, you will:
- Design and implement your own microarchitectural weird machines
- Choose between cache-based (GITM) and RSB-based (FLEXO) approaches
- Integrate custom µWMs into WeMu's testing framework
- Debug and optimize µWM implementations
- Understand research applications and ethical considerations

**Prerequisites:** Tutorials 1 & 2 completed, advanced x86 assembly knowledge  
**Difficulty:** Advanced  
**Time:** 45-60 minutes

---

## 📋 Design Methodology

### Step 1: Define Your Computation

**Ask yourself:**
1. What logical/arithmetic operation do I want to implement?
2. How many inputs and outputs?
3. What's the expected truth table or function?
4. Is there a reference implementation to validate against?

### Example: 3-Input Majority Gate

**Specification:**
- **Inputs:** 3 bits (A, B, C)
- **Output:** 1 if at least 2 inputs are 1, else 0
- **Truth Table:**

| A | B | C | Output |
|---|---|---|--------|
| 0 | 0 | 0 | 0      |
| 0 | 0 | 1 | 0      |
| 0 | 1 | 0 | 0      |
| 0 | 1 | 1 | 1      |
| 1 | 0 | 0 | 0      |
| 1 | 0 | 1 | 1      |
| 1 | 1 | 0 | 1      |
| 1 | 1 | 1 | 1      |

**Logical Formula:**
```
MAJ(A, B, C) = (A AND B) OR (A AND C) OR (B AND C)
```

---

### Step 2: Choose Your Framework

| Consideration | GITM (Cache) | FLEXO (RSB) |
|--------------|--------------|-------------|
| **Simple logic gates** | ✅ Recommended | ⚠️ Overkill |
| **Complex arithmetic** | ⚠️ Slow | ✅ Better performance |
| **Many inputs/outputs** | ✅ Scalable | ⚠️ RSB limited |
| **Cryptographic ops** | ⚠️ Cache conflicts | ✅ Designed for this |
| **Debugging ease** | ✅ Easier to trace | ⚠️ More complex |
| **Research novelty** | ⚠️ Well-studied | ✅ Recent advances |

**For our Majority gate:** We'll use **GITM (cache-based)** for simplicity and educational value.

---

## 💻 Implementation: GITM Majority Gate

### Design Strategy

**Key Insight:** Decompose into known gates
```
MAJ(A, B, C) = (A AND B) OR (A AND C) OR (B AND C)
             = AB + AC + BC
```

**Microarchitectural Encoding:**
1. Cache addresses for each input pair product
2. If any product is cached → output = 1
3. Use exception-based transient execution

### Assembly Implementation

```nasm
BITS 64
DEFAULT REL

section .text
global _start

_start:
    ; ====================================
    ; Setup: r13=A, r14=B, r15=C base addresses
    ; r12=Output base address
    ; ====================================
    
    ; ====================================
    ; Trigger Exception
    ; ====================================
    xor rdx, rdx
    div dl                     ; Exception! Transient execution starts
    
    ; ====================================
    ; Compute A AND B
    ; ====================================
    movzx rcx, byte [r13]      ; rcx = A[0]
    add rcx, r14               ; rcx = &B[A[0]]
    movzx rax, byte [rcx]      ; rax = B[A[0]]
    test rax, 1                ; Check if B[A[0]] == 1
    jz skip_ab                 ; If 0, skip caching
    
    ; Cache output for AB=1
    mov al, byte [r12]         ; Output[0] cached!
skip_ab:
    
    ; ====================================
    ; Compute A AND C
    ; ====================================
    movzx rcx, byte [r13]      ; rcx = A[0]
    add rcx, r15               ; rcx = &C[A[0]]
    movzx rax, byte [rcx]      ; rax = C[A[0]]
    test rax, 1
    jz skip_ac
    
    ; Cache output for AC=1
    mov al, byte [r12]         ; Output[0] cached!
skip_ac:
    
    ; ====================================
    ; Compute B AND C
    ; ====================================
    movzx rcx, byte [r14]      ; rcx = B[0]
    add rcx, r15               ; rcx = &C[B[0]]
    movzx rax, byte [rcx]      ; rax = C[B[0]]
    test rax, 1
    jz skip_bc
    
    ; Cache output for BC=1
    mov al, byte [r12]         ; Output[0] cached!
skip_bc:
    
    ; Exception handler would go here
    ; (WeMu handles this automatically)
```

### Alternative: Arithmetic Encoding

For better efficiency, use arithmetic instead of branches:

```nasm
    ; Compute sum = A + B + C
    movzx rcx, byte [r13]      ; A
    movzx rdx, byte [r14]      ; B
    movzx rax, byte [r15]      ; C
    add rcx, rdx
    add rcx, rax               ; rcx = A + B + C
    
    ; If sum >= 2, output = 1
    cmp rcx, 2
    jl output_zero
    
    ; Cache output address
    mov dl, byte [r12]
output_zero:
    ; Done
```

**Why this works:** 
- If at least 2 inputs are 1, sum ≥ 2
- Single branch instead of three
- Fewer cache accesses → faster transient execution

---

## 🔧 Integration into WeMu

### Step 1: Add Assembly to `gates/asm.py`

```python
ASM_MAJORITY = """
; Majority gate implementation
xor rdx, rdx
div dl

; Arithmetic approach: sum = A + B + C
movzx rcx, byte [r13]
movzx rdx, byte [r14]  
movzx rax, byte [r15]
add rcx, rdx
add rcx, rax

; If sum >= 2, cache output
cmp rcx, 2
jl skip_output
mov dl, byte [r12]
skip_output:
"""

def get_asm_majority(in1, in2, in3):
    """Generate majority gate assembly with cache priming."""
    res = ASM_START
    # Prime cache based on inputs
    if in1:
        res += "mov [r13], byte 0\n"
    if in2:
        res += "mov [r14], byte 0\n"
    if in3:
        res += "mov [r15], byte 0\n"
    res += ASM_MAJORITY
    return res
```

### Step 2: Add Test Function to `tests/asm_tests.py`

```python
def emulate_asm_majority(in1: int, in2: int, in3: int, debug: bool = False) -> int:
    """
    Emulate 3-input majority gate.
    Returns 1 if at least 2 inputs are 1, else 0.
    """
    from gates.asm import get_asm_majority
    
    # Get assembly code
    asm_code = get_asm_majority(in1, in2, in3)
    
    # Setup loader
    loader = AsmLoader(
        asm_code=asm_code,
        code_start=0x1000,
        code_size=0x1000,
        data_start=0x10000,
        data_size=0x10000
    )
    
    # Create emulator
    emulator = MuWMEmulator(name='asm_majority', loader=loader, debug=debug)
    
    # Setup memory addresses
    IN1_ADDR = 0x10000
    IN2_ADDR = 0x11000
    IN3_ADDR = 0x12000
    OUT_ADDR = 0x13000
    
    # Initialize memory
    emulator.uc.mem_write(IN1_ADDR, bytes([in1]))
    emulator.uc.mem_write(IN2_ADDR, bytes([in2]))
    emulator.uc.mem_write(IN3_ADDR, bytes([in3]))
    emulator.uc.mem_write(OUT_ADDR, bytes([0]))
    
    # Set register pointers
    emulator.uc.reg_write(UC_X86_REG_R13, IN1_ADDR)
    emulator.uc.reg_write(UC_X86_REG_R14, IN2_ADDR)
    emulator.uc.reg_write(UC_X86_REG_R15, IN3_ADDR)
    emulator.uc.reg_write(UC_X86_REG_R12, OUT_ADDR)
    
    # Prime cache for inputs
    if in1:
        emulator.cache.read(IN1_ADDR, emulator.uc)
    if in2:
        emulator.cache.read(IN2_ADDR, emulator.uc)
    if in3:
        emulator.cache.read(IN3_ADDR, emulator.uc)
    
    # Setup emulation boundaries
    emulator.code_start_address = 0x1000
    emulator.code_exit_addr = 0x1000 + len(asm_code) // 4  # Estimate
    
    # Run emulation
    emulator.emulate()
    
    # Check output: is OUT_ADDR cached?
    return 1 if emulator.cache.is_cached(OUT_ADDR) else 0
```

### Step 3: Add Unit Test to `unit_tests.py`

```python
def test_asm_majority() -> bool:
    """Test 3-input majority gate."""
    def verifier(a, b, c):
        # Return 1 if at least 2 inputs are 1
        count = sum([a, b, c])
        return 1 if count >= 2 else 0
    
    # Test all 8 input combinations
    test_cases = [
        (0, 0, 0, 0),  # No 1s → output 0
        (0, 0, 1, 0),  # One 1 → output 0
        (0, 1, 0, 0),  # One 1 → output 0
        (0, 1, 1, 1),  # Two 1s → output 1
        (1, 0, 0, 0),  # One 1 → output 0
        (1, 0, 1, 1),  # Two 1s → output 1
        (1, 1, 0, 1),  # Two 1s → output 1
        (1, 1, 1, 1),  # Three 1s → output 1
    ]
    
    print("--- Running test_asm_majority ---")
    for in1, in2, in3, expected in test_cases:
        result = emulate_asm_majority(in1, in2, in3)
        if result != expected:
            print(f"✗ Test FAILED for MAJ({in1}, {in2}, {in3})")
            print(f"  Expected: {expected}, Got: {result}")
            return False
        print(f"✓ Test passed for MAJ({in1}, {in2}, {in3}) = {result}")
    
    return True
```

### Step 4: Register Test in CLI

Add to the test dispatch logic in `unit_tests.py`:

```python
# In the main test dispatch
test_functions = {
    # ... existing tests ...
    'test_asm_majority': test_asm_majority,
}

# Add to category groups
asm_tests = [
    # ... existing asm tests ...
    'test_asm_majority',
]
```

---

## 🧪 Testing and Validation

### Run Your Test

```bash
cd src
python unit_tests.py test_asm_majority
```

### Expected Output

```
--- Running test_asm_majority ---
✓ Test passed for MAJ(0, 0, 0) = 0
✓ Test passed for MAJ(0, 0, 1) = 0
✓ Test passed for MAJ(0, 1, 0) = 0
✓ Test passed for MAJ(0, 1, 1) = 1
✓ Test passed for MAJ(1, 0, 0) = 0
✓ Test passed for MAJ(1, 0, 1) = 1
✓ Test passed for MAJ(1, 1, 0) = 1
✓ Test passed for MAJ(1, 1, 1) = 1
```

### Enable Debug Traces

```python
result = emulate_asm_majority(1, 1, 0, debug=True)
```

Check `output/asm_majority/emulation_log.txt`:

```
Starting emulation of asm_majority with inputs=(1, 1, 0) ...
[0x1000] xor rdx, rdx
[0x1003] div dl
[TRANSIENT] movzx rcx, byte [r13]
[TRANSIENT] Cache HIT at 0x10000 (IN1=1)
[TRANSIENT] movzx rdx, byte [r14]
[TRANSIENT] Cache HIT at 0x11000 (IN2=1)
[TRANSIENT] movzx rax, byte [r15]
[TRANSIENT] Cache MISS at 0x12000 (IN3=0)
[TRANSIENT] add rcx, rdx  ; rcx = 1 + 1 = 2
[TRANSIENT] add rcx, rax  ; rcx = 2 + 0 = 2
[TRANSIENT] cmp rcx, 2
[TRANSIENT] jl skip_output  ; Not taken (2 >= 2)
[TRANSIENT] mov dl, byte [r12]
[TRANSIENT] Cache WRITE at 0x13000 (OUTPUT)
✓ Output = 1 (as expected)
```

---

## 🚀 Advanced: FLEXO Implementation

For comparison, here's how to implement the same gate using RSB:

### FLEXO Majority Gate

```nasm
flexo_majority:
    call setup
    setup:
    pop rax                    ; Initialize RSB
    
    ; Count number of 1s using RSB depth
    xor r8, r8                 ; Counter
    
    ; Check input A
    test byte [r13], 1
    jz check_b
    inc r8
    call mark_a_one
    mark_a_one:
    pop rbx
    
check_b:
    test byte [r14], 1
    jz check_c
    inc r8
    call mark_b_one
    mark_b_one:
    pop rcx
    
check_c:
    test byte [r15], 1
    jz evaluate
    inc r8
    call mark_c_one
    mark_c_one:
    pop rdx
    
evaluate:
    ; If counter >= 2, encode output in RSB
    cmp r8, 2
    jl output_zero_rsb
    
    call encode_one
    encode_one:
    pop rsi
    ret                        ; Returns to encode_one (output=1)
    
output_zero_rsb:
    call encode_zero
    encode_zero:
    pop rdi
    ret                        ; Returns to encode_zero (output=0)
```

**Trade-offs:**
- **Pros:** No cache dependency, potentially faster
- **Cons:** More complex control flow, harder to debug

---

## 🔬 Research Applications

### 1. Side-Channel Analysis

Use your custom µWM to study side-channel leakage:

```python
def measure_timing(emulator, input_pattern):
    """Measure execution time for given input."""
    start = emulator.timer.read()
    emulator.emulate()
    end = emulator.timer.read()
    return end - start

# Test different inputs
for pattern in all_inputs:
    timing = measure_timing(emulator, pattern)
    print(f"Input {pattern}: {timing} cycles")
```

**Research Question:** Can an attacker distinguish inputs by timing alone?

### 2. Covert Channel Bandwidth

Measure information transfer rate:

```python
def covert_channel_bandwidth(bits_per_operation, operations_per_second):
    """Calculate channel capacity in bits/second."""
    return bits_per_operation * operations_per_second

# Example: Majority gate
bits = 1  # 1-bit output
ops = 1000 / 50  # 50ms per operation → 20 ops/sec
bandwidth = covert_channel_bandwidth(bits, ops)
print(f"Channel bandwidth: {bandwidth} bits/sec")
```

### 3. Defense Mechanism Testing

Evaluate countermeasures:

```python
# Test with different cache configurations
configs = [
    InfiniteCache(),
    LRUCache(size=16),
    LRUCache(size=64),
]

for cache in configs:
    emulator.cache = cache
    success_rate = run_test_suite()
    print(f"Cache {cache}: {success_rate}% success")
```

---

## 🛡️ Ethical Considerations

### Responsible Research

**DO:**
- ✅ Use µWMs to understand and mitigate vulnerabilities
- ✅ Disclose findings responsibly to vendors
- ✅ Publish research for academic advancement
- ✅ Develop defenses and countermeasures

**DON'T:**
- ❌ Weaponize µWMs for malicious purposes
- ❌ Exploit systems without authorization
- ❌ Share attack code without responsible disclosure
- ❌ Target critical infrastructure

### Real-World Impact

Your custom µWM research could:
1. **Inform CPU design:** Help architects build more secure processors
2. **Improve software security:** Guide constant-time programming practices
3. **Advance security auditing:** Enable better vulnerability detection
4. **Educate practitioners:** Raise awareness of microarchitectural risks

---

## 🎓 Advanced Challenges

### Challenge 1: Full Adder µWM

Implement a 1-bit full adder with carry:

```
FULL_ADDER(A, B, Cin) → (Sum, Cout)
Sum = A ⊕ B ⊕ Cin
Cout = (A AND B) OR (Cin AND (A ⊕ B))
```

**Hint:** Reuse XOR and AND gate µWMs as building blocks

### Challenge 2: 4-bit Ripple-Carry Adder

Chain four full adders:

```
IN: A[3:0], B[3:0]
OUT: Sum[3:0], Cout
```

**Challenge:** Minimize transient execution window usage

### Challenge 3: AES S-box Lookup

Implement AES SubBytes using µWM:

```
Input: 8-bit byte
Output: 8-bit substituted byte (from AES S-box)
```

**Hint:** Use cache to encode 256-entry lookup table

### Challenge 4: Custom Crypto Primitive

Design your own lightweight cipher:
- Block size: 16 bits
- Key size: 32 bits
- Rounds: 8
- Operations: Your choice!

**Research Question:** Is your cipher resistant to differential cryptanalysis?

---

## 🔧 Debugging Strategies

### Strategy 1: Incremental Testing

Test each component separately:

```python
# Test just the AND portion
def test_and_component():
    result = emulate_and_only(1, 1)
    assert result == 1

# Test just the OR portion
def test_or_component():
    result = emulate_or_only(1, 0)
    assert result == 1

# Then test full majority gate
```

### Strategy 2: Visualization

Generate execution graphs:

```python
import matplotlib.pyplot as plt

def visualize_cache_accesses(trace):
    """Plot cache accesses over time."""
    times = [t['cycle'] for t in trace]
    addrs = [t['address'] for t in trace]
    
    plt.scatter(times, addrs)
    plt.xlabel('Cycle')
    plt.ylabel('Address')
    plt.title('Cache Access Pattern')
    plt.show()
```

### Strategy 3: Differential Analysis

Compare against reference:

```python
def differential_test():
    """Test all inputs against reference implementation."""
    mismatches = []
    for inputs in all_combinations:
        muwm_result = emulate_custom_gate(*inputs)
        ref_result = reference_implementation(*inputs)
        if muwm_result != ref_result:
            mismatches.append((inputs, muwm_result, ref_result))
    return mismatches
```

---

## 📖 Further Resources

### Academic Papers

1. **GITM Foundation:**
   - "The Ghost is the Machine" (Wang et al., 2023)
   - Introduces exception-based µWMs

2. **FLEXO Advances:**
   - "Bending Microarchitectural Weird Machines" (Wang et al., 2024)
   - RSB-based cryptographic µWMs

3. **Security Analysis:**
   - "Spectre Attacks" (Kocher et al., 2019)
   - Broader context for transient execution

### Tools and Frameworks

- **WeMu:** This framework!
- **Unicorn Engine:** CPU emulator (WeMu's foundation)
- **Capstone:** Disassembler for trace analysis
- **angr:** Binary analysis platform (complementary)

### Community

- **GitHub Discussions:** [AYUSHMIT/wemu/discussions](https://github.com/AYUSHMIT/wemu)
- **Research Groups:** Academic security labs
- **Conferences:** IEEE S&P, USENIX Security, CCS

---

## ✅ Checklist: Your Custom µWM

Before considering your µWM complete:

- [ ] **Specification:** Clear input/output definition
- [ ] **Implementation:** Working assembly/binary
- [ ] **Integration:** Added to WeMu test suite
- [ ] **Validation:** Passes all test cases
- [ ] **Documentation:** Code comments and tutorial
- [ ] **Performance:** Measured execution time
- [ ] **Security Analysis:** Side-channel characterization
- [ ] **Comparison:** Benchmarked against alternatives

---

## 🎉 Congratulations!

You've mastered the art of creating custom µWMs! You can now:
- ✓ Design novel microarchitectural computations
- ✓ Implement them using GITM or FLEXO frameworks
- ✓ Integrate and test within WeMu
- ✓ Analyze security implications
- ✓ Contribute to cutting-edge research

**Share your creations:** Open a PR to [AYUSHMIT/wemu](https://github.com/AYUSHMIT/wemu) with your custom µWM!

---

**What's Next?**
- Explore the [Interactive Demo](../../demo/index.html) to visualize your µWM
- Read the [Complete Demo Guide](../../DEMO.md) for advanced topics
- Join the community and share your research findings!

Happy hacking! 🚀🔬

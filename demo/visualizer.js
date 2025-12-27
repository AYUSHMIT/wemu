/**
 * WeMu Visualizer - Interactive execution trace visualization
 * Handles rendering of microarchitectural state and execution flow
 */

// ============================================
// Example Data
// ============================================
const EXAMPLES = {
    'gitm-and': {
        name: 'AND Gate',
        category: 'GITM',
        description: 'Exception-based AND gate using transient execution',
        code: `; AND Gate using Exception-based µWM
; Trigger division by zero exception
xor rdx, rdx
div dl

; Transient gate computations
movzx rcx, byte [r13]    ; Load in1[0] into rcx
add rcx, r14             ; Add in2 base address to rcx
movzx rdx, byte [rcx]    ; Load in2[in1[0]] into rdx
add rdx, r15             ; Add out base address to rdx
mov dl, byte [rdx]       ; Access out[in2[in1[0]]]`,
        inputs: ['in1', 'in2'],
        outputType: 'cache',
        logic: (a, b) => a && b
    },
    'gitm-or': {
        name: 'OR Gate',
        category: 'GITM',
        description: 'Exception-based OR gate',
        code: `; OR Gate using Exception-based µWM
xor rdx, rdx
div dl

; Set output (OR)
movzx rcx, byte [r13]
add rcx, r15
mov al, byte [rcx]

movzx rcx, byte [r14]
add rcx, r15
mov dl, byte [rcx]`,
        inputs: ['in1', 'in2'],
        outputType: 'cache',
        logic: (a, b) => a || b
    },
    'gitm-not': {
        name: 'NOT Gate',
        category: 'GITM',
        description: 'Exception-based NOT gate',
        code: `; NOT Gate using Exception-based µWM
xor rdx, rdx
div dl

; Compute NOT
movzx rcx, byte [r13]
xor rcx, 1
add rcx, r15
mov al, byte [rcx]`,
        inputs: ['in1'],
        outputType: 'cache',
        logic: (a) => !a
    },
    'gitm-assign': {
        name: 'ASSIGN',
        category: 'GITM',
        description: 'Simple assignment operation',
        code: `; ASSIGN using Exception-based µWM
xor rdx, rdx
div dl

movzx rcx, byte [r14]
mov rdx, rcx
add rdx, r15
mov dl, byte [rdx]`,
        inputs: ['in1'],
        outputType: 'cache',
        logic: (a) => a
    },
    'flexo-and': {
        name: 'FLEXO AND',
        category: 'FLEXO',
        description: 'RSB-based AND gate',
        code: `; FLEXO AND Gate using RSB
call label1
label1:
pop rax          ; Get return address
; Manipulate RSB based on inputs
test [r13], 1
jz skip1
call push_addr1
skip1:
test [r14], 1
jz skip2
call push_addr2
skip2:
ret              ; Return uses RSB prediction`,
        inputs: ['in1', 'in2'],
        outputType: 'rsb',
        logic: (a, b) => a && b
    },
    'flexo-xor': {
        name: 'FLEXO XOR',
        category: 'FLEXO',
        description: 'RSB-based XOR gate',
        code: `; FLEXO XOR Gate using RSB
call setup
setup:
pop rax
; XOR logic through RSB manipulation
mov rcx, [r13]
xor rcx, [r14]
test rcx, 1
jz result_0
call addr_1
jmp end
result_0:
call addr_0
end:
ret`,
        inputs: ['in1', 'in2'],
        outputType: 'rsb',
        logic: (a, b) => a ^ b
    },
    'flexo-mux': {
        name: 'FLEXO MUX',
        category: 'FLEXO',
        description: 'RSB-based multiplexer',
        code: `; FLEXO MUX - Select between two inputs
call mux_start
mux_start:
pop rax
mov rcx, [r15]   ; Load selector
test rcx, 1
jz select_a
mov rdx, [r14]   ; Load input B
jmp output
select_a:
mov rdx, [r13]   ; Load input A
output:
ret`,
        inputs: ['in1', 'in2', 'sel'],
        outputType: 'rsb',
        logic: (a, b, sel) => sel ? b : a
    },
    'flexo-simon32': {
        name: 'Simon32 Encryption',
        category: 'FLEXO',
        description: 'RSB-based Simon32 block cipher',
        code: `; Simon32 - Lightweight block cipher
; Using RSB for cryptographic operations
simon32_round:
    call round_start
    round_start:
    pop rax
    
    ; Left circular shift by 1
    mov rcx, [r13]
    rol rcx, 1
    
    ; AND operation
    mov rdx, [r14]
    and rcx, rdx
    
    ; XOR with key
    xor rcx, [r15]
    
    ; RSB manipulation for output
    test rcx, 1
    jz round_end
    call encode_1
    round_end:
    ret`,
        inputs: ['plaintext', 'key'],
        outputType: 'rsb',
        logic: null // Complex crypto operation
    },
    'flexo-aes-round': {
        name: 'AES Round',
        category: 'FLEXO',
        description: 'Single AES encryption round using RSB',
        code: `; AES Round using RSB
aes_round:
    call aes_start
    aes_start:
    pop rax
    
    ; SubBytes step (simplified)
    mov rcx, [r13]
    call sbox_lookup
    
    ; ShiftRows (RSB encoding)
    rol rcx, 8
    
    ; MixColumns (simplified)
    mov rdx, rcx
    xor rdx, [r14]
    
    ret`,
        inputs: ['state', 'roundkey'],
        outputType: 'rsb',
        logic: null
    }
};

// ============================================
// State Management
// ============================================
let currentExample = 'gitm-and';
let currentInputs = {};
let executionTrace = [];
let cacheState = new Set();
let rsbStack = [];

// ============================================
// Initialization
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    initializePlayground();
    setupEventListeners();
    loadExample('gitm-and');
});

function initializePlayground() {
    console.log('Initializing WeMu Visualizer...');
}

function setupEventListeners() {
    // Example selection buttons
    document.querySelectorAll('.example-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.example-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            const exampleId = e.target.getAttribute('data-example');
            loadExample(exampleId);
        });
    });

    // Run button
    const runBtn = document.getElementById('run-btn');
    if (runBtn) {
        runBtn.addEventListener('click', runEmulation);
    }
}

// ============================================
// Example Loading
// ============================================
function loadExample(exampleId) {
    currentExample = exampleId;
    const example = EXAMPLES[exampleId];
    
    if (!example) {
        console.error('Example not found:', exampleId);
        return;
    }

    // Update code display
    const codeDisplay = document.getElementById('code-display');
    if (codeDisplay) {
        codeDisplay.innerHTML = `<code class="language-nasm">${escapeHtml(example.code)}</code>`;
        if (window.Prism) {
            Prism.highlightElement(codeDisplay.querySelector('code'));
        }
    }

    // Update category badge
    const categoryBadge = document.getElementById('example-category');
    if (categoryBadge) {
        categoryBadge.textContent = example.category;
        categoryBadge.style.background = example.category === 'GITM' ? '#3b82f6' : '#ec4899';
    }

    // Generate input controls
    generateInputControls(example);

    // Clear output
    clearOutput();
}

function generateInputControls(example) {
    const container = document.getElementById('input-controls');
    if (!container) return;

    container.innerHTML = '';
    
    example.inputs.forEach((input, idx) => {
        const inputGroup = document.createElement('div');
        inputGroup.className = 'input-group';
        
        const label = document.createElement('label');
        label.textContent = `Input ${input.toUpperCase()}:`;
        
        const toggleGroup = document.createElement('div');
        toggleGroup.className = 'input-toggle';
        
        const btn0 = document.createElement('button');
        btn0.textContent = '0';
        btn0.className = 'active';
        btn0.dataset.input = input;
        btn0.dataset.value = '0';
        
        const btn1 = document.createElement('button');
        btn1.textContent = '1';
        btn1.dataset.input = input;
        btn1.dataset.value = '1';
        
        // Toggle event listeners
        [btn0, btn1].forEach(btn => {
            btn.addEventListener('click', (e) => {
                const parent = e.target.parentElement;
                parent.querySelectorAll('button').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                currentInputs[input] = parseInt(e.target.dataset.value);
            });
        });
        
        toggleGroup.appendChild(btn0);
        toggleGroup.appendChild(btn1);
        
        inputGroup.appendChild(label);
        inputGroup.appendChild(toggleGroup);
        container.appendChild(inputGroup);
        
        // Initialize input value
        currentInputs[input] = 0;
    });
}

// ============================================
// Emulation Execution
// ============================================
function runEmulation() {
    const example = EXAMPLES[currentExample];
    if (!example) return;

    // Show loading state
    const runBtn = document.getElementById('run-btn');
    const originalText = runBtn.textContent;
    runBtn.textContent = '⏳ Emulating...';
    runBtn.disabled = true;

    // Simulate emulation with delay
    setTimeout(() => {
        // Reset state
        cacheState.clear();
        rsbStack = [];
        executionTrace = [];

        // Simulate execution based on example
        simulateExecution(example);

        // Display results
        displayResults(example);
        
        // Update visualizations
        updateTimeline();
        updateCacheVisualization();
        updateRSBVisualization();
        updateFlowchart(example);

        // Reset button
        runBtn.textContent = originalText;
        runBtn.disabled = false;
    }, 800);
}

function simulateExecution(example) {
    // Generate execution trace based on example type
    const steps = [
        { type: 'committed', insn: 'xor rdx, rdx', addr: 0x1000 },
        { type: 'faulting', insn: 'div dl', addr: 0x1002 }
    ];

    if (example.category === 'GITM') {
        // Exception-based execution
        steps.push(
            { type: 'transient', insn: 'movzx rcx, byte [r13]', addr: 0x1004 },
            { type: 'transient', insn: 'add rcx, r14', addr: 0x1008 },
            { type: 'transient', insn: 'mov dl, byte [rdx]', addr: 0x100c }
        );
        
        // Simulate cache effects
        if (example.logic) {
            const inputVals = example.inputs.map(inp => currentInputs[inp] || 0);
            const result = example.logic(...inputVals);
            if (result) {
                cacheState.add('0x10000000'); // Output address
            }
        }
    } else if (example.category === 'FLEXO') {
        // RSB-based execution
        steps.push(
            { type: 'committed', insn: 'call label1', addr: 0x1004 },
            { type: 'speculative', insn: 'pop rax', addr: 0x1008 },
            { type: 'speculative', insn: 'test [r13], 1', addr: 0x100c },
            { type: 'transient', insn: 'ret', addr: 0x1010 }
        );
        
        // Simulate RSB effects
        if (example.logic) {
            const inputVals = example.inputs.map(inp => currentInputs[inp] || 0);
            const result = example.logic(...inputVals);
            if (result) {
                rsbStack.push({ addr: '0x2000', predicted: true });
            } else {
                rsbStack.push({ addr: '0x1000', predicted: false });
            }
        }
    }

    executionTrace = steps;
}

function displayResults(example) {
    const outputDisplay = document.getElementById('output-display');
    if (!outputDisplay) return;

    const inputVals = example.inputs.map(inp => currentInputs[inp] || 0);
    const result = example.logic ? example.logic(...inputVals) : null;

    let html = '<div class="result-success">';
    html += '<h4>✓ Emulation Complete</h4>';
    
    // Show inputs
    html += '<div class="result-item"><strong>Inputs:</strong><span>';
    example.inputs.forEach((inp, idx) => {
        html += `${inp.toUpperCase()}=${inputVals[idx]}`;
        if (idx < example.inputs.length - 1) html += ', ';
    });
    html += '</span></div>';

    // Show output
    if (result !== null) {
        html += `<div class="result-item"><strong>Logical Output:</strong><span>${result ? '1' : '0'}</span></div>`;
    }

    // Show side-channel encoding
    if (example.outputType === 'cache') {
        html += `<div class="result-item"><strong>Cache Encoding:</strong><span>`;
        html += cacheState.size > 0 ? 'Address 0x10000000 cached (output=1)' : 'No cached addresses (output=0)';
        html += '</span></div>';
    } else if (example.outputType === 'rsb') {
        html += `<div class="result-item"><strong>RSB Encoding:</strong><span>`;
        html += rsbStack.length > 0 ? `${rsbStack.length} entries on RSB` : 'RSB empty';
        html += '</span></div>';
    }

    html += `<div class="result-item"><strong>Instructions Executed:</strong><span>${executionTrace.length}</span></div>`;
    html += `<div class="result-item"><strong>Transient Instructions:</strong><span>${executionTrace.filter(t => t.type === 'transient').length}</span></div>`;
    
    html += '</div>';
    outputDisplay.innerHTML = html;
}

// ============================================
// Visualization Updates
// ============================================
function updateTimeline() {
    const timeline = document.getElementById('timeline-display');
    if (!timeline) return;

    if (executionTrace.length === 0) {
        timeline.innerHTML = '<div class="timeline-placeholder">Run an example to see execution timeline...</div>';
        return;
    }

    timeline.innerHTML = '';
    executionTrace.forEach((step, idx) => {
        const item = document.createElement('div');
        item.className = `timeline-item ${step.type}`;
        item.innerHTML = `
            <div style="font-size: 0.75rem; color: var(--text-tertiary);">Step ${idx + 1}</div>
            <div style="font-weight: 600; margin: 0.25rem 0;">${step.addr.toString(16)}</div>
            <div style="font-size: 0.875rem;">${step.type}</div>
        `;
        item.title = step.insn;
        timeline.appendChild(item);
    });
}

function updateCacheVisualization() {
    const cacheViz = document.getElementById('cache-viz');
    if (!cacheViz) return;

    if (cacheState.size === 0) {
        cacheViz.innerHTML = '<div class="placeholder">No cache entries</div>';
        return;
    }

    let html = '';
    cacheState.forEach(addr => {
        html += `
            <div class="cache-item cached">
                <span><strong>Address:</strong> ${addr}</span>
                <span style="color: var(--accent-success);">✓ Cached</span>
            </div>
        `;
    });
    cacheViz.innerHTML = html;
}

function updateRSBVisualization() {
    const rsbViz = document.getElementById('rsb-viz');
    if (!rsbViz) return;

    if (rsbStack.length === 0) {
        rsbViz.innerHTML = '<div class="placeholder">RSB Stack Empty</div>';
        return;
    }

    let html = '<div style="font-size: 0.875rem; color: var(--text-tertiary); margin-bottom: 0.5rem;">↓ Top of Stack</div>';
    rsbStack.forEach((entry, idx) => {
        html += `
            <div class="rsb-item" style="border-left: 3px solid ${entry.predicted ? '#10b981' : '#f59e0b'}">
                <span><strong>Entry ${idx}:</strong> ${entry.addr}</span>
                <span>${entry.predicted ? '✓ Predicted' : '⚠ Mispredicted'}</span>
            </div>
        `;
    });
    rsbViz.innerHTML = html;
}

function updateFlowchart(example) {
    const flowchartContent = document.getElementById('flowchart-content');
    if (!flowchartContent) return;

    let diagram = '';
    
    if (example.category === 'GITM') {
        diagram = `graph TD
    A[Start: Normal Execution] -->|Initialize| B[xor rdx, rdx]
    B --> C{div dl - Exception!}
    C -->|Transient Path| D[Load Input from Cache]
    D --> E[Compute Address]
    E --> F[Cache Access - Output Encoding]
    F --> G[Exception Handler]
    C -->|Normal Path| G
    G --> H[End: Check Cache State]
    style C fill:#ef4444
    style D fill:#fbbf24
    style E fill:#fbbf24
    style F fill:#f97316
    style H fill:#10b981`;
    } else {
        diagram = `graph TD
    A[Start: Normal Execution] --> B[Setup RSB]
    B --> C[call instruction]
    C --> D{Check Inputs}
    D -->|Input=1| E[Push Address to RSB]
    D -->|Input=0| F[Skip Push]
    E --> G[ret instruction]
    F --> G
    G -->|RSB Prediction| H[Speculative Fetch]
    H --> I[Output Encoded in RSB]
    I --> J[End]
    style C fill:#667eea
    style E fill:#f59e0b
    style H fill:#fbbf24
    style I fill:#10b981`;
    }

    flowchartContent.textContent = diagram;
    
    // Reinitialize Mermaid for this specific element
    if (window.mermaid) {
        mermaid.init(undefined, flowchartContent);
    }
}

// ============================================
// Helper Functions
// ============================================
function clearOutput() {
    const outputDisplay = document.getElementById('output-display');
    if (outputDisplay) {
        outputDisplay.innerHTML = '<p class="placeholder">Click "Run Emulation" to see results...</p>';
    }

    const timeline = document.getElementById('timeline-display');
    if (timeline) {
        timeline.innerHTML = '<div class="timeline-placeholder">Run an example to see execution timeline...</div>';
    }

    const cacheViz = document.getElementById('cache-viz');
    if (cacheViz) {
        cacheViz.innerHTML = '<div class="placeholder">Cache state will appear here...</div>';
    }

    const rsbViz = document.getElementById('rsb-viz');
    if (rsbViz) {
        rsbViz.innerHTML = '<div class="placeholder">RSB state will appear here...</div>';
    }
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// ============================================
// Export for external use
// ============================================
window.WeMuVisualizer = {
    loadExample,
    runEmulation,
    currentExample: () => currentExample,
    currentInputs: () => currentInputs
};

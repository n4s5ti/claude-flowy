# Agentic Jujutsu - Complete Usage Guide

## 🎯 What is Agentic Jujutsu?

**Agentic Jujutsu** is a quantum-resistant, self-learning version control system specifically designed for AI agents working concurrently. It's 23x faster than Git for multi-agent workflows and features built-in AI that learns from every operation.

## 🚀 Quick Start

### Installation

```bash
npm install agentic-jujutsu
```

**Requirements:**
- Node.js 16+
- GLIBC 2.32+ (for native binary)
- Initialized Git repository (jujutsu VCS auto-installed)

### Basic Usage

```javascript
import { JjWrapper } from 'agentic-jujutsu';

const jj = new JjWrapper();

// Basic operations
await jj.status();
await jj.newCommit('Add feature');
await jj.log(10);
```

## 🧠 Core Features

### 1. Self-Learning with ReasoningBank

Track your work and let AI learn from it:

```javascript
// Start tracking a task
const trajectoryId = jj.startTrajectory('Implement user authentication');

// Do your work
await jj.branchCreate('feature/auth');
await jj.newCommit('Add user model');
await jj.newCommit('Add login endpoint');
await jj.newCommit('Add JWT validation');

// Record operations to trajectory
jj.addToTrajectory();

// Finalize with success score (0.0-1.0) and optional critique
jj.finalizeTrajectory(
    0.85,
    'Feature complete. Works well, could use rate limiting'
);
```

**Key Points:**
- Success scores: 0.0 (failed) to 1.0 (perfect)
- Critiques help AI learn from mistakes
- Operations are tracked automatically

### 2. AI-Powered Suggestions

Get intelligent recommendations for new tasks:

```javascript
// Ask AI for suggestions based on past work
const suggestion = JSON.parse(jj.getSuggestion('Add password reset feature'));

console.log('AI Analysis:');
console.log(`  Confidence: ${(suggestion.confidence * 100).toFixed(1)}%`);
console.log(`  Expected Success: ${(suggestion.expectedSuccessRate * 100).toFixed(1)}%`);
console.log(`  Estimated Duration: ${suggestion.estimatedDurationMs}ms`);
console.log(`\nReasoning: ${suggestion.reasoning}`);

// Get recommended operation sequence
suggestion.recommendedOperations.forEach((op, i) => {
    console.log(`  ${i + 1}. ${op}`);
});
```

**Suggestion Object:**
```typescript
{
    confidence: number;           // 0.0-1.0
    expectedSuccessRate: number;  // 0.0-1.0
    estimatedDurationMs: number;
    reasoning: string;
    recommendedOperations: string[];
}
```

### 3. Pattern Discovery

AI automatically discovers successful patterns:

```javascript
const patterns = JSON.parse(jj.getPatterns());

patterns.forEach(pattern => {
    console.log(`Pattern: ${pattern.name}`);
    console.log(`  Success Rate: ${(pattern.successRate * 100).toFixed(1)}%`);
    console.log(`  Observations: ${pattern.observationCount}`);
    console.log(`  Confidence: ${(pattern.confidence * 100).toFixed(1)}%`);
    console.log(`  Operations: ${pattern.operationSequence.join(' → ')}`);
});
```

**Pattern Requirements:**
- Minimum 3 observations
- Success rate >70%
- Similar operation sequences

### 4. Learning Statistics

Track improvement over time:

```javascript
const stats = JSON.parse(jj.getLearningStats());

console.log('Learning Progress:');
console.log(`  Total Trajectories: ${stats.totalTrajectories}`);
console.log(`  Patterns Discovered: ${stats.totalPatterns}`);
console.log(`  Average Success: ${(stats.avgSuccessRate * 100).toFixed(1)}%`);
console.log(`  Improvement Rate: ${(stats.improvementRate * 100).toFixed(1)}%`);
console.log(`  Prediction Accuracy: ${(stats.predictionAccuracy * 100).toFixed(1)}%`);
```

### 5. Query Similar Trajectories

Find past work similar to current task:

```javascript
const similar = JSON.parse(jj.queryTrajectories('Add user feature', 5));

console.log(`Found ${similar.length} similar trajectories:`);
similar.forEach(traj => {
    console.log(`  Task: "${traj.task}"`);
    console.log(`  Success: ${(traj.successScore * 100).toFixed(1)}%`);
    console.log(`  Operations: ${traj.operations.length}`);
    if (traj.critique) {
        console.log(`  Critique: ${traj.critique}`);
    }
});
```

## 🤖 Multi-Agent Coordination

The killer feature: multiple agents working concurrently without conflicts!

```javascript
// Define multiple agents
const agents = [
    { name: 'Agent-1', task: 'Implement dashboard' },
    { name: 'Agent-2', task: 'Add API endpoints' },
    { name: 'Agent-3', task: 'Database optimization' }
];

// All agents work in parallel (NO LOCKS!)
const results = await Promise.all(
    agents.map(async (agent) => {
        const jj = new JjWrapper();

        // Get AI suggestion
        const suggestion = JSON.parse(jj.getSuggestion(agent.task));

        // Start tracking
        jj.startTrajectory(agent.task);

        // Execute work
        await doWork(agent);

        // Record and finalize
        jj.addToTrajectory();
        jj.finalizeTrajectory(0.9, 'Success');

        return { agent: agent.name, success: true };
    })
);
```

**Benefits:**
- 23x faster than Git serial execution
- Zero conflicts
- Each agent learns from others
- Shared ReasoningBank intelligence

## 🔐 Quantum Security

### SHA3-512 Fingerprints

Quantum-resistant integrity verification:

```javascript
import {
    generateQuantumFingerprint,
    verifyQuantumFingerprint
} from 'agentic-jujutsu';

// Generate fingerprint
const data = Buffer.from('commit-data');
const fingerprint = generateQuantumFingerprint(data);

// Verify integrity (<1ms)
const isValid = verifyQuantumFingerprint(data, fingerprint);
console.log('Valid:', isValid); // true
```

**Features:**
- NIST FIPS 202 approved
- 64 bytes (512 bits)
- <1ms verification
- Quantum-resistant to 2030+

### HQC-128 Encryption

Post-quantum encryption for trajectories:

```javascript
import crypto from 'crypto';

// Generate encryption key
const key = crypto.randomBytes(32).toString('base64');

// Enable encryption
jj.enableEncryption(key);

// All trajectories now encrypted with HQC-128
jj.startTrajectory('Secure deployment');
// ... work ...
jj.finalizeTrajectory(0.95);

// Check status
console.log('Encrypted:', jj.isEncryptionEnabled()); // true

// Disable when done
jj.disableEncryption();
```

## 📊 Performance Metrics

### Operation Statistics

```javascript
const stats = JSON.parse(jj.getStats());

console.log(`Total Operations: ${stats.total_operations}`);
console.log(`Success Rate: ${(stats.success_rate * 100).toFixed(1)}%`);
console.log(`Average Duration: ${stats.avg_duration_ms.toFixed(2)}ms`);
```

### Recent Operations

```javascript
// Get last 10 operations
const ops = jj.getOperations(10);

ops.forEach(op => {
    console.log(`${op.operationType}: ${op.command}`);
    console.log(`  Duration: ${op.durationMs}ms`);
    console.log(`  Success: ${op.success}`);
});

// Get user operations only (excludes snapshots)
const userOps = jj.getUserOperations(20);
```

## 🎯 Best Practices

### 1. Meaningful Task Descriptions

```javascript
// ✅ Good: Specific and descriptive
jj.startTrajectory('Implement user authentication with JWT tokens');

// ❌ Bad: Vague
jj.startTrajectory('fix stuff');
```

### 2. Honest Success Scores

```javascript
// ✅ Good: Realistic assessment
jj.finalizeTrajectory(0.7, 'Works but needs refactoring');

// ❌ Bad: Always perfect (prevents learning)
jj.finalizeTrajectory(1.0, 'Perfect!');
```

### 3. Record All Outcomes

```javascript
// ✅ Good: Always finalize trajectories
try {
    await jj.execute(['complex-operation']);
    jj.finalizeTrajectory(0.9, 'Success');
} catch (err) {
    jj.finalizeTrajectory(0.3, `Failed: ${err.message}. Root cause: ...`);
}

// ❌ Bad: Silent failures
try {
    await jj.execute(['operation']);
} catch (err) {
    // Missing finalization - no learning!
}
```

### 4. Build Pattern Library

```javascript
// Execute similar tasks multiple times to build patterns
for (let i = 0; i < 5; i++) {
    jj.startTrajectory('Deploy feature');
    const success = await deploy();
    jj.addToTrajectory();
    jj.finalizeTrajectory(success ? 0.9 : 0.5);
}

// After 3-5 trajectories, patterns emerge
const patterns = JSON.parse(jj.getPatterns());
```

## 🔧 Advanced Use Cases

### Use Case 1: Adaptive Deployment

```javascript
async function smartDeploy(environment) {
    const jj = new JjWrapper();

    // Get AI recommendation
    const suggestion = JSON.parse(jj.getSuggestion(`Deploy to ${environment}`));

    console.log(`Deploying with ${(suggestion.confidence * 100).toFixed(0)}% confidence`);

    jj.startTrajectory(`Deploy to ${environment}`);

    // Follow AI recommendations
    for (const op of suggestion.recommendedOperations) {
        await executeOperation(op);
    }

    jj.addToTrajectory();

    const success = await verifyDeployment();
    jj.finalizeTrajectory(
        success ? 0.95 : 0.5,
        success ? 'Deployment successful' : 'Issues detected'
    );
}
```

### Use Case 2: Error Pattern Detection

```javascript
async function smartMerge(branch) {
    const jj = new JjWrapper();

    // Check past merge attempts
    const similar = JSON.parse(jj.queryTrajectories(`merge ${branch}`, 10));
    const failures = similar.filter(t => t.successScore < 0.5);

    if (failures.length > 0) {
        console.log('⚠️ Similar merges failed:');
        failures.forEach(f => console.log(`  - ${f.critique}`));
    }

    // Get AI recommendation
    const suggestion = JSON.parse(jj.getSuggestion(`merge ${branch}`));

    if (suggestion.confidence < 0.7) {
        console.log('⚠️ Low confidence. Recommended steps:');
        suggestion.recommendedOperations.forEach(op => console.log(`  - ${op}`));
    }

    // Execute with tracking
    jj.startTrajectory(`Merge ${branch}`);
    try {
        await jj.execute(['merge', branch]);
        jj.addToTrajectory();
        jj.finalizeTrajectory(0.9, 'Merge successful');
    } catch (err) {
        jj.addToTrajectory();
        jj.finalizeTrajectory(0.3, `Failed: ${err.message}`);
    }
}
```

### Use Case 3: Self-Improving Agent

```javascript
class SelfImprovingAgent {
    constructor() {
        this.jj = new JjWrapper();
    }

    async performTask(taskDescription) {
        // Get AI suggestion
        const suggestion = JSON.parse(this.jj.getSuggestion(taskDescription));

        console.log(`Confidence: ${(suggestion.confidence * 100).toFixed(1)}%`);

        this.jj.startTrajectory(taskDescription);

        const startTime = Date.now();
        let success = false;

        try {
            // Execute recommended operations
            for (const op of suggestion.recommendedOperations) {
                await this.execute(op);
            }
            success = true;
        } catch (err) {
            console.error('Task failed:', err.message);
        }

        const duration = Date.now() - startTime;

        this.jj.addToTrajectory();
        this.jj.finalizeTrajectory(
            success ? 0.9 : 0.4,
            success
                ? `Completed in ${duration}ms`
                : `Failed after ${duration}ms`
        );

        // Check improvement
        const stats = JSON.parse(this.jj.getLearningStats());
        console.log(`Improvement: ${(stats.improvementRate * 100).toFixed(1)}%`);

        return success;
    }
}
```

## 🛠️ Validation Rules

### Task Description (v2.3.1+)
- ✅ Cannot be empty or whitespace-only
- ✅ Maximum 10,000 bytes
- ✅ Automatically trimmed

### Success Score
- ✅ Must be finite (not NaN or Infinity)
- ✅ Must be 0.0-1.0 (inclusive)

### Operations
- ✅ Must have at least one before finalizing

### Context
- ✅ Keys cannot be empty
- ✅ Keys max 1,000 bytes
- ✅ Values max 10,000 bytes

## 🐛 Troubleshooting

### Low Confidence Suggestions

```javascript
const suggestion = JSON.parse(jj.getSuggestion('new task'));

if (suggestion.confidence < 0.5) {
    const stats = JSON.parse(jj.getLearningStats());
    console.log(`Need more data. Current: ${stats.totalTrajectories} trajectories`);
    // Recommend: Record 5-10 trajectories first
}
```

### Validation Errors

```javascript
try {
    jj.startTrajectory(''); // Empty task
} catch (err) {
    if (err.message.includes('Validation error')) {
        console.log('Use non-empty task description');
    }
}

try {
    jj.finalizeTrajectory(1.5); // Score > 1.0
} catch (err) {
    // Use score between 0.0 and 1.0
    const clamped = Math.max(0, Math.min(1, score));
    jj.finalizeTrajectory(clamped);
}
```

### No Patterns Discovered

```javascript
const patterns = JSON.parse(jj.getPatterns());

if (patterns.length === 0) {
    // Need more successful trajectories
    // Record at least 3-5 with >70% success rate
}
```

## 📈 Performance Benchmarks

| Metric | Traditional Git | Agentic Jujutsu |
|--------|----------------|-----------------|
| Concurrent commits | 15 ops/s | 350 ops/s |
| Speed | 1x | **23x faster** |
| Context switching | 500-1000ms | 50-100ms |
| Auto conflict resolution | 30-40% | **87%** |
| Lock waiting | 50 min/day | **0 min** |
| Quantum resistant | ❌ | ✅ |

## 🎓 Learning Curve

1. **Day 1-2**: Basic trajectory tracking
2. **Day 3-5**: Build initial pattern library (5-10 trajectories)
3. **Day 6-10**: Start using AI suggestions
4. **Day 11+**: Multi-agent coordination, 70-80% confidence

## 📚 Additional Resources

- **NPM Package**: https://npmjs.com/package/agentic-jujutsu
- **GitHub**: https://github.com/ruvnet/agentic-flow/tree/main/packages/agentic-jujutsu
- **Skill Documentation**: `/.claude/skills/agentic-jujutsu/SKILL.md`
- **Demos**: `/examples/agentic-jujutsu-demo/`

## 🚀 Production Checklist

- [ ] GLIBC 2.32+ environment
- [ ] Git repository initialized
- [ ] Jujutsu VCS configured
- [ ] Initial pattern library (5-10 trajectories)
- [ ] Encryption keys securely stored
- [ ] Multi-agent coordination tested
- [ ] Monitoring/logging enabled
- [ ] Backup strategy for AgentDB

---

**Version**: 2.3.2
**Status**: ✅ Production Ready
**License**: MIT

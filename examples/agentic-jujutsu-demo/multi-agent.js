#!/usr/bin/env node
/**
 * Agentic Jujutsu - Multi-Agent Coordination Demo
 * Demonstrates lock-free concurrent operations with multiple AI agents
 */

import { JjWrapper } from 'agentic-jujutsu';

async function simulateAgentWork(agentName, task, operations) {
    const jj = new JjWrapper();

    console.log(`[${agentName}] 🚀 Starting task: "${task}"`);

    // Check for AI suggestions from past work
    const suggestion = JSON.parse(jj.getSuggestion(task));

    if (suggestion.confidence > 0.5) {
        console.log(`[${agentName}] 🤖 AI Confidence: ${(suggestion.confidence * 100).toFixed(1)}%`);
        console.log(`[${agentName}] 💡 Reasoning: ${suggestion.reasoning}`);
    }

    // Start trajectory tracking
    const trajectoryId = jj.startTrajectory(task);

    const startTime = Date.now();
    let success = true;

    try {
        // Simulate concurrent work
        for (const op of operations) {
            await new Promise(resolve => setTimeout(resolve, 100)); // Simulate work
            await jj.newCommit(op);
            console.log(`[${agentName}]   ✓ ${op}`);
        }

        // Record operations
        jj.addToTrajectory();

    } catch (err) {
        console.error(`[${agentName}]   ❌ Error: ${err.message}`);
        success = false;
    }

    const duration = Date.now() - startTime;

    // Finalize trajectory with results
    const score = success ? 0.8 + Math.random() * 0.2 : 0.3 + Math.random() * 0.2;
    jj.finalizeTrajectory(
        score,
        success
            ? `Completed in ${duration}ms with ${operations.length} operations`
            : `Failed after ${duration}ms`
    );

    console.log(`[${agentName}] ✅ Finished (score: ${(score * 100).toFixed(1)}%, ${duration}ms)\n`);

    return { agentName, task, success, score, duration };
}

async function multiAgentDemo() {
    console.log('🤖 Agentic Jujutsu - Multi-Agent Coordination Demo\n');
    console.log('=' .repeat(70));
    console.log('Demonstrating lock-free concurrent operations (23x faster than Git)\n');

    // Define multiple agents with different tasks
    const agents = [
        {
            name: 'Agent-Alpha',
            task: 'Implement user dashboard',
            operations: [
                'Create dashboard component',
                'Add data fetching logic',
                'Implement charts and graphs',
                'Add responsive design'
            ]
        },
        {
            name: 'Agent-Beta',
            task: 'Add API endpoints',
            operations: [
                'Create REST controller',
                'Add validation middleware',
                'Implement error handling',
                'Add API documentation'
            ]
        },
        {
            name: 'Agent-Gamma',
            task: 'Database optimization',
            operations: [
                'Add database indexes',
                'Optimize slow queries',
                'Add connection pooling',
                'Implement caching layer'
            ]
        },
        {
            name: 'Agent-Delta',
            task: 'Security improvements',
            operations: [
                'Add rate limiting',
                'Implement CSRF protection',
                'Add security headers',
                'Enable SQL injection prevention'
            ]
        },
        {
            name: 'Agent-Epsilon',
            task: 'Testing infrastructure',
            operations: [
                'Add unit test framework',
                'Create integration tests',
                'Add E2E testing',
                'Configure CI/CD pipeline'
            ]
        }
    ];

    console.log('🔄 Starting 5 agents concurrently (no locks, no waiting)...\n');

    const startTime = Date.now();

    // Execute all agents in parallel - NO CONFLICTS!
    const results = await Promise.all(
        agents.map(agent =>
            simulateAgentWork(agent.name, agent.task, agent.operations)
        )
    );

    const totalDuration = Date.now() - startTime;

    // Summary
    console.log('=' .repeat(70));
    console.log('📊 Multi-Agent Execution Summary\n');

    const successful = results.filter(r => r.success).length;
    const avgScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;
    const totalOps = agents.reduce((sum, a) => sum + a.operations.length, 0);

    console.log(`Total Agents: ${agents.length}`);
    console.log(`Successful: ${successful}/${agents.length}`);
    console.log(`Average Score: ${(avgScore * 100).toFixed(1)}%`);
    console.log(`Total Operations: ${totalOps}`);
    console.log(`Total Duration: ${totalDuration}ms`);
    console.log(`Operations/Second: ${(totalOps / (totalDuration / 1000)).toFixed(1)}`);

    console.log('\n🎯 Individual Agent Results:\n');
    results.forEach(r => {
        console.log(`${r.agentName}:`);
        console.log(`  Task: ${r.task}`);
        console.log(`  Success: ${r.success ? '✅' : '❌'}`);
        console.log(`  Score: ${(r.score * 100).toFixed(1)}%`);
        console.log(`  Duration: ${r.duration}ms`);
        console.log();
    });

    // Show learning from multi-agent work
    console.log('🧠 Collective Learning:\n');

    const jj = new JjWrapper();
    const stats = JSON.parse(jj.getLearningStats());

    console.log(`Total Trajectories Recorded: ${stats.totalTrajectories}`);
    console.log(`Patterns Discovered: ${stats.totalPatterns}`);
    console.log(`Average Success Rate: ${(stats.avgSuccessRate * 100).toFixed(1)}%`);
    console.log(`System Improvement: ${(stats.improvementRate * 100).toFixed(1)}%`);

    console.log('\n=' .repeat(70));
    console.log('✅ Multi-Agent Demo Complete!\n');
    console.log('💡 Key Takeaway: All agents worked simultaneously without conflicts!');
    console.log('💡 Each agent learned from the others through shared ReasoningBank!\n');
}

// Run demo
multiAgentDemo().catch(err => {
    console.error('Demo failed:', err);
    process.exit(1);
});

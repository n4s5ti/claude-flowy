#!/usr/bin/env node
/**
 * Agentic Jujutsu - Basic Learning Demo
 * Demonstrates self-learning trajectory tracking with ReasoningBank
 */

import { JjWrapper } from 'agentic-jujutsu';

async function basicLearningDemo() {
    console.log('🧠 Agentic Jujutsu - Basic Learning Demo\n');
    console.log('=' .repeat(60));

    const jj = new JjWrapper();

    // Demo 1: First trajectory - Learn from adding a feature
    console.log('\n📝 Demo 1: Learning from Feature Development\n');

    const trajectoryId1 = jj.startTrajectory('Add user authentication feature');
    console.log(`✅ Started trajectory: ${trajectoryId1}`);

    // Simulate feature development operations
    try {
        await jj.status();
        console.log('  • Checked repository status');

        await jj.newCommit('Add user model');
        console.log('  • Created commit: Add user model');

        await jj.newCommit('Add login endpoint');
        console.log('  • Created commit: Add login endpoint');

        await jj.newCommit('Add JWT validation');
        console.log('  • Created commit: Add JWT validation');

        // Record operations to trajectory
        jj.addToTrajectory();
        console.log('  • Recorded operations to trajectory');

        // Finalize with success score and critique
        jj.finalizeTrajectory(
            0.85,
            'Feature complete. Authentication works well, but could use rate limiting'
        );
        console.log('  • Finalized trajectory (score: 0.85/1.0)');

    } catch (err) {
        console.error('  ❌ Error:', err.message);
        jj.finalizeTrajectory(0.3, `Failed: ${err.message}`);
    }

    // Demo 2: Second trajectory - Similar task to build patterns
    console.log('\n📝 Demo 2: Building Patterns with Similar Task\n');

    const trajectoryId2 = jj.startTrajectory('Add user registration feature');
    console.log(`✅ Started trajectory: ${trajectoryId2}`);

    try {
        await jj.newCommit('Add registration endpoint');
        console.log('  • Created commit: Add registration endpoint');

        await jj.newCommit('Add email validation');
        console.log('  • Created commit: Add email validation');

        await jj.newCommit('Add password hashing');
        console.log('  • Created commit: Add password hashing');

        jj.addToTrajectory();
        jj.finalizeTrajectory(
            0.9,
            'Registration complete with proper validation and security'
        );
        console.log('  • Finalized trajectory (score: 0.90/1.0)');

    } catch (err) {
        console.error('  ❌ Error:', err.message);
        jj.finalizeTrajectory(0.3, `Failed: ${err.message}`);
    }

    // Demo 3: Get AI suggestion based on learned patterns
    console.log('\n🤖 Demo 3: AI-Powered Suggestions\n');

    const suggestion = JSON.parse(jj.getSuggestion('Add password reset feature'));

    console.log('Task: "Add password reset feature"');
    console.log(`\nAI Analysis:`);
    console.log(`  Confidence: ${(suggestion.confidence * 100).toFixed(1)}%`);
    console.log(`  Expected Success Rate: ${(suggestion.expectedSuccessRate * 100).toFixed(1)}%`);
    console.log(`  Estimated Duration: ${suggestion.estimatedDurationMs}ms`);
    console.log(`\nReasoning:`);
    console.log(`  ${suggestion.reasoning}`);
    console.log(`\nRecommended Operations:`);
    suggestion.recommendedOperations.forEach((op, i) => {
        console.log(`  ${i + 1}. ${op}`);
    });

    // Demo 4: Query similar trajectories
    console.log('\n🔍 Demo 4: Querying Similar Past Trajectories\n');

    const similar = JSON.parse(jj.queryTrajectories('Add user feature', 5));
    console.log(`Found ${similar.length} similar trajectories:\n`);

    similar.forEach((traj, i) => {
        console.log(`${i + 1}. Task: "${traj.task}"`);
        console.log(`   Success Score: ${(traj.successScore * 100).toFixed(1)}%`);
        console.log(`   Operations: ${traj.operations.length}`);
        if (traj.critique) {
            console.log(`   Critique: ${traj.critique}`);
        }
        console.log();
    });

    // Demo 5: Learning statistics
    console.log('📊 Demo 5: Learning Statistics\n');

    const stats = JSON.parse(jj.getLearningStats());
    console.log('Learning Progress:');
    console.log(`  Total Trajectories: ${stats.totalTrajectories}`);
    console.log(`  Patterns Discovered: ${stats.totalPatterns}`);
    console.log(`  Average Success Rate: ${(stats.avgSuccessRate * 100).toFixed(1)}%`);
    console.log(`  Improvement Rate: ${(stats.improvementRate * 100).toFixed(1)}%`);
    console.log(`  Prediction Accuracy: ${(stats.predictionAccuracy * 100).toFixed(1)}%`);

    // Demo 6: Discovered patterns
    console.log('\n🎯 Demo 6: Discovered Patterns\n');

    const patterns = JSON.parse(jj.getPatterns());
    if (patterns.length > 0) {
        console.log(`Found ${patterns.length} patterns:\n`);
        patterns.forEach((pattern, i) => {
            console.log(`Pattern ${i + 1}: ${pattern.name}`);
            console.log(`  Success Rate: ${(pattern.successRate * 100).toFixed(1)}%`);
            console.log(`  Observations: ${pattern.observationCount}`);
            console.log(`  Confidence: ${(pattern.confidence * 100).toFixed(1)}%`);
            console.log(`  Operations: ${pattern.operationSequence.join(' → ')}`);
            console.log();
        });
    } else {
        console.log('No patterns discovered yet. Need more trajectories (3-5+).');
    }

    console.log('=' .repeat(60));
    console.log('✅ Basic Learning Demo Complete!\n');
}

// Run demo
basicLearningDemo().catch(err => {
    console.error('Demo failed:', err);
    process.exit(1);
});

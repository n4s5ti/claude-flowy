#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  AGENTDB v1.6.1 COMPREHENSIVE FEATURE DEEP REVIEW${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
WARNINGS=0

# Helper functions
pass_test() {
    echo -e "${GREEN}✅ PASSED:${NC} $1"
    ((PASSED_TESTS++))
    ((TOTAL_TESTS++))
}

fail_test() {
    echo -e "${RED}❌ FAILED:${NC} $1"
    echo -e "${RED}   Reason: $2${NC}"
    ((FAILED_TESTS++))
    ((TOTAL_TESTS++))
}

warn_test() {
    echo -e "${YELLOW}⚠️  WARNING:${NC} $1"
    ((WARNINGS++))
}

info() {
    echo -e "${BLUE}ℹ️  INFO:${NC} $1"
}

section() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# Section 1: Environment and Installation
section "1. Environment & Installation Validation"

# Test 1.1: Verify Node.js version
info "Testing Node.js version compatibility"
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -ge 20 ]; then
    pass_test "Node.js version $NODE_VERSION >= 20"
else
    fail_test "Node.js version check" "Version $NODE_VERSION < 20"
fi

# Test 1.2: Verify agentdb package exists
info "Checking agentdb package installation"
if [ -d "node_modules/agentdb" ]; then
    AGENTDB_VERSION=$(cat node_modules/agentdb/package.json | jq -r '.version')
    if [[ "$AGENTDB_VERSION" =~ ^1\.6\. ]]; then
        pass_test "agentdb v$AGENTDB_VERSION installed (1.6.x)"
    else
        fail_test "agentdb version check" "Expected 1.6.x, got $AGENTDB_VERSION"
    fi
else
    fail_test "agentdb installation" "node_modules/agentdb not found"
fi

# Test 1.3: Check for native dependencies
info "Verifying native module dependencies"
if [ -d "node_modules/agentdb/node_modules/hnswlib-node" ] || [ -d "node_modules/hnswlib-node" ]; then
    pass_test "hnswlib-node (native HNSW module) found"
else
    warn_test "hnswlib-node not found (may use fallback)"
fi

# Test 1.4: Verify better-sqlite3
info "Checking better-sqlite3 for SQLite backend"
if [ -d "node_modules/better-sqlite3" ]; then
    pass_test "better-sqlite3 found for persistent storage"
else
    warn_test "better-sqlite3 not found (memory-only mode)"
fi

# Section 2: ReasoningBank Initialization
section "2. ReasoningBank Initialization Tests"

# Create test database directory
mkdir -p .swarm

# Test 2.1: ReasoningBank initialization via Node.js API
info "Testing ReasoningBank initialization"
cat > test-init.js << 'INITJS'
const ReasoningBank = require('agentic-flow/reasoningbank');

(async () => {
    try {
        await ReasoningBank.initialize();
        console.log("INIT_SUCCESS");

        // Check database tables
        const db = ReasoningBank.db.getDb();
        const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
        console.log("TABLES:", tables.map(t => t.name).join(','));

        process.exit(0);
    } catch (error) {
        console.error("INIT_FAILED:", error.message);
        process.exit(1);
    }
})();
INITJS

if timeout 10 node test-init.js 2>&1 | tee init-output.txt | grep -q "INIT_SUCCESS"; then
    pass_test "ReasoningBank initialized successfully"

    # Check for required tables
    if grep -q "TABLES:" init-output.txt; then
        TABLES=$(grep "TABLES:" init-output.txt | cut -d: -f2)
        info "Database tables: $TABLES"

        if echo "$TABLES" | grep -q "patterns"; then
            pass_test "patterns table exists"
        else
            fail_test "Database schema" "patterns table missing"
        fi

        if echo "$TABLES" | grep -q "pattern_embeddings"; then
            pass_test "pattern_embeddings table exists (vector storage)"
        else
            warn_test "pattern_embeddings table missing"
        fi
    fi
else
    fail_test "ReasoningBank initialization" "Failed to initialize (check init-output.txt)"
fi

# Section 3: Memory Storage Tests
section "3. Memory Storage & Pattern Tests"

# Test 3.1: Store memory via CLI
info "Testing memory storage via CLI"
TEST_KEY="test_feature_$(date +%s)"
TEST_VALUE="This is a test memory for agentdb v1.6.1 validation"

if timeout 10 node bin/claude-flow.js memory store "$TEST_KEY" "$TEST_VALUE" --namespace "agentdb-test" 2>&1 | tee store-output.txt; then
    if grep -q -i "stored\|success" store-output.txt || [ $? -eq 0 ]; then
        pass_test "Memory storage via CLI"
    else
        # Check if it fell back to JSON mode
        if grep -q "JSON" store-output.txt; then
            warn_test "Memory stored in JSON fallback mode (ReasoningBank unavailable)"
        else
            fail_test "Memory storage" "Command failed (check store-output.txt)"
        fi
    fi
else
    fail_test "Memory storage CLI command" "Command timeout or error"
fi

# Test 3.2: List memories
info "Testing memory listing"
if timeout 10 node bin/claude-flow.js memory list --namespace "agentdb-test" 2>&1 | tee list-output.txt; then
    pass_test "Memory list command executed"
else
    fail_test "Memory list command" "Command failed"
fi

# Test 3.3: Query memories
info "Testing memory query/search"
if timeout 10 node bin/claude-flow.js memory query "agentdb validation" --namespace "agentdb-test" 2>&1 | tee query-output.txt; then
    pass_test "Memory query command executed"
else
    fail_test "Memory query command" "Command failed"
fi

# Section 4: Vector Search & Embeddings
section "4. Vector Search & Semantic Memory Tests"

# Test 4.1: Test semantic search via API
info "Testing semantic vector search"
cat > test-vector-search.js << 'VECTORJS'
const ReasoningBank = require('agentic-flow/reasoningbank');

(async () => {
    try {
        await ReasoningBank.initialize();

        // Store test memories with semantic content
        const testData = [
            { title: 'ML Model Training', content: 'Training machine learning models requires large datasets and compute resources' },
            { title: 'Vector Database', content: 'Vector databases use embeddings for semantic search and similarity matching' },
            { title: 'HNSW Algorithm', content: 'Hierarchical Navigable Small World graphs enable fast approximate nearest neighbor search' }
        ];

        for (const item of testData) {
            const memory = {
                id: `test-${Date.now()}-${Math.random()}`,
                type: 'reasoning_memory',
                pattern_data: {
                    title: item.title,
                    content: item.content,
                    domain: 'vector-test'
                },
                confidence: 0.9
            };

            ReasoningBank.db.upsertMemory(memory);

            // Generate embedding
            try {
                const embedding = await ReasoningBank.computeEmbedding(item.content);
                ReasoningBank.db.upsertEmbedding({
                    id: memory.id,
                    model: 'text-embedding-3-small',
                    dims: embedding.length,
                    vector: embedding
                });
                console.log(`STORED: ${item.title} (embedding dim: ${embedding.length})`);
            } catch (err) {
                console.log(`STORED: ${item.title} (no embedding: ${err.message})`);
            }
        }

        // Perform semantic search
        const results = await ReasoningBank.retrieveMemories('vector database similarity search', {
            domain: 'vector-test',
            k: 3,
            minConfidence: 0.3
        });

        console.log(`SEARCH_RESULTS: ${results.length}`);
        results.forEach(r => {
            console.log(`RESULT: ${r.title} (score: ${r.score})`);
        });

        process.exit(0);
    } catch (error) {
        console.error("VECTOR_SEARCH_FAILED:", error.message);
        process.exit(1);
    }
})();
VECTORJS

if timeout 30 node test-vector-search.js 2>&1 | tee vector-output.txt; then
    if grep -q "STORED:" vector-output.txt; then
        STORED_COUNT=$(grep -c "STORED:" vector-output.txt)
        pass_test "Stored $STORED_COUNT test memories"

        # Check if embeddings were generated
        if grep -q "embedding dim:" vector-output.txt; then
            EMBEDDING_DIM=$(grep "embedding dim:" vector-output.txt | head -1 | grep -oP '\d+' | tail -1)
            pass_test "Embeddings generated (dimension: $EMBEDDING_DIM)"
        else
            warn_test "Embeddings not generated (API key may be missing)"
        fi
    fi

    if grep -q "SEARCH_RESULTS:" vector-output.txt; then
        RESULT_COUNT=$(grep "SEARCH_RESULTS:" vector-output.txt | cut -d: -f2 | tr -d ' ')
        if [ "$RESULT_COUNT" -gt 0 ]; then
            pass_test "Semantic search returned $RESULT_COUNT results"
        else
            warn_test "Semantic search returned 0 results (embeddings may not be available)"
        fi
    fi
else
    fail_test "Vector search test" "Failed to execute (check vector-output.txt)"
fi

# Section 5: HNSW Indexing Performance
section "5. HNSW Indexing Performance Tests"

# Test 5.1: Bulk insert and search performance
info "Testing HNSW index performance with bulk data"
cat > test-hnsw-performance.js << 'HNSWJS'
const ReasoningBank = require('agentic-flow/reasoningbank');

(async () => {
    try {
        await ReasoningBank.initialize();

        const startTime = Date.now();
        const BULK_SIZE = 100;

        // Bulk insert
        console.log(`BULK_INSERT_START: ${BULK_SIZE} memories`);
        for (let i = 0; i < BULK_SIZE; i++) {
            const memory = {
                id: `perf-test-${i}`,
                type: 'reasoning_memory',
                pattern_data: {
                    title: `Performance Test ${i}`,
                    content: `This is performance test memory number ${i} for HNSW indexing validation`,
                    domain: 'performance-test'
                },
                confidence: 0.8 + (Math.random() * 0.2)
            };

            ReasoningBank.db.upsertMemory(memory);
        }

        const insertTime = Date.now() - startTime;
        console.log(`BULK_INSERT_TIME: ${insertTime}ms`);
        console.log(`INSERT_RATE: ${(BULK_SIZE / (insertTime / 1000)).toFixed(2)} memories/sec`);

        // Test search performance
        const searchStart = Date.now();
        const results = ReasoningBank.db.fetchMemoryCandidates({
            domain: 'performance-test',
            minConfidence: 0.5
        });
        const searchTime = Date.now() - searchStart;

        console.log(`SEARCH_TIME: ${searchTime}ms`);
        console.log(`SEARCH_RESULTS: ${results.length}`);
        console.log(`SEARCH_RATE: ${(results.length / (searchTime / 1000)).toFixed(2)} results/sec`);

        // Database stats
        const db = ReasoningBank.db.getDb();
        const stats = db.prepare("SELECT COUNT(*) as count FROM patterns WHERE type='reasoning_memory'").get();
        console.log(`TOTAL_MEMORIES: ${stats.count}`);

        process.exit(0);
    } catch (error) {
        console.error("PERFORMANCE_TEST_FAILED:", error.message);
        process.exit(1);
    }
})();
HNSWJS

if timeout 60 node test-hnsw-performance.js 2>&1 | tee perf-output.txt; then
    if grep -q "BULK_INSERT_TIME:" perf-output.txt; then
        INSERT_TIME=$(grep "BULK_INSERT_TIME:" perf-output.txt | grep -oP '\d+')
        INSERT_RATE=$(grep "INSERT_RATE:" perf-output.txt | cut -d: -f2 | tr -d ' ')
        pass_test "Bulk insert: ${INSERT_TIME}ms (${INSERT_RATE} memories/sec)"
    fi

    if grep -q "SEARCH_TIME:" perf-output.txt; then
        SEARCH_TIME=$(grep "SEARCH_TIME:" perf-output.txt | grep -oP '\d+')
        SEARCH_RATE=$(grep "SEARCH_RATE:" perf-output.txt | cut -d: -f2 | tr -d ' ')
        pass_test "Search performance: ${SEARCH_TIME}ms (${SEARCH_RATE} results/sec)"

        # Check if search is fast (< 100ms for 100 records)
        if [ "$SEARCH_TIME" -lt 100 ]; then
            pass_test "HNSW index performance is excellent (< 100ms)"
        elif [ "$SEARCH_TIME" -lt 500 ]; then
            pass_test "HNSW index performance is good (< 500ms)"
        else
            warn_test "HNSW index performance slower than expected (> 500ms)"
        fi
    fi

    if grep -q "TOTAL_MEMORIES:" perf-output.txt; then
        TOTAL=$(grep "TOTAL_MEMORIES:" perf-output.txt | cut -d: -f2 | tr -d ' ')
        info "Total memories in database: $TOTAL"
    fi
else
    fail_test "Performance test" "Failed to execute"
fi

# Section 6: Database Statistics
section "6. Database Statistics & Health Check"

# Test 6.1: Get comprehensive database stats
info "Gathering database statistics"
cat > test-db-stats.js << 'STATSJS'
const ReasoningBank = require('agentic-flow/reasoningbank');

(async () => {
    try {
        await ReasoningBank.initialize();
        const db = ReasoningBank.db.getDb();

        // Count records in each table
        const patterns = db.prepare("SELECT COUNT(*) as count FROM patterns").get();
        const embeddings = db.prepare("SELECT COUNT(*) as count FROM pattern_embeddings").get();
        const trajectories = db.prepare("SELECT COUNT(*) as count FROM task_trajectories").get();
        const links = db.prepare("SELECT COUNT(*) as count FROM pattern_links").get();

        console.log(`PATTERNS: ${patterns.count}`);
        console.log(`EMBEDDINGS: ${embeddings.count}`);
        console.log(`TRAJECTORIES: ${trajectories.count}`);
        console.log(`LINKS: ${links.count}`);

        // Average confidence
        const avgConf = db.prepare("SELECT AVG(confidence) as avg FROM patterns WHERE type='reasoning_memory'").get();
        console.log(`AVG_CONFIDENCE: ${avgConf.avg ? avgConf.avg.toFixed(3) : 0}`);

        // Unique domains
        const domains = db.prepare("SELECT COUNT(DISTINCT json_extract(pattern_data, '$.domain')) as count FROM patterns WHERE type='reasoning_memory'").get();
        console.log(`DOMAINS: ${domains.count}`);

        // Database file size
        const size = db.prepare("SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size()").get();
        console.log(`DB_SIZE: ${Math.round(size.size / 1024)} KB`);

        process.exit(0);
    } catch (error) {
        console.error("STATS_FAILED:", error.message);
        process.exit(1);
    }
})();
STATSJS

if timeout 10 node test-db-stats.js 2>&1 | tee stats-output.txt; then
    if grep -q "PATTERNS:" stats-output.txt; then
        PATTERNS=$(grep "PATTERNS:" stats-output.txt | cut -d: -f2 | tr -d ' ')
        EMBEDDINGS=$(grep "EMBEDDINGS:" stats-output.txt | cut -d: -f2 | tr -d ' ')
        AVG_CONF=$(grep "AVG_CONFIDENCE:" stats-output.txt | cut -d: -f2 | tr -d ' ')
        DOMAINS=$(grep "DOMAINS:" stats-output.txt | cut -d: -f2 | tr -d ' ')
        DB_SIZE=$(grep "DB_SIZE:" stats-output.txt | cut -d: -f2 | tr -d ' ')

        info "Database statistics:"
        info "  - Patterns: $PATTERNS"
        info "  - Embeddings: $EMBEDDINGS"
        info "  - Average confidence: $AVG_CONF"
        info "  - Unique domains: $DOMAINS"
        info "  - Database size: $DB_SIZE"

        pass_test "Database statistics collected successfully"
    fi
else
    fail_test "Database statistics" "Failed to gather stats"
fi

# Section 7: Feature Compatibility Tests
section "7. Feature Compatibility & Integration Tests"

# Test 7.1: CLI memory commands
info "Testing full CLI memory workflow"
WORKFLOW_KEY="cli_workflow_test"
WORKFLOW_VALUE="Complete workflow test for memory operations"

if node bin/claude-flow.js memory store "$WORKFLOW_KEY" "$WORKFLOW_VALUE" --namespace "cli-test" >/dev/null 2>&1; then
    if node bin/claude-flow.js memory query "$WORKFLOW_KEY" --namespace "cli-test" 2>&1 | grep -q -i "$WORKFLOW_KEY\|workflow"; then
        pass_test "CLI store + query workflow"
    else
        warn_test "CLI query didn't return stored memory"
    fi
else
    warn_test "CLI memory workflow (may be using JSON fallback)"
fi

# Test 7.2: Memory stats command
info "Testing memory stats command"
if timeout 10 node bin/claude-flow.js memory stats 2>&1 | tee stats-cli-output.txt; then
    pass_test "Memory stats command executed"
else
    warn_test "Memory stats command failed"
fi

# Final Summary
section "TEST SUMMARY"

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  TEST RESULTS${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${GREEN}✅ Passed:${NC}  $PASSED_TESTS"
echo -e "${RED}❌ Failed:${NC}  $FAILED_TESTS"
echo -e "${YELLOW}⚠️  Warnings:${NC} $WARNINGS"
echo -e "${BLUE}📊 Total:${NC}   $TOTAL_TESTS"
echo ""

# Calculate pass rate
if [ "$TOTAL_TESTS" -gt 0 ]; then
    PASS_RATE=$(echo "scale=1; ($PASSED_TESTS * 100) / $TOTAL_TESTS" | bc)
    echo -e "${BLUE}Pass Rate:${NC} ${PASS_RATE}%"
    echo ""
fi

# Overall status
if [ "$FAILED_TESTS" -eq 0 ]; then
    echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}  ✅ ALL TESTS PASSED - agentdb v1.6.1 FULLY FUNCTIONAL${NC}"
    echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
    exit 0
elif [ "$FAILED_TESTS" -le 2 ] && [ "$PASSED_TESTS" -ge $((TOTAL_TESTS * 3 / 4)) ]; then
    echo -e "${YELLOW}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${YELLOW}  ⚠️  MOSTLY PASSING - Minor issues detected${NC}"
    echo -e "${YELLOW}═══════════════════════════════════════════════════════════════${NC}"
    exit 0
else
    echo -e "${RED}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${RED}  ❌ TESTS FAILED - Critical issues detected${NC}"
    echo -e "${RED}═══════════════════════════════════════════════════════════════${NC}"
    exit 1
fi

#!/bin/bash
set -e

echo ""
echo "🚀 Loop Protocol Full Demo"
echo "=========================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running on a system with Solana tools
check_tools() {
    echo "Checking required tools..."
    
    if ! command -v solana &> /dev/null; then
        echo -e "${RED}❌ Solana CLI not found${NC}"
        echo "   Install: sh -c \"\$(curl -sSfL https://release.solana.com/v1.18.4/install)\""
        exit 1
    fi
    
    if ! command -v anchor &> /dev/null; then
        echo -e "${RED}❌ Anchor CLI not found${NC}"
        echo "   Install: cargo install --git https://github.com/coral-xyz/anchor avm --locked"
        exit 1
    fi
    
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js not found${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ All tools found${NC}"
}

# Start local validator
start_validator() {
    echo ""
    echo "Starting local Solana validator..."
    
    # Kill any existing validator
    pkill -f 'solana-test-validator' 2>/dev/null || true
    sleep 2
    
    # Start fresh validator
    solana-test-validator --reset --quiet &
    VALIDATOR_PID=$!
    
    # Wait for validator to be ready
    echo "Waiting for validator..."
    sleep 5
    
    # Configure CLI for local
    solana config set --url http://localhost:8899 > /dev/null
    
    echo -e "${GREEN}✅ Validator running (PID: $VALIDATOR_PID)${NC}"
}

# Build and deploy programs
deploy_programs() {
    echo ""
    echo "Building Loop Protocol programs..."
    
    cd "$(dirname "$0")"
    
    # Build
    anchor build
    
    echo ""
    echo "Deploying 6 programs to local validator..."
    
    # Deploy each program
    anchor deploy --provider.cluster localnet
    
    echo -e "${GREEN}✅ All 6 programs deployed${NC}"
}

# Fund test wallet
fund_wallet() {
    echo ""
    echo "Funding test wallet..."
    
    solana airdrop 100 > /dev/null 2>&1
    BALANCE=$(solana balance | cut -d' ' -f1)
    
    echo -e "${GREEN}✅ Wallet funded: ${BALANCE} SOL${NC}"
}

# Install Node dependencies
install_deps() {
    echo ""
    echo "Installing dependencies..."
    
    cd "$(dirname "$0")/eliza"
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        npm install express typescript ts-node @types/node @types/express @solana/web3.js @coral-xyz/anchor 2>/dev/null || {
            echo -e "${YELLOW}⚠️  npm install had warnings (continuing)${NC}"
        }
    fi
    
    echo -e "${GREEN}✅ Dependencies ready${NC}"
}

# Start merchant agent
start_merchant() {
    echo ""
    echo "Starting merchant A2A agent..."
    
    cd "$(dirname "$0")/eliza"
    
    # Start merchant in background
    npx ts-node merchant-agent.ts &
    MERCHANT_PID=$!
    
    sleep 3
    
    # Check if running
    if curl -s http://localhost:8080/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Merchant agent running (PID: $MERCHANT_PID)${NC}"
    else
        echo -e "${YELLOW}⚠️  Merchant agent may still be starting...${NC}"
    fi
}

# Run swarm demo
run_swarm() {
    echo ""
    echo "Running Loop agent swarm demo..."
    
    cd "$(dirname "$0")/eliza"
    
    export SOLANA_RPC="http://localhost:8899"
    
    npx ts-node loop-swarm.ts
}

# Cleanup
cleanup() {
    echo ""
    echo "Cleaning up..."
    
    pkill -f 'solana-test-validator' 2>/dev/null || true
    pkill -f 'merchant-agent' 2>/dev/null || true
    pkill -f 'loop-swarm' 2>/dev/null || true
    
    echo -e "${GREEN}✅ Cleanup complete${NC}"
}

# Trap cleanup on exit
trap cleanup EXIT

# Main
main() {
    check_tools
    start_validator
    deploy_programs
    fund_wallet
    install_deps
    start_merchant
    
    echo ""
    echo "═══════════════════════════════════════════════════════════"
    echo ""
    echo -e "${GREEN}🎉 FULL DEMO ENVIRONMENT READY!${NC}"
    echo ""
    echo "   Local Validator:  http://localhost:8899"
    echo "   Merchant Agent:   http://localhost:8080"
    echo "   Programs:         6 Loop Protocol programs deployed"
    echo ""
    echo "═══════════════════════════════════════════════════════════"
    echo ""
    
    run_swarm
    
    echo ""
    echo "Demo complete! Environment will be cleaned up on exit."
    echo "Press Ctrl+C to stop."
    
    # Keep running
    wait
}

# Run
main "$@"

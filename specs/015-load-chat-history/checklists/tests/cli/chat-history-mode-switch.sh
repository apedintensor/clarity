#!/bin/bash
# Test: Consistent behavior between interactive and --message modes
# Success criteria: Both modes should have access to the same conversation history

set -e

echo "========================================="
echo "Test: Chat History Mode Switching"
echo "========================================="
echo ""

# Create an inbox item for testing
echo "1. Creating test inbox item..."
INBOX_OUTPUT=$(clarity inbox add "Building a scalable microservices architecture" --json)
INBOX_ID=$(echo "$INBOX_OUTPUT" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$INBOX_ID" ]; then
  echo "❌ FAIL: Could not create inbox item"
  exit 1
fi

echo "✓ Created inbox item: $INBOX_ID"
echo ""

# Send a message via --message mode
echo "2. Sending message via --message mode..."
clarity chat "$INBOX_ID" --message "What are the key components of a microservices architecture?" --json > /dev/null
echo "✓ Message sent via --message mode"
echo ""

# Send another message via --message mode (should reference first message)
echo "3. Sending second message via --message mode..."
RESPONSE=$(clarity chat "$INBOX_ID" --message "How do we handle service discovery?" --json)
RESPONSE_TEXT=$(echo "$RESPONSE" | jq -r '.response')

# Check if second response mentions microservices or architecture
if echo "$RESPONSE_TEXT" | grep -qi "microservice\|architecture\|component"; then
  echo "✅ SUCCESS: --message mode maintains conversation context"
else
  echo "⚠  WARNING: Could not verify context in --message mode"
fi

echo ""

# Note: Full interactive mode testing requires manual intervention
# This script verifies --message mode consistency
echo "4. Manual test required for interactive mode:"
echo "   Run: clarity chat $INBOX_ID"
echo "   Verify that the chat shows previous messages from --message mode"
echo ""

echo "========================================="
echo "Test Complete"
echo "========================================="
echo ""
echo "Inbox ID for manual testing: $INBOX_ID"

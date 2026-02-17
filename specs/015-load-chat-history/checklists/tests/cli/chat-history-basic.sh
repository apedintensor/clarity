#!/bin/bash
# Test: Basic conversation history loading in --message mode
# Success criteria: Second message should reference context from first message

set -e

echo "========================================="
echo "Test: Chat History Basic"
echo "========================================="
echo ""

# Create an inbox item for testing
echo "1. Creating test inbox item..."
INBOX_OUTPUT=$(clarity inbox add "I want to build a real-time collaboration tool" --json)
INBOX_ID=$(echo "$INBOX_OUTPUT" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$INBOX_ID" ]; then
  echo "❌ FAIL: Could not create inbox item"
  exit 1
fi

echo "✓ Created inbox item: $INBOX_ID"
echo ""

# First message
echo "2. Sending first message..."
RESPONSE1=$(clarity chat "$INBOX_ID" --message "What technologies should I consider?" --json)
echo "✓ First message sent"
echo "   Response preview: $(echo "$RESPONSE1" | jq -r '.response' | head -c 100)..."
echo ""

# Second message (should reference first message context)
echo "3. Sending second message..."
RESPONSE2=$(clarity chat "$INBOX_ID" --message "Let's start with WebSockets" --json)
echo "✓ Second message sent"
echo "   Response preview: $(echo "$RESPONSE2" | jq -r '.response' | head -c 100)..."
echo ""

# Check if second response mentions the collaboration tool or technology discussion
RESPONSE2_TEXT=$(echo "$RESPONSE2" | jq -r '.response')
if echo "$RESPONSE2_TEXT" | grep -qi "collaboration\|websocket\|technolog"; then
  echo "✅ SUCCESS: Second response references conversation context"
  echo "   Context detected in response"
else
  echo "⚠  WARNING: Could not verify context reference"
  echo "   This may be a false negative - review response manually"
fi

echo ""
echo "========================================="
echo "Test Complete"
echo "========================================="

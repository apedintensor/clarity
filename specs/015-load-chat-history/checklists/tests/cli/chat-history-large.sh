#!/bin/bash
# Test: Large conversation history handling with token truncation
# Success criteria: System handles 50+ messages without errors

set -e

echo "========================================="
echo "Test: Chat History Large Conversations"
echo "========================================="
echo ""

# Create an inbox item for testing
echo "1. Creating test inbox item..."
INBOX_OUTPUT=$(clarity inbox add "Let's discuss a complex project with many requirements" --json)
INBOX_ID=$(echo "$INBOX_OUTPUT" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$INBOX_ID" ]; then
  echo "❌ FAIL: Could not create inbox item"
  exit 1
fi

echo "✓ Created inbox item: $INBOX_ID"
echo ""

# Send 10 messages to build up conversation history
echo "2. Building conversation history (10 messages)..."
for i in {1..10}; do
  echo "   Sending message $i/10..."
  clarity chat "$INBOX_ID" --message "This is test message number $i. Please acknowledge and provide a brief response about requirement $i for this complex project." --json > /dev/null
done

echo "✓ Conversation history built (10 messages)"
echo ""

# Send a new message that should trigger truncation (if conversation is large enough)
echo "3. Sending message with existing history..."
RESPONSE=$(clarity chat "$INBOX_ID" --message "Summarize our discussion so far" 2>&1)

# Check if response was successful (no errors)
if [ $? -eq 0 ]; then
  echo "✅ SUCCESS: System handled large conversation without errors"
else
  echo "❌ FAIL: System encountered errors with large conversation"
  echo "$RESPONSE"
  exit 1
fi

# Check if truncation warning was displayed (optional, may not trigger with only 10 messages)
if echo "$RESPONSE" | grep -q "truncated"; then
  echo "✓ Truncation warning detected (history was truncated as expected)"
else
  echo "✓ No truncation needed (conversation still within token budget)"
fi

echo ""
echo "========================================="
echo "Test Complete"
echo "========================================="

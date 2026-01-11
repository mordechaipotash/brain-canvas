# /canvas - Interactive Visual Display

Render structured content to a live browser canvas and receive user choices.

## Usage

```
/canvas <content-description>
```

## What This Skill Does

1. Ensures brain-canvas server is running on port 3333
2. Sends structured JSON to render in the browser
3. Polls for user choice (auto-waits up to 60 seconds)
4. Returns the selected choice to the conversation

## Instructions for Claude

When this skill is invoked:

### Step 1: Check/Start Server

```bash
# Check if server is running
curl -s http://localhost:3333/v 2>/dev/null || (cd /Users/mordechai/brain-canvas && node bin/cli.js &)
sleep 1
```

### Step 2: Render Content

Send a POST to `/update` with this JSON structure:

```json
{
  "title": "Main Title",
  "subtitle": "Optional subtitle",
  "query": "Optional top label",
  "sections": [
    { "type": "text", "text": "Plain text content" },
    { "type": "header", "text": "Section Header" },
    { "type": "quote", "text": "Quoted text", "date": "Optional date" },
    { "type": "insight", "text": "Highlighted insight", "label": "INSIGHT" },
    { "type": "principle", "text": "Principle text", "name": "PRINCIPLE NAME" },
    { "type": "stats", "items": [
      { "value": "123", "label": "Metric" }
    ]},
    { "type": "timeline", "title": "Timeline", "items": [
      { "date": "2024-01", "text": "Event description" }
    ]},
    { "type": "comparison", "old": ["Old item 1"], "new": ["New item 1"] },
    { "type": "choices", "items": [
      { "id": "option1", "label": "Option 1", "desc": "Description", "color": "green" },
      { "id": "option2", "label": "Option 2", "desc": "Description", "color": "blue" }
    ]},
    { "type": "divider" }
  ]
}
```

**Colors for choices:** green, blue, yellow, red (or omit for default)

### Step 3: Poll for Choice

After rendering, poll `/choice` until user selects:

```bash
# Poll every 2 seconds, max 30 attempts (60 seconds)
for i in {1..30}; do
  CHOICE=$(curl -s http://localhost:3333/choice)
  if echo "$CHOICE" | grep -q '"id"'; then
    echo "USER SELECTED: $CHOICE"
    break
  fi
  sleep 2
done
```

### Step 4: Return to Conversation

Parse the choice JSON and continue the conversation based on what the user selected.

The response format is:
```json
{"id": "option1", "label": "Option 1", "t": 1234567890}
```

## Example Flow

User: `/canvas Show me 3 options for dinner`

Claude:
1. Renders canvas with title "Dinner Options" and 3 choice buttons
2. Polls `/choice` endpoint
3. User clicks "Italian"
4. Claude receives `{"id": "italian", "label": "Italian", "t": ...}`
5. Claude continues: "Great choice! Here are some Italian restaurant recommendations..."

## Notes

- Canvas auto-opens in browser on first run
- Page auto-refreshes when content updates (polling every 500ms)
- Keyboard shortcuts 1-9 work for choices
- Choice is consumed on read (one-time retrieval)

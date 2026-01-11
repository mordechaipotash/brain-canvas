# /canvas - Interactive Visual Display

Render structured content to a live browser canvas and receive user choices.

## Usage

```
/canvas <content-description>
```

## CRITICAL: Always Poll After Rendering

**After EVERY render, you MUST poll for the user's choice.** Do not wait for the user to tell you they clicked - poll immediately and wait.

## Instructions for Claude

### Step 1: Render Content

Send a POST to `/update`:

```bash
curl -s -X POST http://localhost:3333/update \
  -H "Content-Type: application/json" \
  -d '{"title": "...", "sections": [...]}'
```

### Step 2: IMMEDIATELY Poll for Choice

**Right after rendering, ALWAYS run this:**

```bash
/Users/mordechai/brain-canvas/bin/wait-choice.sh 120
```

This waits up to 120 seconds for the user to click. The result will be:
- `{"id": "option1", "label": "Option 1", "t": 1234567890}` - user clicked
- `{"error": "timeout", ...}` - no click within timeout

### Step 3: Act on the Choice

Parse the JSON and continue the conversation based on what the user selected.

## JSON Structure

```json
{
  "query": "Optional top label",
  "title": "Main Title",
  "subtitle": "Optional subtitle",
  "sections": [
    { "type": "text", "text": "Plain text" },
    { "type": "header", "text": "Section Header" },
    { "type": "quote", "text": "Quoted text", "date": "Optional" },
    { "type": "insight", "text": "Highlighted", "label": "INSIGHT" },
    { "type": "principle", "text": "Principle", "name": "NAME" },
    { "type": "stats", "items": [{ "value": "123", "label": "Metric" }] },
    { "type": "timeline", "title": "Timeline", "items": [{ "date": "2024", "text": "Event" }] },
    { "type": "comparison", "old": ["Item 1"], "new": ["Item 1"] },
    { "type": "choices", "items": [
      { "id": "opt1", "label": "Option 1", "desc": "Description", "color": "green" }
    ]},
    { "type": "divider" }
  ]
}
```

**Colors:** green, blue, yellow, red

## Example: Complete Flow

```bash
# 1. Render
curl -s -X POST http://localhost:3333/update -H "Content-Type: application/json" -d '{
  "title": "Pick One",
  "sections": [
    { "type": "choices", "items": [
      { "id": "a", "label": "Option A", "color": "green" },
      { "id": "b", "label": "Option B", "color": "blue" }
    ]}
  ]
}'

# 2. IMMEDIATELY poll (don't skip this!)
/Users/mordechai/brain-canvas/bin/wait-choice.sh 120
# Returns: {"id":"a","label":"Option A","t":...}

# 3. Act on choice
# "User chose Option A, now I'll..."
```

## Checklist for Claude

- [ ] Rendered content with POST /update
- [ ] **Immediately ran wait-choice.sh** (don't forget!)
- [ ] Received choice JSON
- [ ] Continued conversation based on choice

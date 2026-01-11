# brain-canvas TODO

## 1. Fix README (from Reddit feedback)

**Source:** u/Emotional_Egg_251 on r/LocalLLaMA

### Issues to fix:
- **Repetition:** Examples section and Use Cases section overlap - consolidate or differentiate
- **"The Thesis" mentioned twice:** Once as a header, once at the bottom in Origin Story
- **Consider human intro:** Replace "The Numbers" table with something like "A 13KB, zero-dependency script that installs in seconds"

### Suggested structure:
```
# brain-canvas
Give any LLM its own display.

npx brain-canvas

[screenshot]

A 13KB, zero-dependency Node.js script that installs in 3 seconds.
Send JSON, get beautiful interactive UI. Choices flow back to your script.

## Quick Start
...

## Section Types
...

## Examples (keep 2-3 best ones, cut the rest)
...

## API Reference
...

## How It Works
...

## Why? (consolidate thesis here)
...

## Origin Story
...
```

---

## 2. MCP Integration

**Idea:** Make brain-canvas callable as an MCP tool so Claude Desktop/Code can use it natively.

### Current flow:
```
Claude → Bash(curl POST /update) → Canvas renders
Claude → Bash(curl GET /choice) → Get user selection
```

### With MCP:
```
Claude → render_canvas(json) → Canvas renders
Claude → get_choice() → Get user selection
```

### Implementation plan:

1. **Create `mcp_brain_canvas_server.py`**
   ```python
   # MCP server that wraps brain-canvas HTTP API

   @tool
   def render_canvas(title: str, sections: list) -> dict:
       """Render content to the brain-canvas display"""
       # POST to localhost:3333/update
       # Return {"ok": true}

   @tool
   def get_choice(timeout: int = 60) -> dict:
       """Wait for and return user's choice from canvas"""
       # Poll localhost:3333/choice until choice or timeout
       # Return {"id": "...", "label": "...", "t": ...}

   @tool
   def clear_canvas() -> dict:
       """Clear the canvas display"""
       # POST empty state
   ```

2. **Add to Claude Desktop config:**
   ```json
   {
     "mcpServers": {
       "brain-canvas": {
         "command": "python",
         "args": ["path/to/mcp_brain_canvas_server.py"]
       }
     }
   }
   ```

3. **Usage in Claude:**
   ```
   User: "Show me 3 options for dinner"
   Claude: [calls render_canvas with choices]
   Claude: [calls get_choice, waits]
   Claude: "You picked Italian! Here are some restaurants..."
   ```

### Benefits:
- No more `curl` commands in conversation
- Cleaner tool calls
- Works with Claude Desktop (not just Claude Code)
- Could publish as separate npm package: `brain-canvas-mcp`

---

## Priority

1. README fix - quick win, improves first impression
2. MCP integration - bigger effort, but unlocks Claude Desktop users

---

*Created: 2026-01-11 during late night build session*

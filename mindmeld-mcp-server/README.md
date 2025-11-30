# MindMeld MCP Server

MCP server for FreeMind mind map operations. Provides 9 tools for creating, editing, and managing mind maps.

## Features

- Create and open FreeMind .mm files
- Add, edit, and delete nodes
- Export to JSON and Markdown
- Full mind map manipulation via natural language

## Available Tools

1. **mindmeld_create** - Create a new mind map
2. **mindmeld_open** - Open an existing .mm file
3. **mindmeld_get_structure** - View current mind map structure
4. **mindmeld_create_node** - Add a new node
5. **mindmeld_update_node** - Edit node text or color
6. **mindmeld_delete_node** - Remove a node
7. **mindmeld_save** - Save to .mm file
8. **mindmeld_export** - Export to JSON or Markdown

## Docker Setup

### Build the Image

```bash
docker build -t mindmeld-mcp-server .
```

### Run the Container

```bash
docker run -i mindmeld-mcp-server
```

### For Development (with volume mount)

```bash
docker run -i -v /path/to/mindmaps:/data mindmeld-mcp-server
```

## Claude Desktop Configuration

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "mindmeld": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "-v",
        "/path/to/your/mindmaps:/data",
        "mindmeld-mcp-server"
      ]
    }
  }
}
```

**Windows Path Example:**
```json
"C:/Users/YourName/Documents/MindMaps:/data"
```

**Mac/Linux Path Example:**
```json
"/Users/yourname/Documents/MindMaps:/data"
```

## Usage Examples

### Create a New Mind Map
```
"Create a new mind map called 'Project Plan'"
```

### Add Nodes
```
"Add a child node to root called 'Backend'"
"Add a node under Backend called 'API Design'"
```

### Update Nodes
```
"Change the text of node_123 to 'Frontend Development'"
"Set the color of node_123 to #FF0000"
```

### Export
```
"Export the mind map as JSON"
"Export as markdown"
```

### Save
```
"Save the mind map to /data/myproject.mm"
```

## File Paths

When running in Docker, use `/data/` as the base path for saving/opening files:
- `/data/mymap.mm` - Maps to your mounted volume
- This allows files to persist outside the container

## Development

### Local Testing (without Docker)

```bash
npm install
node index.js
```

### Test with MCP Inspector

```bash
npx @modelcontextprotocol/inspector node index.js
```

## License

MIT

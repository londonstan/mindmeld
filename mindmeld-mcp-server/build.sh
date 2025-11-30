#!/bin/bash

echo "Building MindMeld MCP Server Docker Image..."
docker build -t mindmeld-mcp-server .

if [ $? -eq 0 ]; then
    echo ""
    echo "✓ Build successful!"
    echo ""
    echo "To run the server, add this to your Claude Desktop config:"
    echo ""
    echo '"mcpServers": {'
    echo '  "mindmeld": {'
    echo '    "command": "docker",'
    echo '    "args": ['
    echo '      "run",'
    echo '      "-i",'
    echo '      "--rm",'
    echo '      "-v",'
    echo '      "/path/to/your/mindmaps:/data",'
    echo '      "mindmeld-mcp-server"'
    echo '    ]'
    echo '  }'
    echo '}'
    echo ""
else
    echo ""
    echo "✗ Build failed!"
    echo "Make sure Docker is running."
fi

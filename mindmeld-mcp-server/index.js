#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { XMLParser, XMLBuilder } from "fast-xml-parser";

// Global state for current mind map
let currentMindMap = null;
let currentFilePath = null;
let nodeIdCounter = 0;

// XML Parser options for FreeMind .mm format
const parserOptions = {
  ignoreAttributes: false,
  attributeNamePrefix: "",
  parseAttributeValue: false,
  trimValues: true,
};

const builderOptions = {
  ignoreAttributes: false,
  attributeNamePrefix: "",
  format: true,
  indentBy: "  ",
  suppressEmptyNode: false,
};

const parser = new XMLParser(parserOptions);
const builder = new XMLBuilder(builderOptions);

// Helper: Generate unique node ID
function generateNodeId() {
  return `node_${Date.now()}_${nodeIdCounter++}`;
}

// Helper: Create empty mind map structure
function createEmptyMindMap(title = "New Mind Map") {
  return {
    map: {
      version: "1.0.1",
      node: {
        ID: "root",
        TEXT: title,
        CREATED: Date.now().toString(),
        MODIFIED: Date.now().toString(),
      },
    },
  };
}

// Helper: Find node by ID recursively
function findNodeById(node, targetId) {
  if (node.ID === targetId) {
    return node;
  }
  
  if (node.node) {
    const children = Array.isArray(node.node) ? node.node : [node.node];
    for (const child of children) {
      const found = findNodeById(child, targetId);
      if (found) return found;
    }
  }
  
  return null;
}

// Helper: Convert mind map to JSON structure for viewing
function mindMapToJson(node) {
  const result = {
    id: node.ID,
    text: node.TEXT || "",
    color: node.COLOR || null,
    backgroundColor: node.BACKGROUND_COLOR || null,
    children: [],
  };
  
  if (node.node) {
    const children = Array.isArray(node.node) ? node.node : [node.node];
    result.children = children.map(child => mindMapToJson(child));
  }
  
  return result;
}

// Helper: Export to Markdown
function exportToMarkdown(node, level = 0) {
  const indent = "  ".repeat(level);
  let markdown = `${indent}- ${node.TEXT || "(no text)"}\n`;
  
  if (node.node) {
    const children = Array.isArray(node.node) ? node.node : [node.node];
    for (const child of children) {
      markdown += exportToMarkdown(child, level + 1);
    }
  }
  
  return markdown;
}

// Tool implementations
async function createMindMap(title = "New Mind Map") {
  currentMindMap = createEmptyMindMap(title);
  currentFilePath = null;
  nodeIdCounter = 0;
  
  return {
    content: [
      {
        type: "text",
        text: `Created new mind map: "${title}"`,
      },
    ],
  };
}

async function openMindMap(filePath) {
  try {
    const fs = await import("fs");
    const xmlContent = fs.readFileSync(filePath, "utf-8");
    currentMindMap = parser.parse(xmlContent);
    currentFilePath = filePath;
    
    return {
      content: [
        {
          type: "text",
          text: `Opened mind map from: ${filePath}`,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error opening file: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
}

async function getStructure() {
  if (!currentMindMap) {
    return {
      content: [
        {
          type: "text",
          text: "No mind map loaded. Create or open a mind map first.",
        },
      ],
      isError: true,
    };
  }
  
  const structure = mindMapToJson(currentMindMap.map.node);
  
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(structure, null, 2),
      },
    ],
  };
}

async function createNode(parentId, text, position = "right") {
  if (!currentMindMap) {
    return {
      content: [
        {
          type: "text",
          text: "No mind map loaded. Create or open a mind map first.",
        },
      ],
      isError: true,
    };
  }
  
  const parent = findNodeById(currentMindMap.map.node, parentId);
  
  if (!parent) {
    return {
      content: [
        {
          type: "text",
          text: `Parent node with ID "${parentId}" not found.`,
        },
      ],
      isError: true,
    };
  }
  
  const newNode = {
    ID: generateNodeId(),
    TEXT: text,
    POSITION: position,
    CREATED: Date.now().toString(),
    MODIFIED: Date.now().toString(),
  };
  
  if (!parent.node) {
    parent.node = newNode;
  } else if (Array.isArray(parent.node)) {
    parent.node.push(newNode);
  } else {
    parent.node = [parent.node, newNode];
  }
  
  return {
    content: [
      {
        type: "text",
        text: `Created node "${text}" with ID: ${newNode.ID}`,
      },
    ],
  };
}

async function updateNode(nodeId, text = null, color = null) {
  if (!currentMindMap) {
    return {
      content: [
        {
          type: "text",
          text: "No mind map loaded. Create or open a mind map first.",
        },
      ],
      isError: true,
    };
  }
  
  const node = findNodeById(currentMindMap.map.node, nodeId);
  
  if (!node) {
    return {
      content: [
        {
          type: "text",
          text: `Node with ID "${nodeId}" not found.`,
        },
      ],
      isError: true,
    };
  }
  
  if (text !== null) {
    node.TEXT = text;
  }
  
  if (color !== null) {
    node.COLOR = color;
  }
  
  node.MODIFIED = Date.now().toString();
  
  return {
    content: [
      {
        type: "text",
        text: `Updated node ${nodeId}`,
      },
    ],
  };
}

async function deleteNode(nodeId) {
  if (!currentMindMap) {
    return {
      content: [
        {
          type: "text",
          text: "No mind map loaded. Create or open a mind map first.",
        },
      ],
      isError: true,
    };
  }
  
  if (nodeId === "root") {
    return {
      content: [
        {
          type: "text",
          text: "Cannot delete root node.",
        },
      ],
      isError: true,
    };
  }
  
  function deleteFromNode(node) {
    if (!node.node) return false;
    
    const children = Array.isArray(node.node) ? node.node : [node.node];
    const index = children.findIndex(child => child.ID === nodeId);
    
    if (index !== -1) {
      if (Array.isArray(node.node)) {
        node.node.splice(index, 1);
        if (node.node.length === 0) {
          delete node.node;
        }
      } else {
        delete node.node;
      }
      return true;
    }
    
    for (const child of children) {
      if (deleteFromNode(child)) {
        return true;
      }
    }
    
    return false;
  }
  
  const deleted = deleteFromNode(currentMindMap.map.node);
  
  if (deleted) {
    return {
      content: [
        {
          type: "text",
          text: `Deleted node ${nodeId}`,
        },
      ],
    };
  } else {
    return {
      content: [
        {
          type: "text",
          text: `Node with ID "${nodeId}" not found.`,
        },
      ],
      isError: true,
    };
  }
}

async function saveMindMap(filePath = null) {
  if (!currentMindMap) {
    return {
      content: [
        {
          type: "text",
          text: "No mind map loaded. Create or open a mind map first.",
        },
      ],
      isError: true,
    };
  }
  
  const saveAs = filePath || currentFilePath;
  
  if (!saveAs) {
    return {
      content: [
        {
          type: "text",
          text: "No file path specified. Provide a file path to save.",
        },
      ],
      isError: true,
    };
  }
  
  try {
    const fs = await import("fs");
    const xmlContent = builder.build(currentMindMap);
    fs.writeFileSync(saveAs, xmlContent, "utf-8");
    currentFilePath = saveAs;
    
    return {
      content: [
        {
          type: "text",
          text: `Saved mind map to: ${saveAs}`,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error saving file: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
}

async function exportMindMap(format = "json") {
  if (!currentMindMap) {
    return {
      content: [
        {
          type: "text",
          text: "No mind map loaded. Create or open a mind map first.",
        },
      ],
      isError: true,
    };
  }
  
  let exportContent;
  
  switch (format.toLowerCase()) {
    case "json":
      exportContent = JSON.stringify(
        mindMapToJson(currentMindMap.map.node),
        null,
        2
      );
      break;
    case "markdown":
    case "md":
      exportContent = exportToMarkdown(currentMindMap.map.node);
      break;
    default:
      return {
        content: [
          {
            type: "text",
            text: `Unknown export format: ${format}. Supported: json, markdown`,
          },
        ],
        isError: true,
      };
  }
  
  return {
    content: [
      {
        type: "text",
        text: exportContent,
      },
    ],
  };
}

// MCP Server setup
const server = new Server(
  {
    name: "mindmeld-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "mindmeld_create",
        description: "Create a new mind map with a given title",
        inputSchema: {
          type: "object",
          properties: {
            title: {
              type: "string",
              description: "Title for the new mind map",
            },
          },
          required: ["title"],
        },
      },
      {
        name: "mindmeld_open",
        description: "Open an existing FreeMind .mm file",
        inputSchema: {
          type: "object",
          properties: {
            file_path: {
              type: "string",
              description: "Path to the .mm file to open",
            },
          },
          required: ["file_path"],
        },
      },
      {
        name: "mindmeld_get_structure",
        description: "Get the current mind map structure as JSON",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "mindmeld_create_node",
        description: "Create a new node in the mind map",
        inputSchema: {
          type: "object",
          properties: {
            parent_id: {
              type: "string",
              description: "ID of the parent node (use 'root' for top level)",
            },
            text: {
              type: "string",
              description: "Text content of the new node",
            },
            position: {
              type: "string",
              description: "Position relative to parent (left/right)",
              enum: ["left", "right"],
            },
          },
          required: ["parent_id", "text"],
        },
      },
      {
        name: "mindmeld_update_node",
        description: "Update an existing node's text or color",
        inputSchema: {
          type: "object",
          properties: {
            node_id: {
              type: "string",
              description: "ID of the node to update",
            },
            text: {
              type: "string",
              description: "New text content (optional)",
            },
            color: {
              type: "string",
              description: "New color in hex format (optional)",
            },
          },
          required: ["node_id"],
        },
      },
      {
        name: "mindmeld_delete_node",
        description: "Delete a node and all its children",
        inputSchema: {
          type: "object",
          properties: {
            node_id: {
              type: "string",
              description: "ID of the node to delete",
            },
          },
          required: ["node_id"],
        },
      },
      {
        name: "mindmeld_save",
        description: "Save the current mind map to a .mm file",
        inputSchema: {
          type: "object",
          properties: {
            file_path: {
              type: "string",
              description: "Path to save the file (optional if file was opened)",
            },
          },
        },
      },
      {
        name: "mindmeld_export",
        description: "Export mind map in different formats (json, markdown)",
        inputSchema: {
          type: "object",
          properties: {
            format: {
              type: "string",
              description: "Export format (json or markdown)",
              enum: ["json", "markdown", "md"],
            },
          },
          required: ["format"],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case "mindmeld_create":
      return await createMindMap(args.title);
    case "mindmeld_open":
      return await openMindMap(args.file_path);
    case "mindmeld_get_structure":
      return await getStructure();
    case "mindmeld_create_node":
      return await createNode(args.parent_id, args.text, args.position);
    case "mindmeld_update_node":
      return await updateNode(args.node_id, args.text, args.color);
    case "mindmeld_delete_node":
      return await deleteNode(args.node_id);
    case "mindmeld_save":
      return await saveMindMap(args.file_path);
    case "mindmeld_export":
      return await exportMindMap(args.format);
    default:
      return {
        content: [
          {
            type: "text",
            text: `Unknown tool: ${name}`,
          },
        ],
        isError: true,
      };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MindMeld MCP server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});

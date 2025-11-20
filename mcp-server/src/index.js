#!/usr/bin/env node

/**
 * MindMeld MCP Server - Fixed Version
 * 
 * Fixes:
 * 1. Attribute naming mismatch (TEXT vs @_TEXT from fast-xml-parser)
 * 2. Path handling for cross-platform compatibility
 * 3. Markdown export returning undefined
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { XMLParser, XMLBuilder } from "fast-xml-parser";
import * as fs from "fs";
import * as path from "path";

// Current mind map state
let currentMindMap = null;
let currentFilePath = null;

// XML Parser options - Use @_ prefix for proper attribute handling
const parserOptions = {
  ignoreAttributes: false,
  attributeNamePrefix: "@_", // Keep prefix for proper XML attribute handling
  allowBooleanAttributes: true,
  parseAttributeValue: false,
  trimValues: true,
};

const builderOptions = {
  ignoreAttributes: false,
  attributeNamePrefix: "@_", // Must match parser prefix
  format: true,
  indentBy: "  ",
  suppressEmptyNode: false,
};

const parser = new XMLParser(parserOptions);
const builder = new XMLBuilder(builderOptions);

// FIX #2: Normalize paths for cross-platform compatibility
function normalizePath(inputPath) {
  if (!inputPath) return inputPath;
  
  // If it's already an absolute path that exists, use it
  if (path.isAbsolute(inputPath)) {
    // Convert forward slashes to platform-specific
    return path.normalize(inputPath);
  }
  
  // For relative paths, resolve from current working directory
  return path.resolve(process.cwd(), inputPath);
}

// Generate unique ID
function generateId() {
  return `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Create a new mind map
function createMindMap(title) {
  const rootId = generateId();
  currentMindMap = {
    map: {
      "@_version": "1.0.1",
      node: {
        "@_TEXT": title,
        "@_ID": rootId,
        node: []
      }
    }
  };
  currentFilePath = null;
  return { rootId, title };
}

// Open existing mind map - FIX #2: Path handling
function openMindMap(filePath) {
  const normalizedPath = normalizePath(filePath);
  
  if (!fs.existsSync(normalizedPath)) {
    throw new Error(`File not found: ${normalizedPath}`);
  }
  
  const content = fs.readFileSync(normalizedPath, "utf-8");
  currentMindMap = parser.parse(content);
  currentFilePath = normalizedPath;
  
  return {
    filePath: normalizedPath,
    rootText: currentMindMap.map.node["@_TEXT"] || "Untitled"
  };
}

// Get structure as JSON
function getStructure() {
  if (!currentMindMap) {
    throw new Error("No mind map is currently loaded");
  }
  return convertToSimpleStructure(currentMindMap.map.node);
}

// Convert internal structure to simple JSON
function convertToSimpleStructure(node) {
  const result = {
    id: node["@_ID"] || "unknown",
    text: node["@_TEXT"] || "Untitled",
    position: node["@_POSITION"] || null,
    color: node["@_COLOR"] || null,
    children: []
  };
  
  if (node.node) {
    const children = Array.isArray(node.node) ? node.node : [node.node];
    result.children = children
      .filter(child => child) // Filter out null/undefined
      .map(child => convertToSimpleStructure(child));
  }
  
  return result;
}

// Find node by ID
function findNode(node, targetId) {
  if (!node) return null;
  
  if (node["@_ID"] === targetId) return node;
  
  if (node.node) {
    const children = Array.isArray(node.node) ? node.node : [node.node];
    for (const child of children) {
      const found = findNode(child, targetId);
      if (found) return found;
    }
  }
  
  return null;
}

// Find parent of node
function findParent(node, targetId, parent = null) {
  if (!node) return null;
  
  if (node["@_ID"] === targetId) return parent;
  
  if (node.node) {
    const children = Array.isArray(node.node) ? node.node : [node.node];
    for (const child of children) {
      const found = findParent(child, targetId, node);
      if (found) return found;
    }
  }
  
  return null;
}

// Create a new node
function createNode(parentId, text, position = null) {
  if (!currentMindMap) {
    throw new Error("No mind map is currently loaded");
  }
  
  const root = currentMindMap.map.node;
  let parent;
  
  if (parentId === "root" || parentId === root["@_ID"]) {
    parent = root;
  } else {
    parent = findNode(root, parentId);
  }
  
  if (!parent) {
    throw new Error(`Parent node not found: ${parentId}`);
  }
  
  const newNode = {
    "@_TEXT": text,
    "@_ID": generateId(),
    node: []
  };
  
  if (position) {
    newNode["@_POSITION"] = position;
  }
  
  // Ensure parent has node array
  if (!parent.node) {
    parent.node = [];
  } else if (!Array.isArray(parent.node)) {
    parent.node = [parent.node];
  }
  
  parent.node.push(newNode);
  
  return {
    nodeId: newNode["@_ID"],
    text: newNode["@_TEXT"],
    parentId: parent["@_ID"],
    parentText: parent["@_TEXT"]
  };
}

// Update existing node
function updateNode(nodeId, text = null, color = null) {
  if (!currentMindMap) {
    throw new Error("No mind map is currently loaded");
  }
  
  const node = findNode(currentMindMap.map.node, nodeId);
  
  if (!node) {
    throw new Error(`Node not found: ${nodeId}`);
  }
  
  if (text !== null) {
    node["@_TEXT"] = text;
  }
  
  if (color !== null) {
    node["@_COLOR"] = color;
  }
  
  return {
    nodeId: node["@_ID"],
    text: node["@_TEXT"],
    color: node["@_COLOR"] || null
  };
}

// Delete node
function deleteNode(nodeId) {
  if (!currentMindMap) {
    throw new Error("No mind map is currently loaded");
  }
  
  const root = currentMindMap.map.node;
  
  if (nodeId === root["@_ID"] || nodeId === "root") {
    throw new Error("Cannot delete root node");
  }
  
  const parent = findParent(root, nodeId);
  
  if (!parent) {
    throw new Error(`Node not found: ${nodeId}`);
  }
  
  if (Array.isArray(parent.node)) {
    const index = parent.node.findIndex(n => n && n["@_ID"] === nodeId);
    if (index !== -1) {
      const deleted = parent.node.splice(index, 1)[0];
      return {
        deletedId: nodeId,
        deletedText: deleted["@_TEXT"],
        parentId: parent["@_ID"]
      };
    }
  } else if (parent.node && parent.node["@_ID"] === nodeId) {
    const deleted = parent.node;
    parent.node = [];
    return {
      deletedId: nodeId,
      deletedText: deleted["@_TEXT"],
      parentId: parent["@_ID"]
    };
  }
  
  throw new Error(`Failed to delete node: ${nodeId}`);
}

// Save mind map - FIX #2: Path handling
function saveMindMap(filePath = null) {
  if (!currentMindMap) {
    throw new Error("No mind map is currently loaded");
  }
  
  const targetPath = filePath ? normalizePath(filePath) : currentFilePath;
  
  if (!targetPath) {
    throw new Error("No file path specified and no current file path");
  }
  
  // Ensure directory exists
  const dir = path.dirname(targetPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  // Build XML
  const xmlContent = builder.build(currentMindMap);
  const fullXml = `<?xml version="1.0" encoding="UTF-8"?>\n${xmlContent}`;
  
  fs.writeFileSync(targetPath, fullXml, "utf-8");
  currentFilePath = targetPath;
  
  return {
    savedTo: targetPath,
    success: true
  };
}

// Export mind map - FIX #1: Handles undefined TEXT
function exportMindMap(format) {
  if (!currentMindMap) {
    throw new Error("No mind map is currently loaded");
  }
  
  if (format === "json") {
    return JSON.stringify(getStructure(), null, 2);
  } else if (format === "markdown") {
    return nodeToMarkdown(currentMindMap.map.node, 0);
  } else {
    throw new Error(`Unknown format: ${format}. Use 'json' or 'markdown'`);
  }
}

// Convert node to markdown - FIX #1: Safely access TEXT
function nodeToMarkdown(node, depth) {
  if (!node) return "";
  
  const indent = "  ".repeat(depth);
  const text = node["@_TEXT"] || "Untitled"; // Safe fallback
  let result = `${indent}- ${text}\n`;
  
  if (node.node) {
    const children = Array.isArray(node.node) ? node.node : [node.node];
    for (const child of children) {
      if (child) { // Skip null/undefined children
        result += nodeToMarkdown(child, depth + 1);
      }
    }
  }
  
  return result;
}

// Create MCP server
const server = new Server(
  {
    name: "mindmeld",
    version: "1.2.0", // Fixed version with proper @_ attribute handling
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
        name: "create_mindmap",
        description: "Create a new mind map with a root node",
        inputSchema: {
          type: "object",
          properties: {
            title: {
              type: "string",
              description: "Title for the root node",
            },
          },
          required: ["title"],
        },
      },
      {
        name: "open_mindmap",
        description: "Open a FreeMind .mm file",
        inputSchema: {
          type: "object",
          properties: {
            file_path: {
              type: "string",
              description: "Path to the .mm file",
            },
          },
          required: ["file_path"],
        },
      },
      {
        name: "get_structure",
        description: "Get the current mind map structure as JSON",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "create_node",
        description: "Add a new node as a child of an existing node",
        inputSchema: {
          type: "object",
          properties: {
            parent_id: {
              type: "string",
              description: 'ID of the parent node (use "root" for root node)',
            },
            text: {
              type: "string",
              description: "Text content of the new node",
            },
            position: {
              type: "string",
              enum: ["left", "right"],
              description: 'Position: "left" or "right" (only for root children)',
            },
          },
          required: ["parent_id", "text"],
        },
      },
      {
        name: "update_node",
        description: "Update properties of an existing node",
        inputSchema: {
          type: "object",
          properties: {
            node_id: {
              type: "string",
              description: "ID of the node to update",
            },
            text: {
              type: "string",
              description: "New text content",
            },
            color: {
              type: "string",
              description: "Node color (hex format like #ff0000)",
            },
          },
          required: ["node_id"],
        },
      },
      {
        name: "delete_node",
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
        name: "save_mindmap",
        description: "Save the current mind map to a .mm file",
        inputSchema: {
          type: "object",
          properties: {
            file_path: {
              type: "string",
              description: "Path where to save the .mm file (optional, uses current path if not provided)",
            },
          },
        },
      },
      {
        name: "export_mindmap",
        description: "Export the mind map to different formats",
        inputSchema: {
          type: "object",
          properties: {
            format: {
              type: "string",
              enum: ["json", "markdown"],
              description: "Export format: json or markdown",
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
  
  try {
    let result;
    
    switch (name) {
      case "create_mindmap":
        result = createMindMap(args.title);
        return {
          content: [
            {
              type: "text",
              text: `Created new mind map with root node: "${args.title}"`,
            },
          ],
        };
        
      case "open_mindmap":
        result = openMindMap(args.file_path);
        return {
          content: [
            {
              type: "text",
              text: `Opened mind map from ${result.filePath}. Root: "${result.rootText}"`,
            },
          ],
        };
        
      case "get_structure":
        result = getStructure();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
        
      case "create_node":
        result = createNode(args.parent_id, args.text, args.position);
        return {
          content: [
            {
              type: "text",
              text: `Created node "${result.text}" under parent "${result.parentText}" (ID: ${result.nodeId})`,
            },
          ],
        };
        
      case "update_node":
        result = updateNode(args.node_id, args.text, args.color);
        return {
          content: [
            {
              type: "text",
              text: `Updated node ${result.nodeId}: text="${result.text}", color=${result.color}`,
            },
          ],
        };
        
      case "delete_node":
        result = deleteNode(args.node_id);
        return {
          content: [
            {
              type: "text",
              text: `Deleted node "${result.deletedText}" (${result.deletedId}) from parent ${result.parentId}`,
            },
          ],
        };
        
      case "save_mindmap":
        result = saveMindMap(args.file_path);
        return {
          content: [
            {
              type: "text",
              text: `Saved mind map to ${result.savedTo}`,
            },
          ],
        };
        
      case "export_mindmap":
        result = exportMindMap(args.format);
        return {
          content: [
            {
              type: "text",
              text: result,
            },
          ],
        };
        
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error.message}`,
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
  console.error("MindMeld MCP Server v1.2.0 running on stdio");
}

main().catch(console.error);

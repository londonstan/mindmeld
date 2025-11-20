import { XMLParser, XMLBuilder } from 'fast-xml-parser';

// Parse FreeMind .mm file to Cytoscape elements
export function parseMMToElements(xmlContent) {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    allowBooleanAttributes: true,
  });

  const result = parser.parse(xmlContent);
  const elements = { nodes: [], edges: [] };
  
  if (!result.map || !result.map.node) {
    throw new Error('Invalid FreeMind file format');
  }

  const rootNode = result.map.node;
  parseNode(rootNode, null, elements, 0);
  
  return elements;
}

// Recursively parse nodes
function parseNode(node, parentId, elements, depth) {
  const nodeId = node['@_ID'] || `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const text = node['@_TEXT'] || 'Untitled';
  const position = node['@_POSITION'] || (parentId ? 'right' : null);
  const folded = node['@_FOLDED'] === 'true';
  
  // Extract style information
  let backgroundColor = null;
  let textColor = null;
  
  if (node.node && !Array.isArray(node.node)) {
    node.node = [node.node];
  }

  // Check for edge color
  if (node.edge) {
    backgroundColor = node.edge['@_COLOR'];
  }

  // Create Cytoscape node
  const cyNode = {
    data: {
      id: nodeId,
      label: text,
      parent: parentId,
      position: position,
      depth: depth,
      folded: folded,
      backgroundColor: backgroundColor,
      textColor: textColor,
    },
  };

  // Position nodes based on depth and position
  if (!parentId) {
    cyNode.position = { x: 400, y: 300 };
  }

  elements.nodes.push(cyNode);

  // Create edge to parent
  if (parentId) {
    elements.edges.push({
      data: {
        id: `edge_${parentId}_${nodeId}`,
        source: parentId,
        target: nodeId,
      },
    });
  }

  // Parse child nodes
  if (node.node) {
    const children = Array.isArray(node.node) ? node.node : [node.node];
    children.forEach((child) => {
      parseNode(child, nodeId, elements, depth + 1);
    });
  }

  return nodeId;
}

// Convert Cytoscape elements back to FreeMind .mm format
export function elementsToMM(elements, rootId) {
  const nodesMap = new Map();
  const childrenMap = new Map();

  // Build lookup maps
  elements.nodes.forEach((node) => {
    nodesMap.set(node.data.id, node);
    childrenMap.set(node.data.id, []);
  });

  // Build parent-child relationships from edges
  elements.edges.forEach((edge) => {
    const children = childrenMap.get(edge.data.source) || [];
    children.push(edge.data.target);
    childrenMap.set(edge.data.source, children);
  });

  // Find root node
  const root = rootId || findRootNode(elements);
  if (!root) {
    throw new Error('No root node found');
  }

  // Build XML structure
  const xmlNode = buildXMLNode(root, nodesMap, childrenMap);
  
  const builder = new XMLBuilder({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    format: true,
    indentBy: '  ',
  });

  const xml = builder.build({
    map: {
      '@_version': '1.0.1',
      node: xmlNode,
    },
  });

  return `<?xml version="1.0" encoding="UTF-8"?>\n${xml}`;
}

function buildXMLNode(nodeId, nodesMap, childrenMap) {
  const node = nodesMap.get(nodeId);
  if (!node) return null;

  const xmlNode = {
    '@_ID': node.data.id,
    '@_TEXT': node.data.label,
  };

  if (node.data.position) {
    xmlNode['@_POSITION'] = node.data.position;
  }

  if (node.data.folded) {
    xmlNode['@_FOLDED'] = 'true';
  }

  if (node.data.backgroundColor) {
    xmlNode.edge = { '@_COLOR': node.data.backgroundColor };
  }

  // Add children
  const children = childrenMap.get(nodeId) || [];
  if (children.length > 0) {
    xmlNode.node = children.map((childId) =>
      buildXMLNode(childId, nodesMap, childrenMap)
    ).filter(Boolean);
  }

  return xmlNode;
}

function findRootNode(elements) {
  const targetIds = new Set(elements.edges.map((e) => e.data.target));
  const rootNode = elements.nodes.find((n) => !targetIds.has(n.data.id));
  return rootNode ? rootNode.data.id : null;
}

// Create a new empty mind map
export function createNewMindMap(title = 'New Mind Map') {
  const rootId = `root_${Date.now()}`;
  return {
    nodes: [
      {
        data: {
          id: rootId,
          label: title,
          parent: null,
          position: null,
          depth: 0,
          folded: false,
        },
        position: { x: 400, y: 300 },
      },
    ],
    edges: [],
  };
}

// Add a new node to the mind map
export function addNode(elements, parentId, text, position = 'right') {
  const newId = `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const parentNode = elements.nodes.find((n) => n.data.id === parentId);
  const depth = parentNode ? parentNode.data.depth + 1 : 0;

  const newNode = {
    data: {
      id: newId,
      label: text,
      parent: parentId,
      position: position,
      depth: depth,
      folded: false,
    },
  };

  const newEdge = {
    data: {
      id: `edge_${parentId}_${newId}`,
      source: parentId,
      target: newId,
    },
  };

  return {
    nodes: [...elements.nodes, newNode],
    edges: [...elements.edges, newEdge],
    newNodeId: newId,
  };
}

// Delete a node and its descendants
export function deleteNode(elements, nodeId) {
  // Find all descendant node IDs
  const toDelete = new Set([nodeId]);
  let changed = true;
  
  while (changed) {
    changed = false;
    elements.edges.forEach((edge) => {
      if (toDelete.has(edge.data.source) && !toDelete.has(edge.data.target)) {
        toDelete.add(edge.data.target);
        changed = true;
      }
    });
  }

  return {
    nodes: elements.nodes.filter((n) => !toDelete.has(n.data.id)),
    edges: elements.edges.filter(
      (e) => !toDelete.has(e.data.source) && !toDelete.has(e.data.target)
    ),
  };
}

// Update a node's properties
export function updateNode(elements, nodeId, updates) {
  return {
    ...elements,
    nodes: elements.nodes.map((node) => {
      if (node.data.id === nodeId) {
        return {
          ...node,
          data: {
            ...node.data,
            ...updates,
          },
        };
      }
      return node;
    }),
  };
}

// Export mind map to JSON
export function exportToJSON(elements) {
  return JSON.stringify(elements, null, 2);
}

// Export mind map to Markdown
export function exportToMarkdown(elements) {
  const nodesMap = new Map();
  const childrenMap = new Map();

  elements.nodes.forEach((node) => {
    nodesMap.set(node.data.id, node);
    childrenMap.set(node.data.id, []);
  });

  elements.edges.forEach((edge) => {
    const children = childrenMap.get(edge.data.source) || [];
    children.push(edge.data.target);
    childrenMap.set(edge.data.source, children);
  });

  const root = findRootNode(elements);
  if (!root) return '';

  return buildMarkdown(root, nodesMap, childrenMap, 0);
}

function buildMarkdown(nodeId, nodesMap, childrenMap, depth) {
  const node = nodesMap.get(nodeId);
  if (!node) return '';

  const indent = '  '.repeat(depth);
  const prefix = depth === 0 ? '# ' : '- ';
  let md = `${indent}${prefix}${node.data.label}\n`;

  const children = childrenMap.get(nodeId) || [];
  children.forEach((childId) => {
    md += buildMarkdown(childId, nodesMap, childrenMap, depth + 1);
  });

  return md;
}

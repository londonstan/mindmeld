import { XMLParser, XMLBuilder } from 'fast-xml-parser';

const parserOptions = {
  ignoreAttributes: false,
  attributeNamePrefix: '',
  parseAttributeValue: false,
  trimValues: true,
};

const builderOptions = {
  ignoreAttributes: false,
  attributeNamePrefix: '',
  format: true,
  indentBy: '  ',
  suppressEmptyNode: false,
};

const parser = new XMLParser(parserOptions);
const builder = new XMLBuilder(builderOptions);

// Convert FreeMind XML to graph data
export function parseFreeMindXML(xmlString) {
  const parsed = parser.parse(xmlString);
  const rootNode = parsed.map.node;
  
  const nodes = [];
  const edges = [];
  
  function traverse(node, parentId = null, position = 'right') {
    const nodeId = node.ID || 'root';
    
    nodes.push({
      data: {
        id: nodeId,
        label: node.TEXT || '',
        color: node.COLOR || null,
        backgroundColor: node.BACKGROUND_COLOR || null,
        position: position,
      }
    });
    
    if (parentId) {
      edges.push({
        data: {
          id: `${parentId}-${nodeId}`,
          source: parentId,
          target: nodeId,
        }
      });
    }
    
    if (node.node) {
      const children = Array.isArray(node.node) ? node.node : [node.node];
      children.forEach(child => {
        const childPosition = child.POSITION || position;
        traverse(child, nodeId, childPosition);
      });
    }
  }
  
  traverse(rootNode);
  
  return { nodes, edges };
}

// Convert graph data to FreeMind XML
export function buildFreeMindXML(nodes, edges) {
  // Build a tree structure from flat nodes and edges
  const nodeMap = new Map();
  nodes.forEach(n => {
    nodeMap.set(n.data.id, {
      ID: n.data.id,
      TEXT: n.data.label,
      ...(n.data.color && { COLOR: n.data.color }),
      ...(n.data.backgroundColor && { BACKGROUND_COLOR: n.data.backgroundColor }),
      ...(n.data.position && { POSITION: n.data.position }),
      children: []
    });
  });
  
  // Build parent-child relationships
  edges.forEach(e => {
    const parent = nodeMap.get(e.data.source);
    const child = nodeMap.get(e.data.target);
    if (parent && child) {
      parent.children.push(child);
    }
  });
  
  // Get root node
  const rootNode = nodeMap.get('root') || nodeMap.values().next().value;
  
  // Convert children arrays to proper format
  function formatNode(node) {
    const formatted = {
      ID: node.ID,
      TEXT: node.TEXT,
      ...(node.COLOR && { COLOR: node.COLOR }),
      ...(node.BACKGROUND_COLOR && { BACKGROUND_COLOR: node.BACKGROUND_COLOR }),
      ...(node.POSITION && { POSITION: node.POSITION }),
    };
    
    if (node.children.length > 0) {
      if (node.children.length === 1) {
        formatted.node = formatNode(node.children[0]);
      } else {
        formatted.node = node.children.map(formatNode);
      }
    }
    
    return formatted;
  }
  
  const formattedRoot = formatNode(rootNode);
  
  const mindMap = {
    map: {
      version: '1.0.1',
      node: formattedRoot
    }
  };
  
  return builder.build(mindMap);
}

// Create empty mind map
export function createEmptyMindMap(title = 'New Mind Map') {
  return {
    nodes: [
      {
        data: {
          id: 'root',
          label: title,
          color: null,
          backgroundColor: null,
        }
      }
    ],
    edges: []
  };
}

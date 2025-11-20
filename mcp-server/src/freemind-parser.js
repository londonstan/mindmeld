import { XMLParser, XMLBuilder } from 'fast-xml-parser';

export class FreeMindParser {
  constructor() {
    this.parserOptions = {
      ignoreAttributes: false,
      attributeNamePrefix: '',
      textNodeName: '#text',
      parseAttributeValue: false,
      parseTagValue: false,
      trimValues: true,
      cdataPropName: '__cdata',
      ignoreDeclaration: false,
    };

    this.builderOptions = {
      ignoreAttributes: false,
      attributeNamePrefix: '',
      textNodeName: '#text',
      format: true,
      indentBy: '  ',
      suppressEmptyNode: true,
    };

    this.parser = new XMLParser(this.parserOptions);
    this.builder = new XMLBuilder(this.builderOptions);
  }

  parse(xmlString) {
    const parsed = this.parser.parse(xmlString);
    
    if (parsed.map && parsed.map.node) {
      this.normalizeNode(parsed.map.node);
      
      return {
        map: {
          version: parsed.map.version || '1.0.1',
          node: parsed.map.node,
        },
      };
    }
    
    throw new Error('Invalid FreeMind XML format');
  }

  normalizeNode(node) {
    if (!node.ID) {
      node.ID = `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    if (node.node) {
      if (Array.isArray(node.node)) {
        node.children = node.node;
      } else {
        node.children = [node.node];
      }
      delete node.node;
    } else {
      node.children = [];
    }

    if (node.children) {
      for (const child of node.children) {
        this.normalizeNode(child);
      }
    }
  }

  toXML(mindMapData) {
    const freemindStructure = {
      '?xml': {
        '@_version': '1.0',
        '@_encoding': 'UTF-8',
      },
      map: {
        '@_version': mindMapData.map.version || '1.0.1',
        node: this.denormalizeNode(mindMapData.map.node),
      },
    };

    return this.builder.build(freemindStructure);
  }

  denormalizeNode(node) {
    const result = {
      '@_TEXT': node.TEXT,
      '@_ID': node.ID,
    };

    if (node.COLOR) result['@_COLOR'] = node.COLOR;
    if (node.POSITION) result['@_POSITION'] = node.POSITION;
    if (node.FOLDED) result['@_FOLDED'] = node.FOLDED;

    if (node.children && node.children.length > 0) {
      result.node = node.children.map(child => this.denormalizeNode(child));
    }

    return result;
  }

  static createBasicMindMap(rootTitle) {
    return {
      map: {
        version: '1.0.1',
        node: {
          TEXT: rootTitle,
          ID: 'root',
          children: [],
        },
      },
    };
  }
}
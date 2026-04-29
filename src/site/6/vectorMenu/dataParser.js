// dataParser.js
/**
 * 解析文本并返回分类后的树
 */
const parse = (text) => {
  const lines = text.split('\n').filter(line => line.trim());

  const getIndentLevel = (line) => {
    const match = line.match(/^(\s*)-/);
    return match ? Math.floor(match[1].length / 2) : 0;
  };

  const parseLineContent = (line) => {
    const trimmed = line.trim();
    let content = trimmed.replace(/^-\s*/, '');

    const paramMatch = content.match(/#\?<([^#]*)/);
    let text = content;
    const attributes = {};

    if (paramMatch) {
      const paramString = paramMatch[1];
      text = content.split('#?<')[0].trim();

      const pairs = paramString.split('&');
      pairs.forEach(pair => {
        pair = pair.trim();
        if (pair) {
          const [key, value] = pair.split('=');
          if (key) {
            attributes[key.trim()] = value ? value.trim() : '';
          }
        }
      });

      const afterParams = content.substring(
        paramMatch.index + paramMatch[0].length
      );
      const tagMatch = afterParams.match(/#(\w+AML)/);
      if (tagMatch && attributes['comment'] !== undefined) {
        attributes['comment'] =
          (attributes['comment'] || '') + ' #' + tagMatch[1];
      }
    }

    return { text, attributes };
  };

  // 构建树
  const root = { level: -1, children: [] };
  const stack = [root];

  lines.forEach(line => {
    const level = getIndentLevel(line);
    const parsed = parseLineContent(line);

    const node = {
      level,
      text: parsed.text,
      ...parsed.attributes,
      children: []
    };

    while (stack.length > 1 &&
      stack[stack.length - 1].level >= level) {
      stack.pop();
    }

    stack[stack.length - 1].children.push(node);
    stack.push(node);
  });

  return classifyNodes(root.children);
};

/**
 * 标记节点类型
 */
const classifyNodes = (nodeArray) => {
  return nodeArray.map(node => ({
    ...node,
    nodeChildren: node.children?.length ?? 0,
    children: classifyNodes(node.children || [])
  }));
};

/**
 * 获取树的统计信息
 */
const getStats = (nodeArray) => {
  let totalNodes = 0;
  let leafNodes = 0;
  let maxDepth = 0;

  const traverse = (nodes, depth = 0) => {
    maxDepth = Math.max(maxDepth, depth);

    nodes.forEach(node => {
      totalNodes++;
      if (node.nodeChildren === 0) {
        leafNodes++;
      }
      if (node.children?.length) {
        traverse(node.children, depth + 1);
      }
    });
  };

  traverse(nodeArray);

  return {
    totalNodes,
    leafNodes,
    branchNodes: totalNodes - leafNodes,
    maxDepth
  };
};

export { parse, classifyNodes, getStats };

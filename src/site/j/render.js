const render = {};
render.tokenizeFromObj = function* (obj, template = null) {
  const entries = Object.entries(obj);

  for (const [key, value] of entries) {
    yield { type: 'key', value: `${key}:` };
    yield { type: 'value', value: String(value) };
    // 可选：添加分隔符
    yield { type: 'separator', value: ' ' };
  }
};

render.renderStyledTags = (obj) => {
  const div = document.createElement('div');
  for (const token of render.tokenizeFromObj(obj)) {
    if (token.type === 'key') {
      // key 使用 span
      const span = document.createElement('span');
      span.className = 'key';
      span.textContent = token.value;
      div.appendChild(span);
    } else {
      // value 使用 span
      const span = document.createElement('span');
      span.className = 'value';
      span.textContent = token.value;
      div.appendChild(span);
    }
  }

  return div;
};

export { render };

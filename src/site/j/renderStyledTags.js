export const renderStyledTags = (obj) => {
  const div = document.createElement('div');

  for (const token of methods.tokenizeFromObj(obj)) {
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
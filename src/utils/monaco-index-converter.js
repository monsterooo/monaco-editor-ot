export function lineAndColumnToIndex(lines, lineNumber, column) {
  let currentLine = 0;
  let index = 0;

  while (currentLine + 1 < lineNumber) {
    index += lines[currentLine].length;
    index += 1; // Linebreak 字符
    currentLine += 1;
  }

  index += column - 1;

  return index;
}
export function indexToLineAndColumn(lines, index) {
  let offset = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (offset + line.length + 1 > index) {
      return {
        lineNumber: i + 1,
        column: index - offset + 1,
      };
    }

    // + 1 是否用于未包含的linebreak字符
    offset += line.length + 1;
  }

  // 对列 +2 (长度已经是 a +1), 因为为monaco +1 和为linebreak +1 
  return {
    lineNumber: lines.length,
    column: (lines[lines.length - 1] || '').length + 1,
  };
}

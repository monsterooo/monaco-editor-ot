/**
 * 传入一个索引位置返回所在monaco编辑器的行列
 * @param {*} monacoIns 
 * @param {*} index 
 * @returns {*} { line, col } line对应行 col对应列
 */
function rangeFromIndex(monacoIns, index) {
  const model = monacoIns.getModel();
  const lines = model.getLinesContent();
  let countSize = 0;
  for(let i = 0; i < lines.length; i ++) {
    let size = lines[i].length;
    if (index > (countSize + size)) {
      countSize += size;
      continue;
    } else if (index === (countSize + size)) {
      return { col: (countSize + size), line: i };
    } else if (index < (countSize + size)) {
      return { col: (countSize + size) - index, line: i };
    }
  }
}

export default rangeFromIndex;
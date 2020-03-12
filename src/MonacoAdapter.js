import TextOperation from './TextOperation';

class MonacoAdapter {
  constructor(monacoIns) {
    this.monacoIns = monacoIns;
    monacoIns.onDidChangeModelContent(event => {
      const pair = this.operationFromMonacoChange(event, this.monacoIns);
      console.log('operation', pair[0])
    });
  }
  operationFromMonacoChange(event, monacoIns) {
    const docContent = getRemovedText(monacoIns);
    let docEndLength = monacoModelContentLength(monacoIns);
    let operation = new TextOperation().retain(docEndLength);
    let inverse = new TextOperation().retain(docEndLength);

    // console.log('count', docEndLength);
    // console.log('event', event);
    for(let i = 0; i < event.changes.length; i++) {
      let change = event.changes[i];
      // rangeOffset 新增时是开始位置、删除时是删除开始位置
      const fromIndex = change.rangeOffset;
      // rangeLength 新增时为0、删除时为删除字符串长度
      const removedLength = change.rangeLength;
      const restLength = docEndLength - fromIndex - change.text.length;
      const isRemoved = !change.text;

      operation = new TextOperation()
        .retain(fromIndex) // 保持位置在变更开始位置
        .delete(isRemoved ? removedLength : '')
        .insert(change.text) // 插入文本
        .retain(restLength) // 保持在文档的末尾
        .compose(operation); // 组合操作
      inverse = inverse.compose(
        new TextOperation()
          .retain(fromIndex)
          .delete(change.text.length)
          .insert(isRemoved ? change.text : '')
          .retain(restLength)
      );
      docEndLength += isRemoved ? removedLength : change.text;
    }
    return [operation, inverse];
  }
}

export default MonacoAdapter;

function monacoModelContentLength(monacoIns) {
  const model = monacoIns.getModel();
  const modelRange = model.getFullModelRange()
  return model.getCharacterCountInRange(modelRange);
}
function getRemovedText(monacoIns) {
  const model = monacoIns.getModel();
  return model.getLinesContent();
}
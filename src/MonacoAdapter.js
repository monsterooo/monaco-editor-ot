import TextOperation from './TextOperation';
import rangeFromIndex from './utils/range-from-index';

class MonacoAdapter {
  constructor(monacoIns) {
    this.callbacks = null;
    this.monacoIns = monacoIns;
    this.previousValue = getValue(monacoIns);
    monacoIns.onDidChangeModelContent(event => {
      const pair = this.operationFromMonacoChange(event, this.monacoIns);
      this.trigger('change', pair[0], pair[1]);
      this.previousValue = getValue(monacoIns);
    });
  }
  /**
   * 将编辑器操作封装成operation
   * @param {*} event 编辑器change事件
   * @param {*} monacoIns 编辑器实例
   */
  operationFromMonacoChange(event, monacoIns) {
    const docContent = getRemovedText(monacoIns);
    let docEndLength = monacoModelContentLength(monacoIns);
    let operation = new TextOperation().retain(docEndLength);
    let inverse = new TextOperation().retain(docEndLength);

    for(let i = 0; i < event.changes.length; i++) {
      let change = event.changes[i];
      // rangeOffset 新增时是开始位置、删除时是删除开始位置
      const fromIndex = change.rangeOffset;
      // rangeLength 新增时为0、删除时为删除字符串长度
      const removedLength = change.rangeLength;
      const restLength = docEndLength - fromIndex - change.text.length;
      const isRemoved = !change.text;
      const removeText = isRemoved ? this.previousValue.slice(fromIndex, fromIndex + removedLength) : "";

      operation = new TextOperation()
        .retain(fromIndex) // 保持位置在变更开始位置
        .delete(removeText)
        .insert(change.text) // 插入文本
        .retain(restLength) // 保持在文档的末尾
        .compose(operation); // 组合操作
      inverse = inverse.compose(
        new TextOperation()
          .retain(fromIndex)
          .delete(change.text.length)
          .insert(removeText)
          .retain(restLength)
      );
      docEndLength += removeText.length - change.text.length;
    }
    return [operation, inverse];
  }
  /**
   * 触发当前对象注册的回调事件
   * @param {*} eventName 注册给当前对象的事件名称
   * @param  {...any} args 传递给事件回调参数
   */
  trigger(eventName, ...args) {
    const action = this.callbacks && this.callbacks[eventName];
    action && action.apply(this, args);
  }
  /**
   * 注册回调函数
   * @param {object} cb 一个对象key是事件名称value是事件名称对应的回调
   */
  registerCallbacks(cb) {
    this.callbacks = cb;
  }
  applyOperation(operation) {
    // 因为是服务器过来的operation操作编辑器
    // 所以这里我们要忽略下一次编辑器的修改
    this.ignoreNextChange = true;
    this.applyOperationToMonaco(operation);
  }
  applyOperationToMonaco(operation) {
    debugger;
    const { ops } = operation;
    const model = this.monacoIns.getModel();
    let index = 0;
    for(let i = 0; i < ops.length; i++) {
      const op = ops[i];
      // 如果某个操作是保留则我们的索引保持跟进
      if (TextOperation.isRetain(op)) {
        index += op;
      } else if (TextOperation.isInsert(op)) {
        // 某个操作是插入我们替换编辑器的内容
        index += op.length; // 据需跟进我们的索引
      } else if (TextOperation.isDelete(op)) {
        const from = rangeFromIndex(this.monacoIns, index);
        const to = rangeFromIndex(this.monacoIns, index - op);
        model.applyEdits({
          forceMoveMarkers: false,
          // TODO 同步服务器删除不工作
          range: new monaco.Range(
            from.line,
            from.col,
            to.line,
            to.col
          ),
          text: null,
        });        
      }
    }
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
function getValue(monacoIns) {
  return monacoIns.getModel().getValue();
}
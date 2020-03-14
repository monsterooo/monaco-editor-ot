import { css } from 'glamor';
import { hueFromName, hsl2hex } from './utils/name-to-rgb';
import { indexToLineAndColumn } from './utils/monaco-index-converter';

const fadeIn = css.keyframes('fadeIn', {
  '0%': { opacity: 0 },
  '100%': { opacity: 1 },
});
const fadeOut = css.keyframes('fadeOut', {
  '0%': { opacity: 1 },
  '100%': { opacity: 0 },
});

class OtherClient {
  constructor(clientId, editorAdapter, name, selection) {
    this.id = clientId;
    this.name = name || clientId;
    this.editorAdapter = editorAdapter;
    this.setColor(name ? hueFromName(name) : Math.random());
    this.decorationId = this.editorAdapter.monacoIns.deltaDecorations(
      clientId,
      []
    );
    if (selection) {
      this.updateSelection(selection);
    }
  }
  setColor(hue) {
    this.hue = hue;
    this.color = hsl2hex(hue, 0.75, 0.5);
    this.lightColor = hsl2hex(hue, 0.5, 0.9);
    // if (this.li) { this.li.style.color = this.color; }
  }
  updateSelection(selection) {
    const userClassesGenerated = {};
    const lines = this.editorAdapter.monacoIns.getModel().getLinesContent() || [];
    let decorations = [];

    this.selection = selection;
    const prefix = this.id;
    const cursorClassName = prefix + '-cursor';
    const addCursor = (position, className) => {
      const cursorPos = indexToLineAndColumn(lines, position);
      decorations.push({
        range: new monaco.Range(
          cursorPos.lineNumber,
          cursorPos.column,
          cursorPos.lineNumber,
          cursorPos.column
        ),
        options: {
          className: userClassesGenerated[className],
        },
      });
    };
    const nameStyles = {
      content: this.name,
      position: 'absolute',
      top: -17,
      backgroundColor: this.lightColor,
      zIndex: 20,
      color: this.color,
      padding: '2px 4px',
      borderRadius: 2,
      borderBottomLeftRadius: 0,
      fontSize: '.75rem',
      fontWeight: 600,
      userSelect: 'none',
      pointerEvents: 'none',
      width: 'max-content',
    };
    userClassesGenerated[cursorClassName] = `${css({
      backgroundColor: this.color,
      width: '2px !important',
      cursor: 'text',
      ':before': {
        animation: `${fadeOut} 0.3s`,
        animationDelay: '1s',
        animationFillMode: 'forwards',
        opacity: 1,
        ...nameStyles,
      },
      ':hover': {
        ':before': {
          animation: `${fadeIn} 0.3s`,
          animationFillMode: 'forwards',
          opacity: 0,
          ...nameStyles,
        },
      },
    })}`;
    addCursor(selection.cursorPosition, cursorClassName);

    this.decorationId = this.editorAdapter.monacoIns.deltaDecorations(
      this.decorationId || [],
      decorations
    );
  }
}

export default OtherClient;
import MonacoAdapter from './MonacoAdapter';

window.loaded.then(() => {
  var monacoIns = monaco.editor.create(document.getElementById('container'), {
    value: ['Monaco Editor Sample'].join('\n'),
    language: 'javascript'
  });
  window.monacoIns = monacoIns;
  new MonacoAdapter(monacoIns);
});
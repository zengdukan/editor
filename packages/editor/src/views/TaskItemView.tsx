import type { Node } from 'prosemirror-model';
import type { EditorView, NodeView } from 'prosemirror-view';
import type { GetPos } from './types';

class TaskItemNodeView implements NodeView {
  view: EditorView;

  node: Node;

  getPos?: GetPos;

  dom: HTMLElement;

  contentDOM: HTMLElement;

  checkbox: HTMLElement;

  // <li data-type="task_item">
  //   <span contenteditable="false">
  //     <input type="checkbox">
  //   </span>
  //   <div>
  //     <p>sss</p>
  //   </div>
  // </li>
  constructor(node: Node, view: EditorView, getPos?: GetPos) {
    this.node = node;
    this.view = view;
    this.getPos = getPos;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.tabIndex = -1;

    const span = document.createElement('span');
    span.contentEditable = 'false';
    span.append(checkbox);

    const content = document.createElement('div');
    const listItem = document.createElement('li');
    listItem.setAttribute('data-type', 'task_item');
    listItem.append(span, content);

    this.dom = listItem;
    this.contentDOM = content;
    this.checkbox = checkbox;

    checkbox.addEventListener('change', (event) => {
      if (this.getPos == null) return;
      const { checked } = event.target as any;
      const tr = this.view.state.tr.setNodeMarkup(this.getPos(), null, {
        checked,
      });
      this.view.dispatch(tr);
    });
  }

  stopEvent() {
    return true;
  }

  update(node: Node) {
    if (node.type.name !== 'task_item') {
      return false;
    }

    if (node.attrs.checked) {
      this.checkbox.setAttribute('checked', 'checked');
      this.dom.classList.add('checked');
    } else {
      this.checkbox.removeAttribute('checked');
      this.dom.classList.remove('checked');
    }

    return true;
  }
}

export function TaskItemView(node: Node, view: EditorView, getPos: GetPos) {
  return new TaskItemNodeView(node, view, getPos);
}

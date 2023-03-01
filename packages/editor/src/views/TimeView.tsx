import type { Node } from 'prosemirror-model';
import type { EditorView } from 'prosemirror-view';
import { formatDatetime } from '@curvenote/schema';
import type { GetPos } from './types';

class TimeNodeView {
  // The node's representation in the editor (empty, for now)
  dom: HTMLElement;

  node: Node;

  view: EditorView;

  getPos?: GetPos;

  constructor(node: Node, view: EditorView, getPos?: GetPos) {
    this.node = node;
    this.view = view;
    this.getPos = getPos;
    this.dom = document.createElement<'time'>('time');
    this.setDate();
  }

  update(node: Node) {
    this.node = node;
    this.setDate();
    return true;
  }

  setDate() {
    const { datetime } = this.node.attrs;
    this.dom.setAttribute('datetime', datetime);
    const { f } = formatDatetime(datetime);
    this.dom.textContent = f;
  }
}

export function TimeView(node: Node, view: EditorView, getPos: GetPos) {
  return new TimeNodeView(node, view, getPos);
}

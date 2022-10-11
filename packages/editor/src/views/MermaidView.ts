import type { Node } from 'prosemirror-model';
import { StepMap } from 'prosemirror-transform';
import { keymap } from 'prosemirror-keymap';
import { undo, redo } from 'prosemirror-history';
import type { Transaction } from 'prosemirror-state';
import { EditorState, TextSelection } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import type { NodeView } from 'prosemirror-view';
import { chainCommands, deleteSelection, newlineInCode } from 'prosemirror-commands';
import { isEditable } from '../prosemirror/plugins/editable';
import type { GetPos } from './types';
import { v4 as uuid } from 'uuid';

const EDITING = 'editing';
// <div class='mermaid editing'>
//   <!-- editor -->
//   <div class="editor">
//   </div>
//   <!-- render -->
//   <div class="render" click="selectNode">
//   </div>
// </div>
class MermaidNodeView implements NodeView {
  dom: HTMLElement;

  editor: HTMLElement;

  render: HTMLElement;

  mermaidEle: HTMLElement;

  renderId: string;

  innerView: EditorView;

  node: Node;

  outerView: EditorView;

  getPos: GetPos;

  constructor(node: Node, view: EditorView, getPos: GetPos) {
    this.node = node;
    this.outerView = view;
    this.getPos = getPos;
    this.dom = document.createElement('div');
    this.dom.classList.add('mermaid');
    this.editor = document.createElement('div');
    this.editor.classList.add('editor');
    this.render = document.createElement('div');
    this.render.classList.add('render');
    this.mermaidEle = document.createElement('div');
    // mermaid render error: Failed to execute 'querySelector' on 'Element': is not a valid selector
    // because id must not begin with number
    this.renderId = 'id' + uuid();
    console.log('renderId:', this.renderId);
    this.mermaidEle.setAttribute('id', this.renderId);
    this.render.appendChild(this.mermaidEle);
    this.render.addEventListener('click', () => this.selectNode());
    this.dom.append(this.editor, this.render);
    this.dom.classList.remove(EDITING);
    this.renderMermaid();

    const unfocus = () => {
      this.dom.classList.remove(EDITING);
      this.outerView.focus();
      return true;
    };
    const mac = typeof navigator !== 'undefined' ? /Mac/.test(navigator.platform) : false;
    // And put a sub-ProseMirror into that
    this.innerView = new EditorView(
      { mount: this.editor },
      {
        // You can use any node as an editor document
        state: EditorState.create({
          doc: this.node,
          plugins: [
            keymap({
              'Mod-a': () => {
                const { doc, tr } = this.innerView.state;
                const sel = TextSelection.create(doc, 0, this.node.nodeSize - 2);
                this.innerView.dispatch(tr.setSelection(sel));
                return true;
              },
              'Mod-z': () => undo(this.outerView.state, this.outerView.dispatch),
              'Mod-Z': () => redo(this.outerView.state, this.outerView.dispatch),
              ...(mac
                ? {}
                : { 'Mod-y': () => redo(this.outerView.state, this.outerView.dispatch) }),
              Escape: unfocus,
              Tab: unfocus,
              'Shift-Tab': unfocus,
              Enter: unfocus,
              'Ctrl-Enter': chainCommands(newlineInCode, unfocus),
              'Shift-Enter': chainCommands(newlineInCode, unfocus),
              Backspace: chainCommands(deleteSelection, (state) => {
                // default backspace behavior for non-empty selections
                if (!state.selection.empty) {
                  return false;
                }
                // default backspace behavior when math node is non-empty
                if (this.node.textContent.length > 0) {
                  return false;
                }
                // otherwise, we want to delete the empty math node and focus the outer view
                this.outerView.dispatch(this.outerView.state.tr.insertText(''));
                this.outerView.focus();
                return true;
              }),
            }),
          ],
        }),
        // This is the magic part
        dispatchTransaction: this.dispatchInner.bind(this),
        handleDOMEvents: {
          mousedown: () => {
            // Kludge to prevent issues due to the fact that the whole
            // footnote is node-selected (and thus DOM-selected) when
            // the parent editor is focused.
            const editable = isEditable(this.outerView.state);
            if (editable && this.outerView.hasFocus()) this.innerView.focus();
            return false;
          },
        },
      },
    );
  }

  selectNode() {
    const edit = isEditable(this.outerView.state);
    this.dom.classList.add('ProseMirror-selectednode');
    if (!edit) return;
    this.dom.classList.add(EDITING);
    // This is necessary on first insert.
    setTimeout(() => this.innerView.focus(), 1);
  }

  deselectNode() {
    this.dom.classList.remove('ProseMirror-selectednode');
    this.dom.classList.remove(EDITING);
  }

  dispatchInner(tr: Transaction) {
    const { state, transactions } = this.innerView.state.applyTransaction(tr);
    this.innerView.updateState(state);

    if (!tr.getMeta('fromOutside')) {
      const outerTr = this.outerView.state.tr;
      const offsetMap = StepMap.offset(this.getPos() + 1);
      for (let i = 0; i < transactions.length; i += 1) {
        const { steps } = transactions[i];
        for (let j = 0; j < steps.length; j += 1) outerTr.step(steps[j].map(offsetMap) as any);
      }
      if (outerTr.docChanged) this.outerView.dispatch(outerTr);
    }
  }

  update(node: Node) {
    if (!node.sameMarkup(this.node)) return false;
    this.node = node;
    if (this.innerView) {
      const { state } = this.innerView;
      const start = node.content.findDiffStart(state.doc.content);
      if (start != null) {
        const ends = node.content.findDiffEnd(state.doc.content as any);
        let { a: endA, b: endB } = ends ?? { a: 0, b: 0 };
        const overlap = start - Math.min(endA, endB);
        if (overlap > 0) {
          endA += overlap;
          endB += overlap;
        }
        this.innerView.dispatch(
          state.tr.replace(start, endB, node.slice(start, endA)).setMeta('fromOutside', true),
        );
      }
    }
    this.renderMermaid();
    return true;
  }

  renderMermaid() {
    if (this.node.attrs.numbered) {
      this.dom.setAttribute('numbered', '');
    } else {
      this.dom.removeAttribute('numbered');
    }

    this._renderMermaid();
  }

  async _renderMermaid() {
    try {
      const mermaidjs = await import('mermaid');
      mermaidjs.default.mermaidAPI.initialize({
        startOnLoad: true,
        flowchart: {
          htmlLabels: false,
        },
        fontFamily: 'inherit',
      });
      console.log('renderId:', this.renderId);
      mermaidjs.default.mermaidAPI.render(
        this.renderId,
        this.node.textContent,
        (svgCode: string) => {
          this.render.innerHTML = svgCode;
        },
      );
    } catch (error) {
      console.error(error);
      console.log('error renderId:', this.renderId);
      const errNode = document.getElementById(`d${this.renderId}`);
      if (errNode) {
        errNode.setAttribute('id', this.renderId);
        this.mermaidEle = errNode;
        this.render.appendChild(this.mermaidEle);
      }
    }
  }

  destroy() {
    this.innerView.destroy();
    this.dom.textContent = '';
  }

  stopEvent(event: any): boolean {
    return (this.innerView && this.innerView.dom.contains(event.target)) ?? false;
  }

  ignoreMutation() {
    return true;
  }
}

export function MermaidView(node: Node, view: EditorView, getPos: GetPos) {
  return new MermaidNodeView(node, view, getPos);
}

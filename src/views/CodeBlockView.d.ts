import CodeMirror from 'codemirror';
import { EditorView, NodeView } from 'prosemirror-view';
import { Node } from 'prosemirror-model';
import 'codemirror/mode/python/python';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/mode/jsx/jsx';
import 'codemirror/mode/swift/swift';
import 'codemirror/mode/php/php';
import 'codemirror/mode/clike/clike';
import 'codemirror/mode/julia/julia';
import 'codemirror/mode/r/r';
import 'codemirror/mode/htmlmixed/htmlmixed';
import 'codemirror/mode/sql/sql';
import 'codemirror/mode/ruby/ruby';
import 'codemirror/mode/rust/rust';
import 'codemirror/mode/go/go';
import { TextSelection } from 'prosemirror-state';
export default class CodeBlockView implements NodeView {
    view: EditorView;
    node: Node;
    getPos: () => number;
    incomingChanges: boolean;
    cm: any;
    dom: any;
    updating: boolean;
    constructor(node: any, view: any, getPos: any);
    forwardSelection(): void;
    asProseMirrorSelection(doc: any): TextSelection<any>;
    setSelection(anchor: any, head: any): void;
    valueChanged(): void;
    codeMirrorKeymap(): CodeMirror.KeyMap;
    maybeEscape(unit: any, dir: any): {
        toString(): "CodeMirror.PASS";
    } | undefined;
    update(node: any): boolean;
    selectNode(): void;
    static stopEvent(): boolean;
}

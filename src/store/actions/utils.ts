import { schemas } from '@curvenote/schema';
import { Node, NodeRange } from 'prosemirror-model';
import { EditorState, NodeSelection, TextSelection } from 'prosemirror-state';
import { liftTarget } from 'prosemirror-transform';
import { ContentNodeWithPos, isNodeSelection } from 'prosemirror-utils';
import { EditorView } from 'prosemirror-view';
import { AlignOptions } from '../../types';

export const TEST_LINK = /((https?:\/\/)(www\.)?[-a-zA-Z0-9@:%._+~#=]{2,256}\.[a-z]{2,4}\b([-a-zA-Z0-9@:%_+.~#?&//=]*))$/;
export const TEST_LINK_SPACE = /((https?:\/\/)(www\.)?[-a-zA-Z0-9@:%._+~#=]{2,256}\.[a-z]{2,4}\b([-a-zA-Z0-9@:%_+.~#?&//=]*))\s$/;
export const TEST_LINK_COMMON_SPACE = /((https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._+~#=]{2,256}\.[com|org|app|dev|io|net|gov|edu]{2,4}\b([-a-zA-Z0-9@:%_+.~#?&//=]*))\s$/;

const testLink = (possibleLink: string) => {
  const match = TEST_LINK.exec(possibleLink);
  return Boolean(match);
};

export const addLink = (view: EditorView, data: DataTransfer | null) => {
  const href = data?.getData('text/plain') ?? '';
  if (!testLink(href)) return false;
  const { schema } = view.state;
  const node = schema.text(href, [schema.marks.link.create({ href })]);
  const tr = view.state.tr
    .replaceSelectionWith(node, false)
    .scrollIntoView();
  view.dispatch(tr);
  return true;
};

export function updateNodeAttrsOnView(
  view: EditorView | null, node: Pick<ContentNodeWithPos, 'node' | 'pos'>,
  attrs: { [index: string]: any }, select: boolean | 'after' = true,
) {
  if (view == null) return;
  const tr = view.state.tr.setNodeMarkup(
    node.pos,
    undefined,
    { ...node.node.attrs, ...attrs },
  );
  if (select === true) tr.setSelection(NodeSelection.create(tr.doc, node.pos));
  if (select === 'after') {
    const sel = TextSelection.create(tr.doc, node.pos + node.node.nodeSize);
    tr.setSelection(sel);
  }
  view.dispatch(tr);
  view.focus();
}


// https://discuss.prosemirror.net/t/expanding-the-selection-to-the-active-mark/478
function getLinkBounds(state: EditorState, pos: number) {
  const $pos = state.doc.resolve(pos);

  const { parent, parentOffset } = $pos;
  const start = parent.childAfter(parentOffset);
  if (!start.node) return null;

  const link = start.node.marks.find((mark) => mark.type === state.schema.marks.link);
  if (!link) return null;

  let startIndex = $pos.index();
  let startPos = $pos.start() + start.offset;
  let endIndex = startIndex + 1;
  let endPos = startPos + start.node.nodeSize;
  while (startIndex > 0 && link.isInSet(parent.child(startIndex - 1).marks)) {
    startIndex -= 1;
    startPos -= parent.child(startIndex).nodeSize;
  }
  while (endIndex < parent.childCount && link.isInSet(parent.child(endIndex).marks)) {
    endPos += parent.child(endIndex).nodeSize;
    endIndex += 1;
  }
  return { from: startPos, to: endPos, mark: link };
}


export function getLinkBoundsIfTheyExist(state: EditorState) {
  const {
    from, $from, to, $to, empty,
  } = state.selection;
  const mark = state.schema.marks.link;
  const searchForLink = empty
    ? Boolean(mark.isInSet(state.storedMarks || $from.marks()))
    : state.doc.rangeHasMark(from, to, mark);

  const linkBounds = searchForLink ? getLinkBounds(state, from) : null;

  const hasLink = Boolean(
    (mark.isInSet($from.marks()) || from === linkBounds?.from)
    && (mark.isInSet($to.marks()) || to === linkBounds?.to),
  );

  // TODO: this fails if you are selecting between TWO different links. :(
  // TODO: this fails if the link is only one character long.

  if (!hasLink || !linkBounds) return null;
  return linkBounds;
}


export function getNodeIfSelected(state: EditorState | null, nodeName?: schemas.nodeNames) {
  if (state == null) return null;
  const selected = isNodeSelection(state.selection);
  const { node } = (state.selection as NodeSelection);
  if (selected && (!nodeName || node?.type.name === nodeName)) {
    return node;
  }
  return null;
}

export const setNodeViewAlign = (
  node: Node, view: EditorView, pos: number,
) => (value: AlignOptions) => (
  updateNodeAttrsOnView(view, { node, pos }, { align: value })
);

export const setNodeViewWidth = (
  node: Node, view: EditorView, pos: number,
) => (value: number) => (
  updateNodeAttrsOnView(view, { node, pos }, { width: value })
);

export const setNodeViewKind = (
  node: Node, view: EditorView, pos: number, select = true,
) => (value: string) => (
  updateNodeAttrsOnView(view, { node, pos }, { kind: value }, select)
);

export const setNodeViewDelete = (
  node: Node, view: EditorView, pos: number,
) => () => {
  const tr = view.state.tr.delete(pos, pos + node.nodeSize);
  view.dispatch(tr);
};

export const liftContentOutOfNode = (
  node: Node, view: EditorView, pos: number,
) => () => {
  const $from = view.state.doc.resolve(pos + 1);
  const $to = view.state.doc.resolve(pos + node.nodeSize - 1);
  const range = new NodeRange($from, $to, 1);
  const target = liftTarget(range);
  if (target == null) return;
  const tr = view.state.tr.lift(range, target);
  view.dispatch(tr);
  view.focus();
};
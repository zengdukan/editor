import type { Selection, Command, EditorState, Transaction } from 'prosemirror-state';
import { TextSelection, Plugin, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';
import type { EditorView } from 'prosemirror-view';
import type { Node as ProsemirrorNode } from 'prosemirror-model';

// 1. 搜索结果正确
// 2. findnext 移动正确
// 3. findNext 到最后重头开始
// 4. findPrev 移动正确
// 5. findPrev 到开始跳到最后
// 6. find后移动贯标, 再findNext
// 7. find后移动贯标, 再findPrev
// 8. 搜索后移动编辑光标编辑, 当前选中会变化

function escapeStringRegexp(text: string) {
  // Escape characters with special meaning either inside or outside character sets.
  // Use a simple backslash escape when it’s always valid, and a `\xnn` escape when the simpler form would be disallowed by Unicode patterns’ stricter grammar.
  return text.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&').replace(/-/g, '\\x2d');
}

export const key = new PluginKey('findAndReplace');

export enum Direction {
  NEXT = 0,
  PREV,
}

interface Match {
  from: number;
  to: number;
}

export interface FindProps {
  findTerm?: string;

  replaceTerm?: string;

  caseSensitive?: boolean;

  disableRegex?: boolean;

  direction?: Direction;
}

export interface PluginProps extends FindProps {
  matches: Match[];

  activeIndex: number;

  decos: DecorationSet;
}

enum ActionType {
  FIND = 0,
  FIND_NEXT,
  FIND_PREV,
  REPLACE,
  REPLACE_ALL,
}

type Action = {
  type: ActionType;
  props: FindProps;
};

export function find(props: FindProps): Command {
  return (state, dispatch) => {
    if (dispatch == null) return false;
    const plugin = key.get(state) as Plugin<FindProps> | undefined;
    if (plugin == null) return false;
    const tr = state.tr.setMeta(plugin, { type: ActionType.FIND, props });
    dispatch(tr);
    return true;
  };
}

export function findNext(): Command {
  return (state, dispatch) => {
    if (dispatch == null) return false;
    const plugin = key.get(state) as Plugin<FindProps> | undefined;
    if (plugin == null) return false;
    const tr = state.tr.setMeta(plugin, {
      type: ActionType.FIND_NEXT,
      props: { direction: Direction.NEXT },
    });
    dispatch(tr);
    return true;
  };
}

export function findPrevious(): Command {
  return (state, dispatch) => {
    if (dispatch == null) return false;
    const plugin = key.get(state) as Plugin<FindProps> | undefined;
    if (plugin == null) return false;
    const tr = state.tr.setMeta(plugin, {
      type: ActionType.FIND_PREV,
      props: { direction: Direction.PREV },
    });
    dispatch(tr);
    return true;
  };
}
export const _getSelectionForMatch = (
  selection: Selection,
  doc: ProsemirrorNode,
  index: number,
  matches: Match[],
  offset = 0,
): TextSelection => {
  if (matches[index]) {
    return TextSelection.create(doc, matches[index].from + offset);
  }
  return selection as TextSelection;
};

export function replace(view: EditorView, replaceTerm: string, findText: string): Command {
  return (state, dispatch) => {
    if (dispatch == null) return false;
    const plugin = key.get(state) as Plugin<FindProps> | undefined;
    if (plugin == null) return false;
    const props = plugin.getState(state) as PluginProps;
    const { matches, activeIndex: index } = props;
    if (!matches[index]) return false;

    const { from: start, to: end } = matches[index];
    const newIndex = nextIndex(index, matches.length);
    const tr = state.tr;
    tr.insertText(replaceTerm, start, end)
      .setSelection(
        _getSelectionForMatch(
          tr.selection,
          tr.doc,
          newIndex,
          matches,
          newIndex === 0 ? 0 : replaceTerm.length - findText.length,
        ),
      )
      .scrollIntoView();
    dispatch(tr);
    return true;
  };
}

export function replaceAll(view: EditorView, replaceTerm: string): Command {
  return (state, dispatch) => {
    if (dispatch == null) return false;
    const plugin = key.get(state) as Plugin<FindProps> | undefined;
    if (plugin == null) return false;
    const props = plugin.getState(state) as PluginProps;
    const { matches } = props;
    const tr = state.tr;
    matches.forEach((match) => {
      tr.insertText(replaceTerm, tr.mapping.map(match.from), tr.mapping.map(match.to));
    });
    dispatch(tr);
    return true;
  };
}

function _findRegExp(props: PluginProps) {
  return new RegExp(props.findTerm ?? '', !props.caseSensitive ? 'gui' : 'gu');
}

function _gatherFindResults(doc: ProsemirrorNode, props: PluginProps) {
  interface MergedTextNode {
    text: string;
    pos: number;
  }

  props.matches = [];
  let mergedTextNodes: MergedTextNode[] = [];
  let index = 0;

  if (!props.findTerm) {
    return;
  }

  doc.descendants((node, pos) => {
    if (node.isText) {
      const mergedTextNode = mergedTextNodes[index];
      if (mergedTextNode) {
        mergedTextNodes[index] = {
          text: mergedTextNode.text + node.text,
          pos: mergedTextNode.pos,
        };
      } else {
        mergedTextNodes[index] = {
          text: `${node.text}`,
          pos,
        };
      }
    } else {
      index += 1;
    }
  });

  mergedTextNodes = mergedTextNodes.filter(Boolean);
  const regexp = _findRegExp(props);

  for (const { text, pos } of mergedTextNodes) {
    const matches = Array.from(text.matchAll(regexp));
    for (let j = 0; j < matches.length; j += 1) {
      const m = matches[j];

      if (m[0] === '') break;

      if (m.index !== undefined) {
        props.matches.push({
          from: pos + m.index,
          to: pos + m.index + m[0].length,
        });
      }
    }
  }
}

function _getDecorations(doc: ProsemirrorNode, props: PluginProps) {
  return props.matches.map((deco, index) =>
    Decoration.inline(deco.from, deco.to, {
      class: `search` + (index === props.activeIndex ? ' search_lighted' : ''),
    }),
  );
}

function _createDecoration(doc: ProsemirrorNode, props: PluginProps, state: EditorState) {
  _gatherFindResults(doc, props);
  if (props.matches.length > 0) {
    const index = _findSearchIndex(state.selection.from, props.matches);
    props.activeIndex = index;
  }
  const decorations = _getDecorations(doc, props);

  props.decos = decorations ? DecorationSet.create(doc, decorations) : DecorationSet.empty;
  return props;
}

function _handleDocChanged(tr: Transaction, oldProps: PluginProps, newProps: PluginProps) {
  const { activeIndex: index, matches } = oldProps;
  _gatherFindResults(tr.doc, newProps);
  const mappedMatches = matches.map((match) => ({
    start: tr.mapping.map(match.from),
    end: tr.mapping.map(match.to),
  }));

  let newIndex = index;
  const selectedMatch = mappedMatches[index];
  if (selectedMatch) {
    newIndex = newProps.matches.findIndex((match) => match.from === selectedMatch.start);
  }
  if (newIndex == null || newIndex === -1) {
    newIndex = _findSearchIndex(tr.selection.from, newProps.matches);
  }
  newProps.activeIndex = newIndex;
  const decorations = _getDecorations(tr.doc, newProps);
  newProps.decos = decorations ? DecorationSet.create(tr.doc, decorations) : DecorationSet.empty;
  return newProps;
}

function _find(
  tr: Transaction,
  pluginProps: PluginProps,
  props: FindProps,
  state: EditorState,
): PluginProps {
  let actualFind = '';

  if (props.findTerm) {
    actualFind = props.findTerm;
  } else if (!tr.selection.empty) {
    const { from, to } = tr.selection;
    actualFind = tr.doc.textBetween(from, to);
  }

  if (props.disableRegex) actualFind = escapeStringRegexp(actualFind);

  const newProps: PluginProps = {
    ...pluginProps,
    findTerm: actualFind,
    caseSensitive: props.caseSensitive,
    disableRegex: props.disableRegex,
    matches: [],
    activeIndex: 0,
    decos: DecorationSet.empty,
    direction: Direction.NEXT,
  };

  _createDecoration(tr.doc, newProps, state);

  return newProps;
}

/**
 * Finds index of first item in matches array that comes after user's cursor pos.
 * If `backward` is `true`, finds index of first item that comes before instead.
 */
function _findSearchIndex(selectionPos: number, matches: Match[], backward = false): number {
  if (backward) {
    let matchIndex = matches.findIndex((match) => match.from >= selectionPos) - 1;
    if (matchIndex < 0) {
      matchIndex = matches.length - 1; // wrap around from the end
    }
    return matchIndex;
  }
  return Math.max(
    matches.findIndex((match) => match.from >= selectionPos),
    0,
  );
}

export const nextIndex = (currentIndex: number, total: number) => (currentIndex + 1) % total;

export const prevIndex = (currentIndex: number, total: number) =>
  (currentIndex - 1 + total) % total;

function _findNext(tr: Transaction, props: PluginProps, state: EditorState): PluginProps {
  if (props.matches.length === 0) return props;

  const newProps = { ...props };
  let { activeIndex: index } = newProps;
  const { matches } = newProps;
  // compare index from plugin state and index of first match forward from cursor position
  const searchIndex = _findSearchIndex(state.selection.from, matches);
  if (searchIndex === index) {
    // normal case, cycling through matches
    index = nextIndex(index, matches.length);
  } else {
    // cursor has moved
    index = searchIndex;
  }
  newProps.activeIndex = index;
  const decorations = _getDecorations(tr.doc, newProps);

  newProps.decos = decorations ? DecorationSet.create(tr.doc, decorations) : DecorationSet.empty;
  return newProps;
}

function _findPrev(tr: Transaction, props: PluginProps, state: EditorState): PluginProps {
  if (props.matches.length === 0) return props;

  const newProps = { ...props };
  let { activeIndex: index } = newProps;
  const { matches } = newProps;
  // compare index from plugin state and index of first match forward from cursor position
  const searchIndex = _findSearchIndex(state.selection.from, matches, true);
  if (searchIndex === newProps.activeIndex) {
    // normal case, cycling through matches
    index = prevIndex(index, matches.length);
  } else {
    // cursor has moved
    index = searchIndex;
  }
  newProps.activeIndex = index;
  const decorations = _getDecorations(tr.doc, newProps);

  newProps.decos = decorations ? DecorationSet.create(tr.doc, decorations) : DecorationSet.empty;
  return newProps;
}

function reducer(
  tr: Transaction,
  props: PluginProps,
  action: Action,
  state: EditorState,
): PluginProps {
  switch (action.type) {
    case ActionType.FIND:
      return _find(tr, props, action.props, state);

    case ActionType.FIND_NEXT:
      return _findNext(tr, props, state);

    case ActionType.FIND_PREV:
      return _findPrev(tr, props, state);

    case ActionType.REPLACE:
      break;

    case ActionType.REPLACE_ALL:
      break;
  }

  return props;
}

const getFindPlugin = () => {
  const findPlugin: Plugin<PluginProps> = new Plugin({
    key,
    state: {
      init: () =>
        ({
          caseSensitive: false,
          disableRegex: true,
          findTerm: undefined,
          matches: [],
          activeIndex: 0,
          decos: DecorationSet.empty,
          direction: Direction.NEXT,
        } as PluginProps),

      apply(tr, props, oldState) {
        const action = tr.getMeta(findPlugin) as Action | undefined;
        if (action) {
          return reducer(tr, props, action, oldState);
        }

        if (tr.docChanged && props.findTerm) {
          const newProps = { ...props };
          _handleDocChanged(tr, props, newProps);
          return newProps;
        }

        return props;
      },
    },

    props: {
      decorations(state) {
        return findPlugin.getState(state)?.decos;
      },
    },
  });

  return findPlugin;
};

export function getFindProps(state?: EditorState) {
  if (state == null) return;
  const plugin = key.get(state);
  return plugin?.getState(state) as PluginProps;
}

export default getFindPlugin;

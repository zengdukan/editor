import React, { Component } from 'react';
import { render } from 'react-dom';
import type { Node } from 'prosemirror-model';
import type { EditorView } from 'prosemirror-view';
import type { Theme } from '@mui/material';
import { ThemeProvider, StyledEngineProvider } from '@mui/material';
import { Provider } from 'react-redux';
import { isEditable } from '../prosemirror/plugins/editable';
import { opts, ref } from '../connect';
import type { GetPos, NodeViewProps } from './types';

declare module '@mui/styles/defaultTheme' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface DefaultTheme extends Theme {}
}

export type Options = {
  wrapper: 'span' | 'div';
  className?: string;
  enableSelectionHighlight?: boolean;
};

export type ClassWrapperProps = {
  node: Node;
  view: EditorView;
  getPos: GetPos;
  Child: React.FunctionComponent<NodeViewProps>;
};

type ClassWrapperState = {
  open: boolean;
  edit: boolean;
};

class ClassWrapper extends Component<ClassWrapperProps, ClassWrapperState> {
  constructor(props: ClassWrapperProps) {
    super(props);
    this.state = {
      open: false,
      edit: false,
    };
  }

  render() {
    const { view, node, getPos, Child } = this.props;
    const { open, edit } = this.state;
    return (
      <Child
        {...{
          view,
          node,
          getPos,
          open,
          edit,
        }}
      />
    );
  }
}

export class ReactWrapper {
  dom: HTMLElement;

  node: Node;

  view: EditorView;

  editor: null | React.Component = null;

  getPos: GetPos;

  isSelectionHighlightEnabled: boolean;

  constructor(
    NodeView: React.FunctionComponent<NodeViewProps>,
    nodeViewPos: Omit<ClassWrapperProps, 'Child'>,
    options: Options,
  ) {
    const { node, view, getPos } = nodeViewPos;
    this.node = node;
    this.view = view;
    this.getPos = getPos;
    this.isSelectionHighlightEnabled = !!options.enableSelectionHighlight;
    this.dom = document.createElement(options.wrapper);
    if (options.className) this.dom.classList.add(options.className);

    render(
      <StyledEngineProvider injectFirst>
        <ThemeProvider theme={opts.theme}>
          <Provider store={ref.store()}>
            <ClassWrapper
              {...{
                node,
                view,
                getPos,
                Child: NodeView,
              }}
              ref={(r) => {
                this.editor = r;
              }}
            />
          </Provider>
        </ThemeProvider>
      </StyledEngineProvider>,
      this.dom,
      async () => {
        const edit = isEditable(this.view.state);
        this.editor?.setState({ open: false, edit });
      },
    );
  }

  selectNode() {
    const edit = isEditable(this.view.state);
    this.editor?.setState({ open: true, edit });
    if (!edit || !this.isSelectionHighlightEnabled) return;
    this.dom.classList.add('ProseMirror-selectednode');
  }

  deselectNode() {
    const edit = isEditable(this.view.state);
    this.editor?.setState({ open: false, edit });
    if (!this.isSelectionHighlightEnabled) return;
    this.dom.classList.remove('ProseMirror-selectednode');
  }

  update(node: Node) {
    // TODO: this has decorations in the args!
    if (!node.sameMarkup(this.node)) return false;
    this.node = node;
    const edit = isEditable(this.view.state);
    this.editor?.setState({ edit });
    return true;
  }
}

function createNodeView(
  Editor: React.FunctionComponent<NodeViewProps>,
  options: Options = { wrapper: 'div' },
) {
  return (node: Node, view: EditorView, getPos: boolean | GetPos) =>
    new ReactWrapper(Editor, { node, view, getPos: getPos as GetPos }, options);
}

export default createNodeView;

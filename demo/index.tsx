import React from 'react';
import ReactDOM from 'react-dom';
import { createStore, applyMiddleware } from 'redux';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { Button, createTheme, IconButton, Box, Paper, styled } from '@material-ui/core';
import LockIcon from '@material-ui/icons/Lock';
import { toHTML, toMarkdown, toTex, ReferenceKind } from '@curvenote/schema';
import { Sidenote, AnchorBase } from 'sidenotes';
import { isEditable } from '../src/prosemirror/plugins/editable';
import {
  actions,
  Editor,
  EditorMenu,
  Store,
  setup,
  Suggestions,
  Attributes,
  InlineActions,
  LinkResult,
} from '../src';
import rootReducer from './reducers';
import middleware from './middleware';
import '../styles/index.scss';
import 'sidenotes/dist/sidenotes.css';
import { Options } from '../src/connect';
import snippet from './snippet';
import SuggestionSwitch from '../src/components/Suggestion/Switch';
import InlineActionSwitch from '../src/components/InlineActions/Switch';

declare global {
  interface Window {
    [index: string]: any;
  }
}

const Item = styled(Paper)(({ theme }) => ({
  ...theme.typography.body2,
  padding: theme.spacing(1),
  textAlign: 'center',
  color: theme.palette.text.secondary,
}));

const store: Store = createStore(rootReducer, applyMiddleware(...middleware));
const theme = createTheme({});

const stateKey = 'myEditor';
const viewId1 = 'view1';
const docId = 'docId';
const newComment = () => {
  store.dispatch(actions.addCommentToSelectedView('sidenote1'));
};
const removeComment = () => {
  store.dispatch(actions.removeComment(viewId1, 'sidenote1'));
};

const someLinks: LinkResult[] = [
  {
    kind: ReferenceKind.cite,
    uid: 'simpeg2015',
    label: 'simpeg',
    content: 'Cockett et al., 2015',
    title:
      'SimPEG: An open source framework for simulation and gradient based parameter estimation in geophysical applications.',
  },
  {
    kind: ReferenceKind.link,
    uid: 'https://curvenote.com',
    label: null,
    content: 'Curvenote',
    title: 'Move ideas forward',
  },
];

const opts: Options = {
  transformKeyToId: (key) => key,
  uploadImage: async (file) => {
    // eslint-disable-next-line no-console
    console.log(file);
    return new Promise((resolve) =>
      setTimeout(() => resolve('https://curvenote.dev/images/logo.png'), 2000),
    );
  },
  addComment() {
    newComment();
    return true;
  },
  onDoubleClick(stateId, viewId) {
    // eslint-disable-next-line no-console
    console.log('Double click', stateId, viewId);
    return false;
  },
  getDocId() {
    return docId;
  },
  theme,
  throttle: 0,
  citationPrompt: async () => [
    {
      key: 'simpeg2015',
      kind: ReferenceKind.cite,
      text: 'Cockett et al, 2015',
      label: 'simpeg',
      title: '',
    },
  ],
  createLinkSearch: async () => ({ search: () => someLinks }),
  nodeViews: {},
};

setup(store, opts);

window.store = store;
store.dispatch(actions.initEditorState('full', stateKey, true, snippet, 0));

function selectEditorState(state: any, key: string) {
  return state.editor.state.editors[stateKey];
}

store.subscribe(() => {
  const myst = document.getElementById('myst');
  const tex = document.getElementById('tex');
  const html = document.getElementById('html');
  const editor = selectEditorState(store.getState(), stateKey);
  if (myst) {
    try {
      myst.innerText = toMarkdown(editor.state.doc);
    } catch (e) {
      myst.innerText = 'Error converting to markdown';
    }
  }
  if (tex) {
    try {
      tex.innerText = toTex(editor.state.doc);
    } catch (error) {
      tex.innerText = 'There was an error :(';
    }
  }
  if (html) {
    html.innerText = toHTML(editor.state.doc, editor.state.schema, document);
  }
});

function DemoUI() {
  const editor = useSelector((s) => selectEditorState(s, stateKey));
  const dispatch = useDispatch();
  console.log('state', editor);
  const [locked, setLocked] = React.useState(isEditable(editor.state));
  console.log('isEdiable', locked);

  return (
    <Box
      maxWidth={800}
      mx="auto"
      display="flex"
      flexDirection="row"
      position="fixed"
      bottom={0}
      right={0}
    >
      <Item>
        <IconButton
          aria-label="delete"
          size="small"
          onClick={() => {
            const state = editor.state.reconfigure({
              plugins: [],
            });
            dispatch(actions.updateEditorState(stateKey, viewId, next, tr));
          }}
        >
          <LockIcon />
        </IconButton>
      </Item>
    </Box>
  );
}

ReactDOM.render(
  <Provider store={store}>
    <React.StrictMode>
      <EditorMenu standAlone />
      <DemoUI />
      <InlineActions>
        <InlineActionSwitch />
      </InlineActions>
      <article id={docId} className="content centered">
        <AnchorBase anchor="anchor">
          <div className="selected">
            <Editor stateKey={stateKey} viewId={viewId1} />
          </div>
        </AnchorBase>
        {/* <Editor stateKey={stateKey} viewId="two" /> */}
        <div className="sidenotes">
          <Sidenote sidenote="sidenote1" base="anchor">
            <div style={{ width: 280, height: 100, backgroundColor: 'green' }} />
          </Sidenote>
          <Sidenote sidenote="sidenote2" base="anchor">
            <div style={{ width: 280, height: 100, backgroundColor: 'red' }} />
          </Sidenote>
        </div>
      </article>
      <div className="centered">
        <p>
          Select some text to create an inline comment (cmd-opt-m). See
          <a href="https://curvenote.com"> curvenote.com </a>
          for full demo.
        </p>
        <Button onClick={newComment}>Comment</Button>
        <Button onClick={removeComment}>Remove</Button>
      </div>
      <Suggestions>
        <SuggestionSwitch />
      </Suggestions>
      <Attributes />
    </React.StrictMode>
  </Provider>,
  document.getElementById('root'),
);

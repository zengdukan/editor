import type { MyNodeSpec, NumberedNode } from './types';
import { NodeGroups } from './types';
import type { Code } from '../nodespec';
import type { MdFormatSerialize } from '../serialize/types';
import { createLatexStatement } from '../serialize/tex/utils';
import { getAttr, getNumberedAttrs, getNumberedDefaultAttrs, setNumberedAttrs } from './utils';

export type Attrs = NumberedNode & {
  title: string;
};

const name = 'mermaid';
const mermaid: MyNodeSpec<Attrs, Code> = {
  group: NodeGroups.top,
  // Content can have display elements inside of it for dynamic equations
  content: `(${NodeGroups.text} | display)*`,
  draggable: false,
  marks: '',
  // The view treat the node as a leaf, even though it technically has content
  atom: true,
  whitespace: 'pre',
  code: true,
  attrs: {
    ...getNumberedDefaultAttrs(),
    title: { default: '' },
  },
  toDOM: (node) => {
    const { title } = node.attrs;
    return [
      'pre',
      {
        'data-type': name,
        class: name,
        ...setNumberedAttrs(node.attrs),
        title: title || undefined,
      },
      ['code', 0],
    ];
  },
  parseDOM: [
    {
      tag: `pre[data-type="${name}"]`,
      getAttrs(dom) {
        return {
          ...getNumberedAttrs(dom),
          title: getAttr(dom, 'title'),
        };
      },
    },
  ],

  attrsFromMyst: (token) => ({
    id: token.identifier || null,
    label: null,
    numbered: false,
    language: name,
    title: '',
  }),

  toMyst: (props) => {
    if (props.children?.length === 1) {
      return {
        type: 'code',
        lang: name,
        value: props.children[0].value || '',
      };
    }
    throw new Error(`Code block node does not have one child`);
  },
};

export const toMarkdown: MdFormatSerialize = (state, node) => {
  const language = name;
  const fence = '```';
  state.write(`${fence}${language}\n`);
  state.text(node.textContent, false);
  state.ensureNewLine();
  state.write(fence);
  state.closeBlock(node);
};

export const toTex = createLatexStatement(
  () => ({
    command: 'verbatim',
  }),
  (state, node) => {
    state.renderContent(node);
  },
);

export default mermaid;

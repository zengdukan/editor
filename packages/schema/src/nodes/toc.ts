import type { MyNodeSpec } from './types';
import { NodeGroups } from './types';
import type { MdFormatSerialize, TexFormatSerialize } from '../serialize/types';
import type { NoAttrs, TOC } from '../spec';

const name = 'toc';
const toc: MyNodeSpec<NoAttrs, TOC> = {
  group: NodeGroups.top,
  atom: true,
  marks: '',
  attrs: {},
  parseDOM: [
    {
      tag: name,
    },
  ],
  toDOM() {
    return [name];
  },
  attrsFromMyst: () => ({}),
  toMyst: () => ({
    type: name,
  }),
};

export const toMarkdown: MdFormatSerialize = (state, node) => {
  state.write('[toc]');
  state.ensureNewLine();
};

export const toTex: TexFormatSerialize = (state, node) => {
  state.write('[toc]');
  state.ensureNewLine();
};

export default toc;

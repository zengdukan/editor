import type { TaskList, TaskItem, NoAttrs } from '../nodespec';
import { NodeGroups } from './types';
import type { MyNodeSpec } from './types';
import type { MdFormatSerialize, TexFormatSerialize } from '../serialize/types';

const name = 'task_list';
const task_list: MyNodeSpec<NoAttrs, TaskList> = {
  attrs: {},
  group: NodeGroups.block,
  content: 'task_item+',
  toDOM() {
    return ['ul', { class: name }, 0];
  },
  parseDOM: [
    {
      tag: `[class="${name}"]`,
    },
  ],
  attrsFromMyst() {
    return {};
  },
  toMyst(props) {
    return {
      type: 'taskList',
      children: (props.children || []) as TaskItem[],
    };
  },
};

export const toMarkdown: MdFormatSerialize = (state, node) => {
  state.renderList(node, '  ', () => '- ');
};

export const toTex: TexFormatSerialize = (state, node) => {
  state.renderList(node, '  ', () => '- ');
};

export default task_list;

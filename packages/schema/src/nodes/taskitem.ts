import type { TaskItem, PhrasingContent } from '../nodespec';
import { NodeGroups } from './types';
import type { MyNodeSpec } from './types';
import type { MdFormatSerialize, TexFormatSerialize } from '../serialize/types';

export type TaskItemAttrs = {
  checked: boolean;
};

const name = 'task_item';
const task_item: MyNodeSpec<TaskItemAttrs, TaskItem> = {
  attrs: {
    checked: { default: false },
  },
  defining: true,
  draggable: true,
  content: `paragraph ${NodeGroups.block}*`,
  toDOM(node) {
    return [
      'li',
      {
        'data-type': name,
        class: node.attrs.checked ? 'checked' : undefined,
      },
      [
        'span',
        {
          contentEditable: false,
        },
        [
          'input',
          {
            type: 'checkbox',
            checked: node.attrs.checked ? 'checked' : undefined,
            tabIndex: -1,
          },
        ],
      ],
      ['div', 0],
    ];
  },

  parseDOM: [
    {
      tag: `li[data-type="${name}"]`,
      getAttrs: (dom: HTMLLIElement) => ({
        checked: dom.className.includes('checked'),
      }),
    },
  ],

  attrsFromMyst: (token) => ({ checked: token.checked }),
  toMyst: (props) => {
    let { children } = props;
    if (children && children.length === 1 && children[0].type === 'paragraph') {
      children = children[0].children;
    }
    return {
      type: 'taskItem',
      checked: props.checked,
      children: (children || []) as PhrasingContent[],
    };
  },
};

export const toMarkdown: MdFormatSerialize = (state, node) => {
  state.write(node.attrs.checked ? '[x] ' : '[ ] ');
  state.renderContent(node);
};

export const toTex: TexFormatSerialize = (state, node) => {
  state.write(node.attrs.checked ? '[x] ' : '[ ] ');
  state.renderContent(node);
};

export default task_item;

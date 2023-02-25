import React from 'react';
import type { NodeViewProps } from './types';
import createNodeView from './NodeView';
import type { State } from '../store/types';
import { useSelector } from 'react-redux';

function TocNodeView({ view }: NodeViewProps) {
  const counter = useSelector((state: State) => {
    const viewId = view.dom.id;
    if (viewId == null) return;
    const stateId = state.editor.state.views[viewId].stateId;
    return state.editor.state.editors[stateId]?.counts;
  });

  return (
    <ul className="toc_list">
      {counter?.sec.all.map(({ id, title, meta: { level } }) => (
        <li key={id} className={`toc_item toc_item_${level}`}>
          <a href={`#${id}`}>{title}</a>
        </li>
      ))}
    </ul>
  );
}

export const TocView = createNodeView(TocNodeView, {
  wrapper: 'div',
  className: 'toc',
  enableSelectionHighlight: true,
});

import React from 'react';
import { isNodeSelection } from '@curvenote/prosemirror-utils';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { StaticDatePicker } from '@mui/x-date-pickers/StaticDatePicker';
import TextField from '@mui/material/TextField';
import { getDatetime } from '@curvenote/schema';
import { useDispatch, useSelector } from 'react-redux';
import { updateNodeAttrs } from '../../store/actions';
import type { State, Dispatch } from '../../store/types';
import { getEditorState } from '../../store/selectors';
import type { ActionProps } from './utils';
import { getNodeFromSelection } from '../../store/ui/utils';

function TimeActions(props: ActionProps) {
  const { stateId, viewId } = props;
  const dispatch = useDispatch<Dispatch>();
  const selection = useSelector((state: State) => getEditorState(state, stateId)?.state?.selection);
  if (!selection || !isNodeSelection(selection)) return null;
  const node = getNodeFromSelection(selection);

  const date = getDatetime(node?.attrs.datetime);
  const { from } = selection;
  const onChange = (newDate: Date | null) => {
    if (!newDate || !node || from == null) return;
    dispatch(
      updateNodeAttrs(
        stateId,
        viewId,
        { node, pos: from },
        { datetime: newDate.toISOString() },
        'after',
      ),
    );
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <StaticDatePicker
        displayStaticWrapperAs="desktop"
        value={date}
        onChange={onChange}
        renderInput={(params) => <TextField {...params} />}
      />
    </LocalizationProvider>
  );
}

export default TimeActions;

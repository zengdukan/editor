import React from 'react';
import { useSelector } from 'react-redux';
import { Typography } from '@mui/material';
import { makeStyles, createStyles } from '@mui/styles';
import isEqual from 'lodash.isequal';
import type { State } from '../../store/types';
import { selectors } from '../../store';
import Suggestion from './Suggestion';
import type { VariableResult } from '../../store/suggestion/types';

const useStyles = makeStyles(() =>
  createStyles({
    root: {
      position: 'relative',
      '& div': {
        position: 'absolute',
        padding: '0 3px',
        border: '1px solid #FFF',
        fontFamily: 'system- ui, "Noto Sans"',
        fontSize: 12,
        color: '#5f5f5f',
        top: 3,
        right: 3,
        backgroundColor: '#D4D4D4',
        borderRadius: 3,
      },
      '& h6': {
        marginRight: 50,
      },
      '& span': {
        margin: 5,
        marginRight: 50,
      },
    },
  }),
);

function VariableSuggestions() {
  const results = useSelector(
    (state: State) => selectors.getSuggestionResults<VariableResult>(state),
    isEqual,
  );
  const classes = useStyles();
  return (
    <div>
      {results.map((item, index) => (
        <Suggestion key={item.id} index={index} className={classes.root}>
          {item.current !== undefined && <div>{String(item.current)}</div>}
          <Typography variant="subtitle1">{item.name}</Typography>
          <Typography variant="caption">{item.description}</Typography>
        </Suggestion>
      ))}
    </div>
  );
}

export default VariableSuggestions;

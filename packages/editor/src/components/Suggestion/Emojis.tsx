import React from 'react';
import { useSelector } from 'react-redux';
import { Typography } from '@mui/material';
import { makeStyles, createStyles } from '@mui/styles';
import isEqual from 'lodash.isequal';
import type { State } from '../../store/types';
import { selectors } from '../../store';
import Suggestion from './Suggestion';
import type { EmojiResult } from '../../store/suggestion/types';

const useStyles = makeStyles(() =>
  createStyles({
    root: {
      '& span': {
        // eslint-disable-next-line quotes
        fontFamily: "'Noto Serif', serif",
        margin: 5,
        marginRight: 15,
      },
    },
    none: {
      margin: 10,
    },
  }),
);

function EmojiSuggestions() {
  const results = useSelector(
    (state: State) => selectors.getSuggestionResults<EmojiResult>(state),
    isEqual,
  );

  const classes = useStyles();

  if (results.length === 0) {
    return (
      <Typography variant="subtitle2" className={classes.none}>
        No emoji found, try a different search!
      </Typography>
    );
  }

  return (
    <div>
      {results.map((item, index) => (
        <Suggestion key={item.c} index={index} className={classes.root}>
          <Typography>
            <span>{item.c}</span>
            {item.n}
          </Typography>
        </Suggestion>
      ))}
    </div>
  );
}

export default EmojiSuggestions;

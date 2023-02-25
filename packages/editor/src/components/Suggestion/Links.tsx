import React from 'react';
import { useSelector } from 'react-redux';
import { Typography } from '@mui/material';
import isEqual from 'lodash.isequal';
import type { State } from '../../store/types';
import { selectors } from '../../store';
import Suggestion from './Suggestion';
import type { LinkResult } from '../../store/suggestion/types';

function LinkSuggestions() {
  const results = useSelector(
    (state: State) => selectors.getSuggestionResults<LinkResult>(state),
    isEqual,
  );
  if (results.length === 0) {
    return (
      <Suggestion index={0}>
        <Typography variant="subtitle2">
          Start typing to search through your links and citations.
        </Typography>
      </Suggestion>
    );
  }

  return (
    <div>
      {results.map((item, index) => (
        <Suggestion key={item.uid} index={index}>
          <Typography variant="subtitle2">{item?.content}</Typography>
          <Typography variant="caption">{item?.title || item.uid}</Typography>
        </Suggestion>
      ))}
    </div>
  );
}

export default LinkSuggestions;

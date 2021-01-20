/* eslint-disable react/prop-types */
import React from 'react';
import { connect } from 'react-redux';
import { Typography, makeStyles, createStyles } from '@material-ui/core';
import { State, Dispatch } from '../../store/types';
import { selectors, actions } from '../../store';
import Suggestion from './Suggestion';
import { CommandResult } from '../../store/suggestion/commands';

type Props = {
  selected: number;
  results: CommandResult[];
  onClick: (index: number) => void;
  onHover: (index: number) => void;
};


const useStyles = makeStyles(() => createStyles({
  root: {
    position: 'relative',
    '& div': {
      position: 'absolute',
      padding: '0 3px',
      border: '1px solid #FFF',
      fontFamily: 'system-ui, "Noto Sans"',
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
}));


const CommandSuggestions: React.FC<Props> = (props) => {
  const {
    results, selected, onClick, onHover,
  } = props;

  const classes = useStyles();
  return (
    <div>
      {results.map(((item, index) => (
        <Suggestion
          key={item.name}
          onClick={() => onClick(index)}
          onHover={() => onHover(index)}
          selected={selected === index}
          className={classes.root}
        >
          {item.shortcut && <div>{item.shortcut}</div>}
          <Typography variant="subtitle1">
            {item.title}
          </Typography>
          <Typography variant="caption">
            {item.description}
          </Typography>
        </Suggestion>
      )))}
    </div>
  );
};

const mapStateToProps = (state: State) => {
  const { results, selected } = selectors.getSuggestion(state);
  return {
    selected,
    results: results as CommandResult[],
  };
};

const mapDispatchToProps = (dispatch: Dispatch) => ({
  onClick: (index: number) => dispatch(actions.chooseSelection(index)),
  onHover: (index: number) => dispatch(actions.selectSuggestion(index)),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(CommandSuggestions);

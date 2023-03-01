import React, { useCallback, useState } from 'react';
import { Grid, Input, CircularProgress } from '@mui/material';
import { makeStyles, createStyles } from '@mui/styles';
import MenuIcon from '../Menu/Icon';

const useStyles = makeStyles(() =>
  createStyles({
    root: {
      fontSize: 20,
      flexWrap: 'nowrap',
    },
    input: {
      flexGrow: 1,
    },
  }),
);

type Props = {
  text: string;
  help: string;
  validate?: (text: string) => boolean | Promise<boolean>;
  onSubmit: (text: string) => void;
  onChange?: (text: string) => void; // eslint-disable-line
  onCancel: () => void;
  enableSubmitIfInvalid?: boolean;
};

function TextAction(props: Props) {
  const {
    text: initial,
    help,
    validate,
    onSubmit,
    onCancel,
    onChange,
    enableSubmitIfInvalid = false,
  } = props;
  const classes = useStyles();
  const [text, setText] = useState(initial);
  const [current, setCurrent] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [valid, setValid] = useState(true);

  const updateText: React.ChangeEventHandler<HTMLInputElement> = useCallback(
    (e) => {
      const t = e.currentTarget.value;
      if (!validate) {
        setValid(true);
        setText(t);
        setCurrent(t);
        onChange?.(t);
        return;
      }
      setLoading(true);
      setCurrent(t);
      onChange?.(t);
      Promise.all([validate(t)]).then(([b]) => {
        setLoading(false);
        if (enableSubmitIfInvalid || b) {
          setValid(b);
          setText(t);
          return;
        }
        setValid(false);
      });
    },
    [onChange, validate, enableSubmitIfInvalid],
  );

  return (
    <Grid container alignItems="center" justifyContent="space-between" className={classes.root}>
      <MenuIcon kind="cancel" onClick={onCancel} />
      <Input
        autoFocus
        disableUnderline
        fullWidth
        value={current}
        className={classes.input}
        onChange={updateText}
        onKeyDownCapture={(e) => {
          if (e.key === 'Enter') {
            if (loading) return;
            if (!valid && !enableSubmitIfInvalid) return;
            e.stopPropagation();
            e.preventDefault();
            onSubmit(text);
          } else if (e.key === 'Escape') {
            e.stopPropagation();
            e.preventDefault();
            onCancel();
          }
        }}
      />
      {loading && <CircularProgress size={18} />}
      <MenuIcon
        kind="enterSave"
        title={valid ? 'Save' : help}
        disabled={loading || (!valid && !enableSubmitIfInvalid)}
        error={!valid}
        onClick={() => onSubmit(text)}
      />
    </Grid>
  );
}

export default TextAction;

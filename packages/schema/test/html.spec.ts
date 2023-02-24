import { JSDOM } from 'jsdom';
import { fromHTML, toHTML } from '../src';
import { compare, tnodes, tdoc } from './build';

const { document, DOMParser } = new JSDOM('').window;

const same = compare(
  (c) => fromHTML(c, 'full', document, DOMParser),
  (doc) => toHTML(doc, 'full', document),
);

const {
  blockquote,
  h1,
  h2,
  p,
  hr,
  li,
  ol,
  ol3,
  ul,
  pre,
  em,
  strong,
  code,
  a,
  link,
  br,
  img,
  variable,
  variableDerived,
  math,
  equation,
  range,
  dynamic,
} = tnodes;

describe('HTML', () => {
  // it('parses headings', () =>
  //   same('<h1>one</h1><h2>two</h2><p>three</p>', tdoc(h1('one'), h2('two'), p('three'))));
  it('parses variables', () =>
    same('<r-var name="x" value="1" format=".0f"></r-var>', tdoc(variable())));
  it('parses derived variables', () =>
    same('<r-var name="y" :value="x + 1" format=".0f"></r-var>', tdoc(variableDerived())));
  it('parses ranges', () =>
    same(
      '<p><r-range :value="v" :change="{v: value}" min="0" max="10" step="0.1"></r-range></p>',
      tdoc(p('', range())),
    ));
  it('parses dynamics', () =>
    same(
      '<p><r-dynamic :value="v" :change="{v: value}" format=".0f" min="0" max="10" step="0.1"></r-dynamic></p>',
      tdoc(p('', dynamic())),
    ));
  it('parses equations', () =>
    same(
      '<p>A line is: <r-equation inline="">y = mx + b</r-equation></p>',
      tdoc(p('A line is: ', math('y = mx + b'))),
    ));
  it('parses inline equations', () =>
    same(
      '<p>A line is:</p><r-equation>y = mx + b</r-equation>',
      tdoc(p('A line is:'), equation('y = mx + b')),
    ));
  it('does not parse scripts', () =>
    same({ before: '<script>alert("hi");</script>', after: '<p></p>' }, tdoc(p())));
});

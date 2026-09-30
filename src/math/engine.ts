// Fralculator expression engine.
// Tokenizer + recursive-descent parser producing an AST, then an evaluator
// that records human-readable intermediate steps (for students).

export type AngleMode = 'deg' | 'rad';

type Token =
  | { type: 'num'; value: string }
  | { type: 'id'; value: string }
  | { type: 'op'; value: string }
  | { type: 'lparen'; value: string }
  | { type: 'rparen'; value: string };

export type Node =
  | { kind: 'num'; value: number }
  | { kind: 'var'; name: string }
  | { kind: 'const'; name: string }
  | { kind: 'un'; op: '+' | '-'; operand: Node }
  | { kind: 'bin'; op: '+' | '-' | '*' | '/' | '^'; left: Node; right: Node }
  | { kind: 'pct'; operand: Node }
  | { kind: 'call'; fn: string; arg: Node };

const FUNCS = new Set([
  'sin', 'cos', 'tan', 'asin', 'acos', 'atan',
  'sqrt', 'cbrt', 'ln', 'log', 'abs', 'floor', 'ceil',
]);
const CONSTS: Record<string, number> = { pi: Math.PI, e: Math.E, tau: Math.PI * 2 };

export function tokenize(src: string): Token[] {
  const s = src
    .replace(/\s+/g, '')
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-')
    .replace(/·/g, '*');
  const tokens: Token[] = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (/[0-9.]/.test(c)) {
      let j = i;
      while (j < s.length && /[0-9.]/.test(s[j])) j++;
      const num = s.slice(i, j);
      if ((num.match(/\./g) || []).length > 1) throw new Error(`Invalid number "${num}"`);
      tokens.push({ type: 'num', value: num });
      i = j;
    } else if (c === 'π') {
      tokens.push({ type: 'id', value: 'pi' });
      i++;
    } else if (/[a-zA-Z]/.test(c)) {
      let j = i;
      while (j < s.length && /[a-zA-Z]/.test(s[j])) j++;
      tokens.push({ type: 'id', value: s.slice(i, j).toLowerCase() });
      i = j;
    } else if ('+-*/^%'.includes(c)) {
      tokens.push({ type: 'op', value: c });
      i++;
    } else if (c === '(') {
      tokens.push({ type: 'lparen', value: c });
      i++;
    } else if (c === ')') {
      tokens.push({ type: 'rparen', value: c });
      i++;
    } else if (c === ',') {
      i++;
    } else {
      throw new Error(`Unexpected character "${c}"`);
    }
  }
  return tokens;
}

class Parser {
  private pos = 0;
  constructor(
    private tokens: Token[],
    public angleMode: AngleMode,
  ) {}

  private peek(): Token | undefined {
    return this.tokens[this.pos];
  }
  private next(): Token | undefined {
    return this.tokens[this.pos++];
  }
  private expectOp(v: string) {
    const t = this.next();
    const ok = t && ((t.type === 'op' && t.value === v) || (v === '(' && t.type === 'lparen') || (v === ')' && t.type === 'rparen'));
    if (!ok) throw new Error(`Expected "${v}"`);
  }

  parse(): Node {
    const node = this.parseExpr();
    if (this.pos < this.tokens.length) throw new Error('Unexpected trailing input');
    return node;
  }

  private parseExpr(): Node {
    let left = this.parseTerm();
    for (;;) {
      const t = this.peek();
      if (t?.type === 'op' && (t.value === '+' || t.value === '-')) {
        this.next();
        left = { kind: 'bin', op: t.value, left, right: this.parseTerm() };
      } else break;
    }
    return left;
  }

  private startsFactor(t: Token | undefined): boolean {
    if (!t) return false;
    return t.type === 'num' || t.type === 'id' || t.type === 'lparen';
  }

  private parseTerm(): Node {
    let left = this.parseUnary();
    for (;;) {
      const t = this.peek();
      if (t?.type === 'op' && (t.value === '*' || t.value === '/')) {
        this.next();
        left = { kind: 'bin', op: t.value, left, right: this.parseUnary() };
      } else if (this.startsFactor(t)) {
        // implicit multiplication: 2x, (a)(b), 3sin(x)
        left = { kind: 'bin', op: '*', left, right: this.parseUnary() };
      } else break;
    }
    return left;
  }

  private parseUnary(): Node {
    const t = this.peek();
    if (t?.type === 'op' && (t.value === '-' || t.value === '+')) {
      this.next();
      return { kind: 'un', op: t.value, operand: this.parseUnary() };
    }
    return this.parsePower();
  }

  private parsePower(): Node {
    const base = this.parsePostfix();
    const t = this.peek();
    if (t?.type === 'op' && t.value === '^') {
      this.next();
      const exp = this.parseUnary(); // right-associative, allows -x
      return { kind: 'bin', op: '^', left: base, right: exp };
    }
    return base;
  }

  private parsePostfix(): Node {
    let node = this.parsePrimary();
    while (this.peek()?.type === 'op' && this.peek()!.value === '%') {
      this.next();
      node = { kind: 'pct', operand: node };
    }
    return node;
  }

  private parsePrimary(): Node {
    const t = this.next();
    if (!t) throw new Error('Unexpected end of expression');
    if (t.type === 'num') return { kind: 'num', value: parseFloat(t.value) };
    if (t.type === 'lparen') {
      const inner = this.parseExpr();
      this.expectOp(')');
      return inner;
    }
    if (t.type === 'id') {
      const name = t.value;
      if (FUNCS.has(name)) {
        this.expectOp('(');
        const arg = this.parseExpr();
        this.expectOp(')');
        return { kind: 'call', fn: name, arg };
      }
      if (name in CONSTS) return { kind: 'const', name };
      if (name.length === 1) return { kind: 'var', name }; // e.g. x for graphing
      throw new Error(`Unknown name "${name}"`);
    }
    throw new Error('Unexpected token');
  }
}

export function formatNumber(v: number): string {
  if (!Number.isFinite(v)) return '∞';
  if (Object.is(v, -0)) return '0';
  const r = Math.abs(v) >= 1e15 || (Math.abs(v) < 1e-9 && v !== 0)
    ? v.toExponential(8).replace(/\.?0+e/, 'e')
    : String(parseFloat(v.toPrecision(12)));
  return r;
}

export interface EvalResult {
  value: number;
  steps: string[];
}

const OP_SYMBOL: Record<string, string> = { '+': '+', '-': '−', '*': '×', '/': '÷', '^': '^' };

function pretty(node: Node, env?: Record<string, number>): string {
  switch (node.kind) {
    case 'num': return formatNumber(node.value);
    case 'var': return node.name;
    case 'const': return node.name === 'pi' ? 'π' : node.name;
    case 'un': return node.op === '-' ? `−${pretty(node.operand, env)}` : pretty(node.operand, env);
    case 'bin': {
      const l = pretty(node.left, env);
      const r = pretty(node.right, env);
      if (node.op === '*') return `${l} × ${r}`;
      return `${l} ${OP_SYMBOL[node.op]} ${r}`;
    }
    case 'pct': return `${pretty(node.operand, env)}%`;
    case 'call': return `${node.fn}(${pretty(node.arg, env)})`;
  }
}

export function evaluate(
  ast: Node,
  env: Record<string, number> = {},
  angleMode: AngleMode = 'deg',
  steps?: string[],
): number {
  const push = (s: string) => steps?.push(s);
  const deg = (v: number) => (angleMode === 'deg' ? (v * Math.PI) / 180 : v);
  const val = (n: Node): number => {
    switch (n.kind) {
      case 'num':
        return n.value;
      case 'var': {
        if (n.name in env) return env[n.name];
        throw new Error(`"${n.name}" is not defined (use it in the Graph tab)`);
      }
      case 'const':
        return CONSTS[n.name];
      case 'un':
        return n.op === '-' ? -val(n.operand) : val(n.operand);
      case 'pct':
        return val(n.operand) / 100;
      case 'call': {
        const a = val(n.arg);
        const argPretty = pretty(n.arg);
        let r: number;
        switch (n.fn) {
          case 'sin': r = Math.sin(deg(a)); break;
          case 'cos': r = Math.cos(deg(a)); break;
          case 'tan': r = Math.tan(deg(a)); break;
          case 'asin': r = angleMode === 'deg' ? (Math.asin(a) * 180) / Math.PI : Math.asin(a); break;
          case 'acos': r = angleMode === 'deg' ? (Math.acos(a) * 180) / Math.PI : Math.acos(a); break;
          case 'atan': r = angleMode === 'deg' ? (Math.atan(a) * 180) / Math.PI : Math.atan(a); break;
          case 'sqrt': r = Math.sqrt(a); break;
          case 'cbrt': r = Math.cbrt(a); break;
          case 'ln': r = Math.log(a); break;
          case 'log': r = Math.log10(a); break;
          case 'abs': r = Math.abs(a); break;
          case 'floor': r = Math.floor(a); break;
          case 'ceil': r = Math.ceil(a); break;
          default: throw new Error(`Unknown function ${n.fn}`);
        }
        if (!Number.isFinite(r) && Number.isFinite(a)) throw new Error(`${n.fn}(${argPretty}) is not defined`);
        push(`${n.fn}(${argPretty}) = ${formatNumber(r)}`);
        return r;
      }
      case 'bin': {
        const lv = val(n.left);
        const rv = val(n.right);
        const l = pretty(n.left);
        const r = pretty(n.right);
        let out: number;
        switch (n.op) {
          case '+': out = lv + rv; break;
          case '-': out = lv - rv; break;
          case '*': out = lv * rv; break;
          case '/':
            if (rv === 0) throw new Error('Division by zero');
            out = lv / rv;
            break;
          case '^': out = Math.pow(lv, rv); break;
        }
        if (Number.isFinite(out)) {
          const op = OP_SYMBOL[n.op];
          const isTrivial =
            (n.op === '+' && lv === 0) || (n.op === '-' && rv === 0) ||
            (n.op === '*' && (lv === 1 || rv === 1)) || (n.op === '/' && rv === 1) ||
            (n.op === '^' && (rv === 1 || lv === 1));
          if (!isTrivial) push(`${l} ${op} ${r} = ${formatNumber(out)}`);
        }
        return out;
      }
    }
  };

  const result = val(ast);
  if (!Number.isFinite(result)) throw new Error('Result is not finite');
  return result;
}

export interface ParseResult {
  value: number;
  steps: string[];
}

/** Parse + evaluate a string expression, collecting step-by-step trace. */
export function calculate(
  src: string,
  env: Record<string, number> = {},
  angleMode: AngleMode = 'deg',
): ParseResult {
  const tokens = tokenize(src);
  if (tokens.length === 0) throw new Error('Empty expression');
  const ast = new Parser(tokens, angleMode).parse();
  const steps: string[] = [];
  const value = evaluate(ast, env, angleMode, steps);
  return { value, steps };
}

/** Parse only (for the graph plotter, which evaluates per sample). */
export function parseOnly(src: string, angleMode: AngleMode = 'deg'): Node {
  const tokens = tokenize(src);
  if (tokens.length === 0) throw new Error('Empty expression');
  return new Parser(tokens, angleMode).parse();
}

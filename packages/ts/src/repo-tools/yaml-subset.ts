import { isAlias, isScalar, parseDocument, visit } from 'yaml';
import { canonicalize } from '../core/index.js';
import { type ErrorCode, PlinthError } from '../errors.js';

const DATE_LIKE_RE = /^[0-9]{4}-[0-9]{2}-[0-9]{2}/;
const YAML11_WORD_RE =
  /^(y|Y|yes|Yes|YES|n|N|no|No|NO|on|On|ON|off|Off|OFF|true|True|TRUE|false|False|FALSE|null|Null|NULL|~)$/;
const DEC_INT_RE = /^(0|-?[1-9][0-9]*)$/;

function mapDocErrorCode(code: string): ErrorCode {
  if (code === 'DUPLICATE_KEY') {
    return 'PK_RULEPACK_YAML_DUPLICATE_KEY';
  }
  if (code === 'MULTIPLE_DOCS') {
    return 'PK_RULEPACK_YAML_MULTI_DOC';
  }
  return 'PK_RULEPACK_YAML_SYNTAX';
}

export function yamlToValue(text: string, fileName: string): unknown {
  const doc = parseDocument(text, {
    version: '1.2',
    schema: 'core',
    uniqueKeys: true,
    merge: false,
    prettyErrors: false,
  });

  const firstDocError = doc.errors[0];
  if (firstDocError !== undefined) {
    throw new PlinthError(mapDocErrorCode(firstDocError.code), fileName);
  }

  let visitError: ErrorCode | null = null;
  visit(doc, {
    Node(_key, node) {
      const anchor = (node as { anchor?: unknown }).anchor;
      if (isAlias(node) || (typeof anchor === 'string' && anchor.length > 0)) {
        visitError = 'PK_RULEPACK_YAML_ANCHOR';
        return visit.BREAK;
      }
      if (typeof node.tag === 'string') {
        visitError = 'PK_RULEPACK_YAML_TAG';
        return visit.BREAK;
      }
      if (isScalar(node) && node.type === 'PLAIN') {
        const source = node.source ?? '';
        if (typeof node.value === 'string') {
          if (DATE_LIKE_RE.test(source) || YAML11_WORD_RE.test(source)) {
            visitError = 'PK_RULEPACK_YAML_AMBIGUOUS_SCALAR';
            return visit.BREAK;
          }
        } else if (!DEC_INT_RE.test(source) && source !== 'true' && source !== 'false') {
          visitError = 'PK_RULEPACK_YAML_AMBIGUOUS_SCALAR';
          return visit.BREAK;
        }
      }
      return undefined;
    },
  });

  if (visitError !== null) {
    throw new PlinthError(visitError, fileName);
  }

  const value: unknown = doc.toJS();
  canonicalize(value);
  return value;
}

import {patchPracticeSearch, readPracticeSearch, type CodeLanguage, codeTemplates} from './practice';

// Only the catalogue's supported filters can become a return destination.
export function practiceCataloguePath(params: URLSearchParams) {
  const filters = readPracticeSearch(params);
  const query = patchPracticeSearch(new URLSearchParams(), {
    q: filters.search, type: filters.type, difficulty: filters.difficulty, page: filters.page,
  }).toString();
  return '/practice' + (query ? '?' + query : '');
}
export function practiceReturnPath(value: string | null) {
  if (!value || value.length > 2048 || value.split('?')[0] !== '/practice' || value.includes('#')) return '/practice';
  return practiceCataloguePath(new URLSearchParams(value.includes('?') ? value.slice(value.indexOf('?') + 1) : ''));
}
function contextQuery(returnTo: string) {
  const query = new URLSearchParams();
  const safe = practiceReturnPath(returnTo);
  if (safe !== '/practice') query.set('from', safe);
  return query;
}
export function practiceDetailPath(id: string, returnTo: string) {
  const query = contextQuery(returnTo).toString();
  return '/practice/' + encodeURIComponent(id) + (query ? '?' + query : '');
}
export function practiceEditorPath(id: string | null, returnTo: string) {
  const query = contextQuery(returnTo);
  if (id) query.set('problem', id);
  return '/playground' + (query.size ? '?' + query : '');
}

export type CodeExample = 'hello' | 'input';
export const codeExampleNames = {hello: 'رسالة ترحيب', input: 'قراءة الإدخال وجمع عددين'};
const inputTemplates: Record<CodeLanguage, string> = {
  javascript: "const fs = require('node:fs');\nconst [a, b] = fs.readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nconsole.log(a + b);\n",
  python: "import sys\n\na, b = map(int, sys.stdin.read().split())\nprint(a + b)\n",
  java: 'import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner input = new Scanner(System.in);\n        long a = input.nextLong();\n        long b = input.nextLong();\n        System.out.println(a + b);\n    }\n}\n',
  c: '#include <stdio.h>\n\nint main(void) {\n    long long a, b;\n    if (scanf("%lld %lld", &a, &b) != 2) return 1;\n    printf("%lld\\n", a + b);\n    return 0;\n}\n',
  'c++': '#include <iostream>\n\nint main() {\n    long long a, b;\n    if (!(std::cin >> a >> b)) return 1;\n    std::cout << a + b << "\\n";\n    return 0;\n}\n',
};
export function practiceExample(language: CodeLanguage, kind: CodeExample) {
  return kind === 'input'
    ? {code: inputTemplates[language], stdin: '2 3\n', expected: '5'}
    : {code: codeTemplates[language], stdin: '', expected: 'Hello, world!'};
}

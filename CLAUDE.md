# CLAUDE.md

## Overview
AlgoLounge is a static Angular coding practice app: questions and courses ship as JSON; Python runs in the browser via Pyodide. Question completions and course favorites are stored in `localStorage` (no server).

## Quick Commands

```bash
npm install    # once (or when deps change)
npm start      # dev server → http://localhost:4200
npm run build  # production → dist/algolounge/browser
npm run sync-index   # after adding question/course JSON files
```

You can use `npx ng serve` instead of `npm start` if you prefer the Angular CLI directly.

## Project Structure
```
src/app/
├── pages/           # Route components
│   ├── home, questions, courses, course-detail, unit-detail, not-found
├── components/      # Reusable UI
└── services/        # completion, favorites, course/question search, code execution, theme, etc.
```

## Routes
| Path | Component |
|------|-----------|
| `/home` | Home |
| `/questions/:name` | Question IDE |
| `/courses` | Course list |
| `/courses/:filename` | Course detail |
| `/courses/:courseName/:unitKey` | Unit detail |

## Client-side persistence
- **Completions**: `localStorage` key `completed_questions` (array of question filenames)
- **Favorites**: `localStorage` key `favorite_courses` (array of course filenames)

## Tech Stack
**Frontend**: Angular 19.2, PrimeNG 19.1.3, CodeMirror 6, RxJS 7.8, TypeScript 5.7
**Code Execution**: Pyodide v0.28.0 (Python only, runs in Web Worker)

## Code Execution & Judging System

Code runs client-side via Pyodide in a Web Worker with 5-second timeout.

### Judging Flow
1. User's code is executed to define their function
2. `prepare(test_case_input)` extracts args from test input JSON
3. User's function is called: `result = entry_function(*prepared_args)`
4. `verify(actual_output, expected_output, [input])` checks correctness
5. Returns `[passed: bool, output_string: str]`

### Question JSON Format (`public/questions/*.json`)
```json
{
  "filename": "two-sum",
  "title": "Two Sum",
  "difficulty": "Easy",
  "tags": ["Arrays and Hashing"],
  "keywords": ["array", "hash", "map"],
  "description": "<h2>Title</h2><p>Problem description HTML...</p>",
  "entry_function": "twoSum",
  "template": "def twoSum(nums, target):\n  ",
  "solution_code": "def twoSum(nums, target):\n    seen = {}\n    ...",
  "solution_text": "<h3>Explanation HTML...</h3>",
  "prepare": "def prepare(test_case_input):\n    return (test_case_input['nums'], test_case_input['target'])",
  "verify": "def verify(actual_output, expected_output):\n    # Return [passed: bool, output_string: str]\n    return [actual_output == expected_output, str(actual_output)]",
  "test_cases": [
    {"id": 1, "input": {"nums": [2,7,11,15], "target": 9}, "output": [0,1]}
  ]
}
```

### Key Fields
| Field | Description |
|-------|-------------|
| `entry_function` | Function name user must implement |
| `template` | Starter code shown to user |
| `prepare` | Extracts function args from test input dict, returns tuple |
| `verify` | Validates result, returns `[passed, output_string]`. Can take optional 3rd param for input |
| `test_cases` | Array of `{id, input, output}` objects |

## Content Files
- Questions: `public/questions/*.json`
- Courses: `public/courses/*.json`
- Run `npm run sync-index` after adding content

## Adding Questions
1. Check https://github.com/doocs/leetcode/tree/main/solution for Python solutions
2. Create JSON in `public/questions/` following format above
3. Implement `prepare` to unpack test input into function args
4. Implement `verify` for custom validation (order-independent comparisons, etc.)
5. Run `npm run sync-index`

### Boolean Outputs
The worker injects `expected_output` directly into Python as a literal via `JSON.stringify`. JSON booleans (`true`/`false`) are not valid Python — do **not** use them as `output` values in test cases.

Instead, store boolean outputs as strings and normalize in `verify`:

```json
{ "id": 1, "input": { ... }, "output": "true" }
```

```python
def verify(actual_output, expected_output):
    if isinstance(expected_output, str):
        expected_output = expected_output.lower() == 'true'
    passed = bool(actual_output) == bool(expected_output)
    return [passed, 'true' if actual_output else 'false']
```

## Design Guidelines
- 8pt grid spacing (8, 16, 24, 32, 40, 48, 64, 96px)
- Theme vars: `--color-primary`, `--color-accent`, `--color-text-*`
- Font weights: 400, 600, 700 only
- No emojis - use SVG icons
- PrimeNG Aura theme

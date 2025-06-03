# Tailwind AST Scoper

[![npm version](https://img.shields.io/npm/v/tailwind-ast-scoper.svg)](https://www.npmjs.com/package/tailwind-ast-scoper)
[![npm downloads](https://img.shields.io/npm/dm/tailwind-ast-scoper.svg)](https://www.npmjs.com/package/tailwind-ast-scoper)
[![MIT license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

> **AST-based CLI tool for safely scoping and managing multiple Tailwind CSS configs in large-scale React (JSX/TSX) projects.  
> Supports dynamic class detection, zero config integration, and blazing-fast multi-project refactoring.**

---

## 🚀 Why Tailwind AST Scoper?

- **Avoid style conflicts** in monorepos, multi-theme, or white-label projects.
- **Automatically scopes overlapping keys** (e.g. `colors.primary`) across different Tailwind configs.
- **AST-powered:** Refactors all usages in your React code, including `clsx`, `classnames`, template literals, and dynamic expressions.
- **One CLI, zero boilerplate:** Instantly applies scoping across your code and generates Tailwind configs with full safelist and debug support.
- **Compatible with Vite, Next.js, CRA, and pure Tailwind CLI projects.**

---

## ✨ Features

- 🎯 **Automatic scoping for config overlaps:**  
  No more `primary` collisions! Each config gets a unique prefix for conflicting keys.
- ⚡ **AST refactor for JSX/TSX:**  
  All usages updated, including:
  - `className="primary accent"`
  - `className={clsx('primary', isActive && 'accent')}`
  - `className={`primary ${state}`}`
- 🔍 **Glob pattern support:**  
  Scan any files you want (`**/*.jsx`, `**/*.tsx`, etc.)
- 📝 **Multi-format reports:**  
  Get TXT, JSON or HTML reports with all changes and scoped classes.
- 🔄 **Watch mode:**  
  Auto-rebuild on file changes.
- 🧪 **Dry-run support:**  
  Preview all changes without touching your code.
- 🪄 **Super-easy config:**  
  Works out-of-the-box or with custom config directories.
- 📦 **Monorepo/Workspace friendly**

---

## 📦 Installation

```bash
npm install -g tailwind-ast-scoper
```

Or use locally in any project:

```bash
npm install --save-dev tailwind-ast-scoper
```

---

## 🛠️ Usage

### 1. Project Structure Example

```
your-project/
├── tailwind-configs/
│   ├── panel.config.js
│   ├── dashboard.config.js
│   └── prefix-map.json
└── src/
    ├── pages/
    │   ├── panel/
    │   │   └── index.jsx
    │   └── dashboard/
    │       └── index.jsx
    └── styles/
        └── _scoped-debug.jsx   # (auto-generated)
```

#### Example `prefix-map.json`
```json
{
  "panel": "panel",
  "dashboard": "dashboard"
}
```

### 2. Run The CLI

**Standard usage (from your project root):**
```bash
tailwind-scope
```

**Custom config and pages directory:**
```bash
tailwind-scope --configDir=tailwind-configs --pagesDir=src/pages
```

**Full power usage:**
```bash
tailwind-scope \
  --configDir=tailwind-configs \
  --pagesDir=src/pages \
  --pattern="**/index.{jsx,tsx}" \
  --report html \
  --verbose
```

**Watch mode:**
```bash
tailwind-scope --watch
```

**Dry run (preview changes):**
```bash
tailwind-scope --dry-run --verbose
```

---

## ⚙️ CLI Options

| Option           | Description                                                          | Default                    |
|------------------|----------------------------------------------------------------------|----------------------------|
| `--configDir`    | Tailwind config directory                                            | `tailwind-configs`         |
| `--pagesDir`     | Source pages directory                                               | `src/pages`                |
| `--pattern`      | Glob pattern for files to scan                                       | `**/index.{jsx,tsx}`       |
| `--verbose`      | Enable verbose logging                                               | `false`                    |
| `--dry-run`      | Preview changes without writing files                                | `false`                    |
| `--watch`        | Watch files and auto-rebuild on changes                              | `false`                    |
| `--report`       | Report format: `txt`, `json`, `html`                                 | `txt`                      |

---

## 🧩 How It Works

1. **Merge all Tailwind configs** from your `configDir`.
2. **Detect overlapping keys** (e.g. both `panel` and `dashboard` have `primary` in colors).
3. **Prefix conflicting keys** (`panel-primary`, `dashboard-primary`) and update configs.
4. **Scan all JSX/TSX files** in your `pagesDir` (using the glob pattern).
5. **Refactor all class usages** (string, template, clsx/classnames, etc.) to use the correct scoped class.
6. **Generate a debug file** (to prevent Tailwind from purging important classes).
7. **Write a detailed report** of all changes.

---

## 🧪 Example

#### Before (`src/pages/panel/index.jsx`)
```jsx
export default function Panel() {
  return <div className="primary accent">Panel Page</div>;
}
```

#### After running `tailwind-scope`
```jsx
export default function Panel() {
  return <div className="panel-primary panel-accent">Panel Page</div>;
}
```

#### Generated `_scoped-debug.jsx`
```jsx
export default () => (<div className="panel-primary dashboard-primary panel-accent dashboard-accent" />);
```

---

## 📝 Output

- **Scoped JSX/TSX files:** All class usages replaced with correct scoped version.
- **`_scoped-debug.jsx`:** Ensures Tailwind includes all scoped classes.
- **Report:** Full list of scoped classes and changed files in TXT, JSON, or HTML.

---

## 🏗️ Example Config (`panel.config.js`)

```js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: '#42b883',
        accent: '#35495e'
      }
    }
  },
  plugins: []
};
```

---

## 💡 Tips

- Use with [clsx](https://github.com/lukeed/clsx) or [classnames](https://github.com/JedWatson/classnames) for dynamic className support.
- Easily add/remove configs in `tailwind-configs`—the tool takes care of the rest!
- Use in CI for guaranteed style safety across all workspaces.

---

## 🧑‍💻 Contributing

Pull requests are welcome!  
Feel free to open issues or suggest features.

---

## 📃 License

MIT

---

## 📬 Author

**[Matin Senior](https://github.com/Matin-senior)**

---
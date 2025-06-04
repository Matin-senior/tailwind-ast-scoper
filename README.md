# Tailwind AST Scoper

[![npm version](https://img.shields.io/npm/v/tailwind-ast-scoper.svg)](https://www.npmjs.com/package/tailwind-ast-scoper)
[![npm downloads](https://img.shields.io/npm/dm/tailwind-ast-scoper.svg)](https://www.npmjs.com/package/tailwind-ast-scoper)
[![MIT license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

> **AST-powered CLI for _bulletproof_ Tailwind CSS multi-config and scoping in React projects.<br>
> Handles v3/v4 migration quirks, purging issues, class conflicts, and more—_so you don’t have to_.**

---

## 🚨 Why use Tailwind AST Scoper?

- **Struggling with Tailwind v4/v3.4 upgrades or config conflicts?**
- **Do you see weird purging or missing styles after a big refactor?**
- **Ever had a multi-theme/white-label project where Tailwind keys collide and break everything?**

> **Tailwind AST Scoper** is a zero-boilerplate CLI to _automatically_ scope, refactor, and debug all your Tailwind class usage.  
> Works on large monorepos, modern React, custom configs, and fully supports v3+v4 differences.

---

## 💥 Real-world Problems Solved

- **Tailwind v4 vs v3 "gotchas":**
  - v4 introduces new base styles (`preflight`), changes purge/content, and _may override your intended look_.
  - v3/v4 purge can remove "scoped"/dynamic classes unless you hack safelists or make debug files.
  - _Default styles change_: e.g., background/body color, line-heights, border-radius, and more.

- **Error-prone manual migration:**  
  Manual refactoring is slow, error-prone, and almost impossible to maintain for large codebases.

- **Class Conflicts:**  
  You _will_ get broken colors like `.primary`, `.accent` between configs, unless you scope everything.

- **No automatic rollback:**  
  After running the scoper, your files are transformed. _There's no one-click undo._  
  **Always use version control (`git`) or make a backup before running.**

---

## ✅ What This Tool Actually Does

- **AST-based JSX/TSX refactor:**  
  - Finds all usages of Tailwind classes _anywhere_ (strings, template literals, `clsx`, `classnames`, etc).
  - Scopes/renames overlapping keys (e.g., `primary` → `login-primary`, `panel-primary`, etc).
- **Auto-generates all needed CSS:**  
  - Handles _purge issues_ by creating a `_scoped-debug.jsx` and `_scoped-virtual.css` so no class ever gets dropped.
  - Virtual CSS covers all used classes—even those not present in Tailwind's default output.
- **Merges configs and safelists:**  
  - Produces one final, unified `tailwind.config.js` with all safelists and plugins merged.
- **Multi-format reports:**  
  - TXT, JSON, HTML with detailed info on every class and file affected.

---

## 🏆 What’s New & Unique

- **Full Tailwind v3.4 & v4 support out-of-the-box.**
- **Handles Tailwind’s base style changes** (e.g., body background, line-height).
- **No more style loss:**  
  Even if Tailwind's purge/content misses a class, it _stays_ via generated virtual CSS.
- **No more duplicate or conflicting rules:**  
  The generator deduplicates everything for you.
- **No magic rollback:**  
  Once you run the CLI, your files are changed. _Rollback means using git!_

---

## 🛠️ Installation

```bash
npm install -g tailwind-ast-scoper
# or
npm install --save-dev tailwind-ast-scoper
```

---

## 🎬 Quick Start

### 1. Project Structure Example

```
your-project/
├── tailwind-configs/
│   ├── login.config.js
│   ├── home.config.js
│   └── prefix-map.json
└── src/
    ├── pages/
    │   ├── login/
    │   │   └── index.jsx
    │   └── home/
    │       └── index.jsx
    └── styles/
        └── _scoped-debug.jsx
        └── _scoped-virtual.css
```

#### Example `prefix-map.json`
```json
{
  "login": "login",
  "home": "home"
}
```

---

### 2. Run The CLI

```bash
tailwind-scope
```
Or with custom dirs:
```bash
tailwind-scope --configDir=tailwind-configs --pagesDir=src/pages
```

---

## ⚠️ Known Issues & Migration Notes

- **Tailwind v4 base styles may override your look!**
    - If you see background/body color or radius/line-height changes, it’s from Tailwind’s new defaults.
    - _Fix_: Add your own base styles at the end of your main CSS, e.g.:
      ```css
      body { background: #fff; }
      ```
- **Duplicate/Unwanted rules** in `_scoped-virtual.css` can happen if you use the same utility in multiple places.  
  - _The generator now dedupes, but always check your output for cleanliness!_
- **No Undo:**  
  - This tool rewrites your files in-place.
  - **If you want to roll back, use git. There is no built-in revert.**
- **Tailwind purge/content quirks:**  
  - Not all versions of Tailwind detect all dynamic classes, especially in v4.
  - _You must use the generated `_scoped-debug.jsx` and `_scoped-virtual.css` files and import them **after** tailwind utilities_:
      ```css
      @tailwind base;
      @tailwind components;
      @tailwind utilities;
      @import './styles/_scoped-virtual.css'; /* Always last! */
      ```
- **After running, you may need to manually fix edge-case style conflicts** (rare, but possible in custom setups).

---

## 🧪 Example

#### Before (`src/pages/login/index.jsx`)
```jsx
export default function Login() {
  return <div className="primary">Login Page</div>;
}
```

#### After running `tailwind-scope`
```jsx
export default function Login() {
  return <div className="login-primary">Login Page</div>;
}
```

#### Generated `_scoped-debug.jsx`
```jsx
export default () => (<div className="login-primary home-primary" />);
```

#### Generated `_scoped-virtual.css`
```css
.login-primary { background-color: #3b82f6; }
.home-primary { background-color: #ef4444; }
/* ... */
```

---

## 📝 Output

- **All JSX/TSX files updated:**  
  Scoped class usage everywhere.
- **Debug and virtual CSS files:**  
  Always imported last to cover purge/content holes.
- **Report:**  
  TXT, JSON, HTML with every change and class listed.

---

## 🏗️ Example Config (`login.config.js`)

```js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: '#3b82f6'
      }
    }
  },
  plugins: []
};
```

---

## 💡 Tips & Best Practices

- **Always commit before running the tool!**  
  No built-in undo.
- **Check your final CSS for any duplicate or missing rules.**
- **For Tailwind v4:**  
  Review your site's look after, especially backgrounds, font, borders, and radius.
- **If something looks wrong:**  
  Manually add/override base styles or fix edge cases in your configs.

---

## 🧑‍💻 Contributing

Pull requests, issues and suggestions are welcome!

---

## 📃 License

MIT

---

## 📬 Author

**[Matin Sanei](https://github.com/Matin-senior)**
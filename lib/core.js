const fs = require('fs');
const path = require('path');
const merge = require('lodash.merge');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default;
const chokidar = require('chokidar');
const glob = require('glob');

function resolvePath(base, rel) {
  return path.isAbsolute(rel) ? rel : path.resolve(process.cwd(), rel);
}

// Utilities for reporting
function writeReport(reportPath, changedFiles, scopedClasses, type = "txt") {
  if (type === "json") {
    fs.writeFileSync(reportPath.replace(/\.txt$/, ".json"), JSON.stringify({
      changedFiles: Array.from(changedFiles),
      scopedClasses: Array.from(scopedClasses)
    }, null, 2));
  } else if (type === "html") {
    fs.writeFileSync(reportPath.replace(/\.txt$/, ".html"),
      `<html><body><h2>Tailwind AST Scoper Report</h2>
      <h3>Changed Files</h3>
      <ul>${Array.from(changedFiles).map(f => `<li>${f}</li>`).join('')}</ul>
      <h3>Scoped Classes</h3>
      <ul>${Array.from(scopedClasses).map(c => `<li>${c}</li>`).join('')}</ul>
      </body></html>`);
  } else {
    fs.writeFileSync(reportPath,
      `🔧 Tailwind AST Scoper Report\n\nChanged files:\n${[...changedFiles].join('\n')}\n\nScoped classes:\n${[...scopedClasses].join('\n')}\n`);
  }
}

// Main logic
function build(options = {}) {
  const {
    configDir = 'tailwind-configs',
    pagesDir = 'src/pages',
    pattern = '**/index.{jsx,tsx}',
    verbose = false,
    dryRun = false,
    report = 'txt'
  } = options;

  const CONFIG_DIR = resolvePath('', configDir);
  const PAGES_DIR = resolvePath('', pagesDir);
  const PREFIX_MAP_PATH = path.resolve(CONFIG_DIR, 'prefix-map.json');
  const SCOPED_DEBUG_PATH = path.resolve(PAGES_DIR, '../styles/_scoped-debug.jsx');
  const REPORT_PATH = path.resolve(process.cwd(), 'scoping-report.txt');

  let virtualClassSet = new Set();
  const scopedKeys = {};
  const usageMap = {};
  const configMap = {};
  let allPlugins = [];
  const safelistSet = new Set();
  const changedFiles = new Set();
  const scopedClasses = new Set();

  function log(...args) { if (verbose) console.log(...args); }

  function loadConfigs() {
    let configFiles = [];
    try {
      configFiles = fs.readdirSync(CONFIG_DIR).filter((f) => f.endsWith('.config.js'));
    } catch (err) {
      console.error('❌ Failed to read config directory:', err.message);
      process.exit(1);
    }

    for (const file of configFiles) {
      const prefix = file.replace('.config.js', '');
      const configFilePath = path.join(CONFIG_DIR, file);
      try {
        const config = require(configFilePath);
        configMap[prefix] = config;
        if (Array.isArray(config.plugins)) allPlugins.push(...config.plugins);

        const theme = config.theme?.extend || {};
        for (const [section, values] of Object.entries(theme)) {
          for (const key of Object.keys(values)) {
            const composite = `${section}:${key}`;
            if (!usageMap[composite]) usageMap[composite] = [];
            usageMap[composite].push(prefix);
          }
        }
      } catch (err) {
        console.error(`❌ Error loading ${configFilePath}:`, err.message);
      }
    }

    for (const [key, usedBy] of Object.entries(usageMap)) {
      if (usedBy.length > 1) {
        const [section, field] = key.split(':');
        for (const prefix of usedBy) {
          const value = configMap[prefix]?.theme?.extend?.[section]?.[field];
          if (!value) continue;

          const scopedField = `${prefix}-${field}`;
          configMap[prefix].theme.extend[section][scopedField] = value;
          delete configMap[prefix].theme.extend[section][field];

          scopedKeys[prefix] ??= {};
          scopedKeys[prefix][section] ??= {};
          scopedKeys[prefix][section][field] = scopedField;
          safelistSet.add(`${section === 'colors' ? 'text' : section}-${scopedField}`);
          scopedClasses.add(scopedField);
        }
      }
    }
  }

  function applyScoping(cls, scoped) {
    for (const [section, fields] of Object.entries(scoped)) {
      for (const [original, replacement] of Object.entries(fields)) {
        if (cls === original) return replacement;
        if (cls.startsWith(`${original}-`)) return `${replacement}${cls.slice(original.length)}`;
        const utilityMatch = cls.match(/^([a-z]+-)?(.+)$/);
        if (utilityMatch) {
          const prefix = utilityMatch[1] || '';
          const base = utilityMatch[2];
          if (base === original) return `${prefix}${replacement}`;
        }
      }
    }
    return cls;
  }

  function processJSXFile(filePath, prefix, scoped) {
    if (!fs.existsSync(filePath) || !scoped) return;
    try {
      const code = fs.readFileSync(filePath, 'utf-8');
      const ast = parser.parse(code, { sourceType: 'module', plugins: ['jsx', 'typescript'] });

      traverse(ast, {
        JSXAttribute(path) {
          if (path.node.name.name !== 'className') return;
          const value = path.node.value;

          const applyToString = (str) => {
            const classList = str.split(/\s+/).map((cls) => applyScoping(cls, scoped));
            classList.forEach((c) => virtualClassSet.add(c));
            classList.forEach((c) => scopedClasses.add(c));
            return classList.join(' ');
          };

          if (value.type === 'StringLiteral') {
            value.value = applyToString(value.value);
          } else if (value.type === 'JSXExpressionContainer') {
            const exp = value.expression;

            if (exp.type === 'TemplateLiteral') {
              for (const quasis of exp.quasis) {
                const newString = applyToString(quasis.value.raw);
                quasis.value.raw = quasis.value.cooked = newString;
              }
            }

            if (exp.type === 'ConditionalExpression') {
              ['consequent', 'alternate'].forEach(part => {
                const segment = exp[part];
                if (segment.type === 'StringLiteral') {
                  segment.value = applyToString(segment.value);
                }
              });
            }

            if (exp.type === 'CallExpression' && ['clsx', 'classnames'].includes(exp.callee.name)) {
              for (const arg of exp.arguments) {
                if (arg.type === 'StringLiteral') arg.value = applyToString(arg.value);
                if (arg.type === 'ObjectExpression') {
                  for (const prop of arg.properties) {
                    if (prop.key && prop.key.type === 'StringLiteral') prop.key.value = applyToString(prop.key.value);
                    if (prop.key && prop.key.type === 'Identifier') prop.key.name = applyToString(prop.key.name);
                  }
                }
              }
            }
          }
        },
      });

      const output = generate(ast, {}, code);
      changedFiles.add(filePath);
      if (!dryRun) {
        fs.writeFileSync(filePath, output.code, 'utf-8');
      } else {
        log(`[dry-run] Would update: ${filePath}`);
      }
    } catch (err) {
      console.error(`❌ AST update failed for ${filePath}:`, err.message);
    }
  }

  // Start build
  virtualClassSet.clear();
  changedFiles.clear();
  scopedClasses.clear();
  loadConfigs();

  let prefixMap = {};
  try {
    if (fs.existsSync(PREFIX_MAP_PATH)) {
      prefixMap = JSON.parse(fs.readFileSync(PREFIX_MAP_PATH, 'utf-8'));
    }
  } catch (err) {
    console.error('❌ Failed to load prefix map:', err.message);
  }

  // Glob all matching files
  const files = glob.sync(pattern, { cwd: PAGES_DIR, absolute: true });
  for (const file of files) {
    // find parent folder name as pageName
    const pageName = path.basename(path.dirname(file));
    const prefix = prefixMap[pageName];
    if (!prefix) continue;
    const scoped = scopedKeys[prefix];
    processJSXFile(file, prefix, scoped);
  }

  const virtualContent = `export default () => (<div className="${[...virtualClassSet].join(' ')}" />);\n`;
  if (!dryRun) {
    fs.writeFileSync(SCOPED_DEBUG_PATH, virtualContent, 'utf-8');
  } else {
    log(`[dry-run] Would write virtual debug file: ${SCOPED_DEBUG_PATH}`);
  }

  const baseConfig = {
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}', SCOPED_DEBUG_PATH],
    darkMode: 'class',
    plugins: [...new Set(allPlugins)],
    safelist: [...safelistSet],
  };

  const finalConfig = merge(baseConfig, ...Object.values(configMap));

  writeReport(REPORT_PATH, changedFiles, scopedClasses, report);

  console.log('✅ Tailwind config built with scoped support.');
  if (dryRun) {
    console.log('[dry-run] No files were actually changed.');
  }

  // Only export config if used as module
  return finalConfig;
}

function watch(options = {}) {
  const { pagesDir = 'src/pages', pattern = '**/index.{jsx,tsx}', verbose = false } = options;
  const PAGES_DIR = resolvePath('', pagesDir);

  // Watch with glob
  console.log('👀 Watching for changes...');
  chokidar.watch(path.join(PAGES_DIR, pattern.replace(/\/\*\*\/.+/, '')), { ignoreInitial: true })
    .on('all', (event, filePath) => {
      if (filePath.match(/\.(jsx|tsx)$/)) {
        if (verbose) console.log(`🔁 Change detected: ${filePath}`);
        build(options);
      }
    });
}

module.exports = { build, watch };
const fs = require('fs');
const path = require('path');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  if (!content.includes('alert(') && !content.includes('window.confirm(')) return;
  if (content.includes('useUI()')) return; // Already processed
  
  const isComponentDir = filePath.includes('components');
  const importPath = isComponentDir ? (filePath.includes('admin') ? '../../contexts/UIContext' : '../contexts/UIContext') : '../contexts/UIContext';
  
  // Add import
  const importRegex = /(import React[^\n]*\n)/;
  content = content.replace(importRegex, `$1import { useUI } from '${importPath}';\n`);
  
  // Try to find the component declaration to inject the hook
  // function Component() { or const Component = () => {
  const compRegex = /(export default function [^\(]+\([^\)]*\)\s*\{|export function [^\(]+\([^\)]*\)\s*\{|const [A-Z][a-zA-Z0-9_]*\s*=\s*(?:async\s*)?\([^)]*\)\s*=>\s*\{)/;
  
  if (compRegex.test(content)) {
    content = content.replace(compRegex, `$1\n  const { toast, confirm } = useUI();\n`);
  }

  // Replace alerts
  // Note: this is a simple replacement. `toast` works nicely for alerts.
  content = content.replace(/alert\(([^)]+)\)/g, (match, p1) => {
    let type = "'info'";
    if (p1.toLowerCase().includes('erro')) type = "'error'";
    if (p1.toLowerCase().includes('sucesso')) type = "'success'";
    return `toast(${p1}, ${type})`;
  });

  // Replace confirms
  content = content.replace(/window\.confirm\(([^)]+)\)/g, "await confirm($1)");

  fs.writeFileSync(filePath, content);
  console.log('Processed:', filePath);
}

function traverse(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const fullPath = path.join(dir, f);
    if (fs.statSync(fullPath).isDirectory()) {
      traverse(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      processFile(fullPath);
    }
  }
}

traverse(path.join(__dirname, '../src'));

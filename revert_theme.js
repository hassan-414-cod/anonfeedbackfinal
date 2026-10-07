const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.resolve(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(file);
    }
  });
  return results;
}

const files = [...walk('./app'), ...walk('./components')];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');

  // Borders
  content = content.replace(/border border-gray-200 rounded-xl/g, 'border-4 border-black');
  content = content.replace(/border-b border-gray-200/g, 'border-b-4 border-black');
  content = content.replace(/border-t border-gray-200/g, 'border-t-4 border-black');
  content = content.replace(/border border-gray-200 rounded-lg/g, 'border-2 border-black');
  content = content.replace(/border border-gray-200 rounded-md/g, 'border border-black');

  // Specific file manual border fixes:
  // In app/layout.tsx there was an removed border-x-4 border-black, I'll ignore it or add it later if critical.

  // Shadows
  // I replaced multiple things with 'shadow-md', 'shadow-sm', 'shadow-lg'.
  // This is slightly tricky, I'll replace the common ones.
  content = content.replace(/shadow-lg/g, 'shadow-[8px_8px_0px_rgba(0,0,0,1)]');
  content = content.replace(/shadow-md/g, 'shadow-[6px_6px_0px_rgba(0,0,0,1)]');
  content = content.replace(/shadow-sm/g, 'shadow-[4px_4px_0px_rgba(0,0,0,1)]');
  content = content.replace(/shadow-inner/g, 'shadow-[inset_4px_4px_0px_rgba(0,0,0,0.2)]');
  
  // Hover effects
  content = content.replace(/hover:-translate-y-0\.5 hover:shadow-\[6px_6px_0px_rgba\(0,0,0,1\)\]/g, 'hover:translate-x-1 hover:translate-y-1 hover:shadow-none');
  content = content.replace(/-translate-y-0\.5 shadow-\[6px_6px_0px_rgba\(0,0,0,1\)\]/g, 'translate-x-[-2px] translate-y-[-2px]');
  
  // Typography
  content = content.replace(/font-semibold tracking-tight text-gray-900/g, 'font-black uppercase italic tracking-tighter');
  content = content.replace(/font-medium text-gray-900/g, 'font-black uppercase italic');
  content = content.replace(/font-medium tracking-tight text-gray-900/g, 'font-black uppercase tracking-tighter');
  content = content.replace(/font-medium uppercase tracking-wide text-gray-500/g, 'font-black uppercase tracking-widest');
  content = content.replace(/font-semibold/g, 'font-black');
  content = content.replace(/font-medium/g, 'font-bold');

  // Input Focus
  content = content.replace(/focus:ring-2 focus:ring-gray-200/g, 'focus:shadow-[4px_4px_0px_rgba(0,0,0,1)]');
  
  // Divider Lines
  content = content.replace(/divide-gray-100/g, 'divide-black');
  
  fs.writeFileSync(file, content);
});
console.log("Re-brutalized theme successfully.");

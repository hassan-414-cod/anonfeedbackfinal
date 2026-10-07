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
  content = content.replace(/border-4 border-black/g, 'border border-gray-200 rounded-xl');
  content = content.replace(/border-x-4 border-black/g, '');
  content = content.replace(/border-b-4 border-black/g, 'border-b border-gray-200');
  content = content.replace(/border-t-4 border-black/g, 'border-t border-gray-200');
  content = content.replace(/border-2 border-black/g, 'border border-gray-200 rounded-lg');
  content = content.replace(/border border-black/g, 'border border-gray-200 rounded-md');

  // Shadows
  content = content.replace(/shadow-\[8px_8px_0px_rgba\(0,0,0,1\)\]/g, 'shadow-lg');
  content = content.replace(/shadow-\[6px_6px_0px_rgba\(0,0,0,1\)\]/g, 'shadow-md');
  content = content.replace(/shadow-\[4px_4px_0px_rgba\(0,0,0,1\)\]/g, 'shadow-sm');
  content = content.replace(/shadow-\[2px_2px_0px_rgba\(0,0,0,1\)\]/g, 'shadow-sm');
  content = content.replace(/shadow-\[4px_4px_0px_rgba\(0,0,0,0\.3\)\]/g, 'shadow-sm');
  content = content.replace(/shadow-\[4px_4px_0px_rgba\(255,255,255,0\.5\)\]/g, 'shadow-sm');
  content = content.replace(/shadow-\[4px_4px_0px_rgba\(255,255,255,1\)\]/g, 'shadow-sm');
  content = content.replace(/shadow-\[inset_4px_4px_0px_rgba\(0,0,0,0\.2\)\]/g, 'shadow-inner');
  content = content.replace(/shadow-\[6px_6px_0px_rgba\(0,0,0,0\.2\)\]/g, 'shadow-md');
  content = content.replace(/shadow-\[0px_0px_0px_rgba\(0,0,0,1\)\]/g, 'shadow-md');
  
  // Hover effects
  content = content.replace(/hover:translate-x-1 hover:translate-y-1 hover:shadow-none/g, 'hover:-translate-y-0.5 hover:shadow-md');
  content = content.replace(/hover:translate-x-0\.5 hover:translate-y-0\.5 hover:shadow-none/g, 'hover:-translate-y-0.5 hover:shadow-md');
  content = content.replace(/translate-x-\[-2px\] translate-y-\[-2px\]/g, '-translate-y-0.5 shadow-md');
  
  // Typography
  content = content.replace(/font-black uppercase italic tracking-tighter/g, 'font-semibold tracking-tight text-gray-900');
  content = content.replace(/font-black italic tracking-tighter uppercase/g, 'font-semibold tracking-tight text-gray-900');
  content = content.replace(/font-black uppercase italic/g, 'font-medium text-gray-900');
  content = content.replace(/font-black uppercase tracking-tighter/g, 'font-medium tracking-tight text-gray-900');
  content = content.replace(/font-black uppercase tracking-widest/g, 'font-medium uppercase tracking-wide text-gray-500');
  content = content.replace(/font-black uppercase/g, 'font-medium text-gray-900');
  content = content.replace(/font-black/g, 'font-semibold');

  // Input Focus
  content = content.replace(/focus:shadow-\[4px_4px_0px_rgba\(0,0,0,1\)\]/g, 'focus:ring-2 focus:ring-gray-200');
  
  // Divider Lines
  content = content.replace(/divide-black/g, 'divide-gray-100');

  fs.writeFileSync(file, content);
});
console.log("De-brutalized theme successfully.");

const fs = require('fs');
const path = require('path');

function replaceAliases(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      replaceAliases(fullPath);
    } else if (fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Calculate depth from server/src
      const relativeToSrc = path.relative(path.join(__dirname, 'server', 'src'), path.dirname(fullPath));
      const depth = relativeToSrc === '' ? 0 : relativeToSrc.split(path.sep).length;
      
      const replacementPrefix = depth === 0 ? './' : '../'.repeat(depth);
      
      let modified = false;
      
      // Replace from '@/' to relative prefix
      const regex = /from\s+['"]@\/(.*?)['"]/g;
      content = content.replace(regex, (match, p1) => {
        modified = true;
        return `from '${replacementPrefix}${p1}'`;
      });
      
      const importRegex = /import\s+['"]@\/(.*?)['"]/g;
      content = content.replace(importRegex, (match, p1) => {
        modified = true;
        return `import '${replacementPrefix}${p1}'`;
      });

      if (modified) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

replaceAliases(path.join(__dirname, 'server', 'src'));
console.log('Done replacing aliases.');

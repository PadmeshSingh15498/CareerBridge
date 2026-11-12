const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '..', 'node_modules', 'next', 'dist', 'lib', 'recursive-delete.js');

if (!fs.existsSync(targetFile)) {
  process.exit(0);
}

let content = fs.readFileSync(targetFile, 'utf8');
let modified = false;

// Fix 1: Post-increment t++ causing infinite retry loop in recursive delete
if (content.includes('unlinkPath(p, isDir, t++)')) {
  content = content.replace('unlinkPath(p, isDir, t++)', 'unlinkPath(p, isDir, t + 1)');
  modified = true;
}

// Fix 2: Windows OneDrive reparse point EINVAL on readlink and OS file lock handling
if (!content.includes('code === "EPERM" || code === "EBUSY" || code === "ENOTEMPTY"')) {
  content = content.replace(
    'if (code === "ENOENT") {',
    'if (code === "ENOENT" || code === "EPERM" || code === "EBUSY" || code === "ENOTEMPTY") {'
  );
  modified = true;
}

if (!content.includes('try { const linkPath = await _fs.promises.readlink(absolutePath);')) {
  const originalReadlink = `        if (isSymlink) {
            const linkPath = await _fs.promises.readlink(absolutePath);
            try {
                const stats = await _fs.promises.stat((0, _path.isAbsolute)(linkPath) ? linkPath : (0, _path.join)((0, _path.dirname)(absolutePath), linkPath));
                isDirectory = stats.isDirectory();
            } catch  {}
        }`;
  
  const safeReadlink = `        if (isSymlink) {
            try {
                const linkPath = await _fs.promises.readlink(absolutePath);
                try {
                    const stats = await _fs.promises.stat((0, _path.isAbsolute)(linkPath) ? linkPath : (0, _path.join)((0, _path.dirname)(absolutePath), linkPath));
                    isDirectory = stats.isDirectory();
                } catch {}
            } catch {
                isSymlink = false;
            }
        }`;

  if (content.includes(originalReadlink)) {
    content = content.replace(originalReadlink, safeReadlink);
    modified = true;
  }
}

if (modified) {
  fs.writeFileSync(targetFile, content, 'utf8');
  console.log('[CareerBridge] Successfully patched Next.js recursive-delete for Windows OneDrive compatibility.');
}


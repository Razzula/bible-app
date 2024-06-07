import { promises as fs } from 'fs';
import { join } from 'path';

const copyDir = async (src: string, dest: string) => {
    await fs.mkdir(dest, { recursive: true });
    const entries = await fs.readdir(src, { withFileTypes: true });

    for (let entry of entries) {
        const srcPath = join(src, entry.name);
        const destPath = join(dest, entry.name);

        if (entry.isDirectory()) {
            await copyDir(srcPath, destPath);
        } else {
            await fs.copyFile(srcPath, destPath);
        }
    }
};

const srcDir = join('node_modules', 'tinymce');
const destDir = join('dist', 'tinymce');

copyDir(srcDir, destDir)
    .then(() => console.log('Copied tinymce to dist directory'))
    .catch((err) => console.error('Error copying tinymce:', err));

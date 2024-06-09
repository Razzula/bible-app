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

const copyDirectories = async () => {
    const tinymceSrc = join('node_modules', 'tinymce');
    const tinymceDest = join('dist', 'tinymce');

    const exampleSrc = join('..', 'example');
    const exampleDest = join('dist', 'example');

    await Promise.all([
        copyDir(tinymceSrc, tinymceDest),
        copyDir(exampleSrc, exampleDest)
    ]);

    console.log('Copied tinymce and example directories to dist');
};

copyDirectories()
    .then(() => console.log('Predeploy step completed'))
    .catch((err) => console.error('Error in predeploy step:', err));

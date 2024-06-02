import { Editor, Plugin } from 'tinymce';

const BibleReferencePlugin = (editor: Editor) => {
    // Plugin logic goes here
    editor.on('init', () => {
        console.log('Autolink plugin initialized');
    });

    // Example: automatically convert URLs to links
    editor.on('keyup', (e) => {
        if (e.key === ' ') {
            const content = editor.getContent();
            const updatedContent = content.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1">$1</a>');
            editor.setContent(updatedContent);
        }
    });
};

export default BibleReferencePlugin;

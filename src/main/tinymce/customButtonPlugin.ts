import { Editor } from 'tinymce';

const customButtonPlugin = (editor: Editor) => {
    editor.ui.registry.addButton('customButton', {
        text: 'Edit',
        onAction: () => {
            console.log('Custom Button Clicked!');
        }
    });
};

export default customButtonPlugin;

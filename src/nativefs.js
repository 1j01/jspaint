if ('chooseFileSystemEntries' in window) {
    const acceptedFormats = [{
        description: 'PNG',
        extensions: ['png'],
        mediaTypes: ['image/png']
    }, {
        description: 'JPEG',
        extensions: ['jpg', 'jpeg', 'jpe', 'jfif'],
        mediaTypes: ['image/jpeg']
    }, {
        description: 'WebP',
        extensions: ['webp'],
        mediaTypes: ['image/webp']
    }];

    async function resolveMimeType(fileName) {
        const extension = fileName.split('.').pop();
        const format = acceptedFormats.find(format => format.extensions.includes(extension.toLowerCase()));
        return format && format.mediaTypes[0] || 'image/png';
    }

    async function saveViaNativeFs(handle, canvas) {
        const writer = await handle.createWriter();

        const mimeType = resolveMimeType(handle.name);
        const blob = await new Promise(resolve => canvas.toBlob(resolve, mimeType));
        const buffer = await blob.arrayBuffer();

        await writer.truncate(0);
        await writer.write(0, buffer);
        await writer.close();
    }

    window.save_to_file_path = async (handle, format, callback) => {
        await saveViaNativeFs(handle, canvas);
        callback(handle, handle.name);
    };

    window.systemOpenFile = async callback => {
        const handle = await window.chooseFileSystemEntries({
            accepts: acceptedFormats
        });
        const file = await handle.getFile();

        // Caller stores the handle in document_file_path for saving the file later on
        Object.defineProperty(file, 'path', { value: handle });

        callback(file);
    };

    window.systemSaveCanvasAs = async (canvas, fileName, savedCallbackUnreliable) => {
        // TODO: NativeFS currently doesn’t allow suggesting file names.
        const handle = await window.chooseFileSystemEntries({
            type: 'saveFile',
            accepts: acceptedFormats
        });
        await saveViaNativeFs(handle, canvas);

        savedCallbackUnreliable(handle, handle.name);
    };
}

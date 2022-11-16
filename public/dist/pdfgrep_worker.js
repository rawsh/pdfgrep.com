importScripts('pdfgrep_pipeline.js');

self.pipeline = null

onmessage = async ({ data: { files, query, pdfgrep_wasm, pdfgrep_js } }) => {
    if (pdfgrep_wasm && pdfgrep_js) {
        try {
            self.pipeline = new PDFPipeline(pdfgrep_wasm, pdfgrep_js, msg=>postMessage({print: msg}), _ => postMessage({ print: "Initialized" }), PDFPipeline.ScriptLoaderWorker);
        } catch (err) {
            postMessage({exception: 'Exception during initialization: ' + err.toString() + '\nStack:\n' + err.stack});
        }
    }
    else if (files && self.pipeline) {
        // upload files
        try {
            const file_length = await self.pipeline.upload(files);
            // const file_length = await self.pipeline.getFileCount();
            postMessage({ fileCount: file_length });
        } catch (err) {
            postMessage({ exception: 'Exception during upload: ' + err.toString() + '\nStack:\n' + err.stack });
        }
    }
    else if (query && self.pipeline) {
        try
        {
            postMessage(await self.pipeline.search(query));
        }
        catch(err)
        {
            postMessage({exception: 'Exception during compilation: ' + err.toString() + '\nStack:\n' + err.stack});
        }
    }
}
export default function Head() {
    return (
        <>
            <title>pdfgrep</title>
            <meta name="description" content="pdf search powered by pdfgrep compiled to webassembly" />
            <link rel="icon" href="/favicon.ico" />
            <meta name="viewport" content="width=device-width" />

            {/* Preload scripts */}
            <link rel="pdfgrep" type="text/javascript" id="pdfgrep_worker_js" href="/dist/pdfgrep_worker.js" /> 
            <link rel="pdfgrep" type="text/javascript" id="pdfgrep_pipeline_js" href="/dist/pdfgrep_pipeline.js" />
            <link rel="pdfgrep" type="text/javascript" id="pdfgrep_js" href="/dist/pdfgrep.js" />
            <link rel="pdfgrep" type="application/wasm" id="pdfgrep_wasm" href="/dist/pdfgrep.wasm" />
        </>
    )
}
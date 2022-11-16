class PDFPipeline
{
    static preRun = [];
    static calledRun = false;

    static ScriptLoaderWorker(src)
    {
        return Promise.resolve(self.importScripts(src));
    }

    constructor(pdfgrep_wasm, pdfgrep_js, print, on_initialized, script_loader) {
        this.print = print;
        this.script_loader = script_loader;
        this.mem_header_size = 2 ** 26;
        this.wasm_module_promise = fetch(pdfgrep_wasm).then(WebAssembly.compileStreaming);
        this.em_module_promise = this.script_loader(pdfgrep_js);
        this.Module = this.load_module(pdfgrep_wasm, pdfgrep_js);
        this.on_initialized = null;
        this.on_initialized_promise = new Promise(resolve => (this.on_initialized = resolve));
        this.on_initialized_promise_notification = this.on_initialized_promise.then(on_initialized);
    }

    terminate() {
        this.Module = null;
    }

    async upload(files) {
        const Module = await this.Module;
        if (!Module) {
            throw new Error("Module not initialized");
        }

        for (const file of files) {
            const file_reader = new FileReader();
            file_reader.readAsArrayBuffer(file);
            await new Promise(resolve => file_reader.onloadend = resolve);
            const file_name = file.name;
            const file_path = "/tmp/" + file_name;
            await Module.FS.writeFile(file_path, new Uint8Array(file_reader.result));
        }

        return this.getFileCount();
    }

    async getFileCount() {
        const Module = await this.Module;
        if (!Module) {
            throw new Error("Module not initialized");
        }
        const files = await Module.FS.readdir('/tmp').filter(f => f != "." && f != "..");
        console.log(files);

        // return file count
        return await files.length;
    }


    async search(query) {
        const Module = await this.Module;
        if (!Module) {
            throw new Error("Module not initialized");
        }

        // default to all uploaded files
        const files = Module.FS.readdir('/tmp').filter(f => f != "." && f != "..");
        const res = await Module.callMainWithRedirects(["-iHn", query, ...files]);
        return res;
    }

    async load_module() {
        const [em_module, wasm_module] = await Promise.all([this.em_module_promise, WebAssembly.compileStreaming ? this.wasm_module_promise : this.wasm_module_promise.then(r => r.arrayBuffer())]);
        
        var Module = {
            thisProgram: 'pdfgrep',
            preRun: [() => Module.FS.chdir('/tmp')],
            postRun: [],
            output_stdout : '',
            print: (text) => {
                Module.output_stdout += text + '\n';
                this.print(text);
            },
            output_stderr : '',
            printErr: (text) => {
                Module.output_stderr += text + '\n';
                // this.print(text);
            },
            callMainWithRedirects: async (args) => {
                // https://github.com/emscripten-core/emscripten/issues/12219#issuecomment-714186373
                // clear memory after calling main
                const mem_header = Uint8Array.from(Module.HEAPU8.slice(0, this.mem_header_size));
                console.assert(this.mem_header_size % 4 == 0);
                console.assert(Module.HEAP32.slice(this.mem_header_size / 4).every(x => x == 0)); // is there a faster way to check that it's all zeros above a certain pointer?

                // run main
                Module.output_stdout = '';
                Module.output_stderr = '';
                const exit_code = Module.callMain(args);
                // Module._flush_streams();

                // restore memory
                Module.HEAPU8.fill(0);
                Module.HEAPU8.set(mem_header);

                return {
                    searchResult: {
                        exit_code: exit_code,
                        stdout: Module.output_stdout,
                        stderr: Module.output_stderr
                    }
                };
            },
        }

        const initialized_module = await pdfgrep(Module);
        this.on_initialized();
        return initialized_module;
    }
}
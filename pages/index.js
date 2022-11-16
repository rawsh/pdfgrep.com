import Head from 'next/head'
import { React, useState, useRef, useEffect, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import styles from '../styles/Home.module.css'

function search() {
    // set worker
    const workerRef = useRef(null);
    // file counter
    const [fileCount, setFileCount] = useState(0);
    // search enabled state
    const [searchEnabled, setSearchEnabled] = useState(false);
    // search input state
    const [search, setSearch] = useState("");
    // search results state
    const [results, setResults] = useState([]);
    // loading
    const [loading, setLoading] = useState(false);

    const pdfgrep = () => {
        if (!loading && searchEnabled && search.length > 0) {
            setResults([]);
            setLoading(true);
            workerRef.current.postMessage({ query: search });
        }
    }

    // Set localStorage item when the component mounts and add storage event listener
    useEffect(() => {
        if (workerRef.current == null) {
            // set worker
            workerRef.current = new Worker('/dist/pdfgrep_worker.js');
            workerRef.current.onmessage = ({ data: { searchResult, fileCount, exception, print }}) => {
                if (searchResult) {
                    setLoading(false);
                    if (searchResult.exit_code !== 0 && searchResult.stderr.length > 0) {
                        const stderr = searchResult.stderr.trim().split('\n').filter(l => !l.startsWith("program exited"));
                        if (stderr.length > 0) {
                            setResults(results => [...results, searchResult.stderr]);
                        }
                    }
                } else if (fileCount !== undefined) {
                    console.log("fileCount", fileCount);
                    setFileCount(fileCount);
                } else if (exception) {
                    console.error(exception);
                } else if (print) {
                    // add line to results
                    setResults(results => [...results, print]);
                } else {
                    console.error("Unknown message", searchResult, fileCount, exception, print);
                }
            };
            workerRef.current.postMessage({ pdfgrep_wasm: "/dist/pdfgrep.wasm", pdfgrep_js: "/dist/pdfgrep.js" });
        }
    }, []);

    useEffect(() => {
        if (fileCount > 0 && !loading) {
            setSearchEnabled(true);
        } else {
            setSearchEnabled(false);
        }
    }, [fileCount, loading]);

    function Dropzone() {
        const onDrop = useCallback(acceptedFiles => {
            // Filter out non-pdf files
            const pdfs = acceptedFiles.filter(f => f.type === "application/pdf");
            console.log("pdfs", pdfs);
            // Upload the files
            workerRef.current.postMessage({ files: pdfs });
        }
        , [])
        const {getRootProps, getInputProps, isDragActive} = useDropzone({onDrop})
        return (
            <div {...getRootProps()} className={styles.dropzone}>
                <input {...getInputProps()} />
                {
                isDragActive ?
                    <p>Drop the files here ...</p> :
                    <p>Drag 'n' drop some files here, or click to select files</p>
                }
            </div>
        )
    }
    
    return (
        <div className={styles.container}>
            <Head>
                <title>pdfgrep</title>
                <meta name="description" content="pdf search powered by pdfgrep compiled to webassembly" />
                <link rel="icon" href="/favicon.ico" />

                {/* Preload scripts */}
                <link rel="pdfgrep" type="text/javascript" id="pdfgrep_worker_js" href="/dist/pdfgrep_worker.js" /> 
                <link rel="pdfgrep" type="text/javascript" id="pdfgrep_pipeline_js" href="/dist/pdfgrep_pipeline.js" />
                <link rel="pdfgrep" type="text/javascript" id="pdfgrep_js" href="/dist/pdfgrep.js" />
                <link rel="pdfgrep" type="application/wasm" id="pdfgrep_wasm" href="/dist/pdfgrep.wasm" />
            </Head>

            <main>
                <h1 className={styles.title}>
                pdfgrep
                </h1>

                <p className={styles['description']}>
                <a href='https://pdfgrep.org'>pdfgrep</a> compiled to webassembly. upload documents to search
                </p>

                <Dropzone />

                {/* info box */}
                <div className={styles.info}>
                    <p>
                        Uploaded {fileCount} files.
                        {loading ? " Searching..." : ""}
                    </p>
                </div>

                {/* search form */}
                <form className={styles.header}>
                    <input 
                        type="text" 
                        placeholder="Search" 
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            pdfgrep();
                        }}
                    } />
                    <button type="button" disabled={!searchEnabled} onClick={pdfgrep}>Search</button>
                </form>

                {/* results */}
                <div className={styles['results']}>
                    {/* monospace */}
                    <pre className={styles['results-pre']}>
                    {results.map((result, index) => (
                        <div key={index} className={styles['result']}>
                            {result}
                        </div>
                    ))}
                    </pre>
                </div>
            </main>

            <footer>
            Robert Washbourne 2022
            </footer>

            <style jsx global>{`
                html,
                body {
                    padding: 0;
                    margin: 0;
                    font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto,
                        Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue,
                        sans-serif;
                }

                * {
                    box-sizing: border-box;
                }

                a {
                    color: inherit;
                    text-decoration: none;
                }

                a:hover {
                    text-decoration: underline;
                }

                code {
                    background: #fafafa;
                    border-radius: 5px;
                    padding: 0.75rem;
                    font-size: 1.1rem;
                    font-family: Menlo, Monaco, Lucida Console, Liberation Mono,
                        DejaVu Sans Mono, Bitstream Vera Sans Mono, Courier New, monospace;
                }

                main {
                    width: 100%;
                    padding: 5rem 1rem;
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: left;
                }

                footer {
                    width: 100%;
                    height: 100px;
                    border-top: 1px solid #eaeaea;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }
                
                footer img {
                    margin-left: 0.5rem;
                }
                
                footer a {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }
            `}</style>
        </div>
    )
}

export default search

import Head from 'next/head'
import * as React from 'react'
import { useState, useRef, useEffect, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { ChevronsLeft, ChevronsUp } from 'react-feather'
import styles from '../styles/Home.module.css'

import { NavigationHandle } from '../components/PDFViewer'
import PDFViewer from '../components/PDFViewer'
import { PageNavigationPlugin } from '@react-pdf-viewer/page-navigation'

// sty;es 
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/page-navigation/lib/styles/index.css';

function search() {
    // set worker
    const workerRef = useRef<Worker | null>(null);
    const navigationRef = useRef<NavigationHandle>(null);

    // search enabled state
    const [expanded, setExpanded] = useState(false);
    const [fileCount, setFileCount] = useState(0);

    // header state
    const [headerHidden, setHeaderHidden] = useState(false);
    
    // search state
    const [search, setSearch] = useState("");
    const [searchEnabled, setSearchEnabled] = useState(false);
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<string[]>([]);
    const [currentFileName, setCurrentFileName] = useState("");
    const [currentPdf, setCurrentPdf] = useState<Uint8Array | null>(null);
    const [fileNameToData, setFileNameToData] = useState<{[key: string]: Uint8Array}>({});
    const [page, setPage] = useState(0);

    const toggleHeader = () => {
        setHeaderHidden(!headerHidden);
    }

    const pdfgrep = () => {
        if (workerRef.current && !loading && searchEnabled && search.length > 0) {
            setResults([]);
            setLoading(true);
            workerRef.current.postMessage({ query: search });
        }
    }

    // Set localStorage item when the component mounts and add storage event listener
    useEffect(() => {
        // if screen width is larger than 1400, expand pdf viewer
        if (window.innerWidth > 1400) {
            setExpanded(true);
        } 

        // add event listener for screen resize
        window.addEventListener('resize', () => {
            if (window.innerWidth > 1400) {
                setExpanded(true);
            } else {
                setExpanded(false);
            }
        });

        if (workerRef.current == null) {
            // set worker
            workerRef.current = new Worker('/dist/pdfgrep_worker.js');
            workerRef.current.onmessage = ({ data: { searchResult, singleFileData, fileData, exception, print }}) => {
                if (searchResult) {
                    setLoading(false);
                    if (searchResult.exit_code !== 0 && searchResult.stderr.length > 0) {
                        const stderr = searchResult.stderr.trim().split('\n').filter(l => !l.startsWith("program exited"));
                        if (stderr.length > 0) {
                            setResults(results => [...results, searchResult.stderr]);
                        }
                    }
                } else if (singleFileData) {
                    console.log(singleFileData);
                    setCurrentPdf(singleFileData);
                } else if (fileData) {
                    setFileCount(fileData.fileCount);
                    setFileNameToData(fileData.fileNameToData);
                    setCurrentFileName(Object.keys(fileData.fileNameToData)[0]);
                    setCurrentPdf(fileData.fileNameToData[Object.keys(fileData.fileNameToData)[0]]);
                } else if (exception) {
                    console.error(exception);
                } else if (print) {
                    // add line to results
                    setResults(results => {
                        if (results.length === 0) {
                            // first result, open pdf
                            const [fileName, line, ...rest] = print.split(':');
                            if (fileName !== undefined && line !== undefined) {
                                if (fileName === currentFileName) {
                                    navigationRef.current?.jumpToPage(parseInt(line)-1);
                                }
                                setPage(parseInt(line));
                                workerRef.current?.postMessage({ getFileData: fileName });
                            }
                        }
                        return [...results, print];
                    });
                } else {
                    console.error("Unknown message", searchResult, fileData, exception, print);
                }
            };
            workerRef.current.postMessage({ pdfgrep_wasm: "/dist/pdfgrep.wasm", pdfgrep_js: "/dist/pdfgrep.js" });
        }
    }, []);

    // disable the search if loading
    useEffect(() => {
        if (!loading) {
            setSearchEnabled(true);
        } else {
            setSearchEnabled(false);
        }
    }, [loading]);

    function Dropzone() {
        const onDrop = useCallback(acceptedFiles => {
            if (workerRef.current) {
                // Filter out non-pdf files
                const pdfs = acceptedFiles.filter(f => f.type === "application/pdf");
                // Upload the files
                workerRef.current.postMessage({ files: pdfs });
            } else {
                console.error("workerRef.current is null");
            }
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
    <>
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
        
        <div className={styles.container}>
            <main className={expanded ? styles.mainExpanded : styles.main}>
            <h1 className={styles.title}>
            pdfgrep
            </h1>
            <header className={expanded ? styles.headerExpanded : [styles.header, styles.sticky].join(" ")}>
                <p className={styles.description}> 
                {fileCount === 0 ? <><a href='https://pdfgrep.org'>pdfgrep</a> compiled to webassembly. upload files to search.</> : <> uploaded {fileCount} {fileCount === 1 ? "file" : "files"}{loading ? <>. searching...</> : ""}</>}
                </p>

                <Dropzone />

                {/* search form */}
                <form className={styles.search + " " + (expanded ? styles.expanded : "")}>
                    <div className={[styles.controlButton, styles.collapseHeaderButton].join(" ")} onClick={toggleHeader}><ChevronsUp size="36"/></div>
                    <div className={styles.searchContainer}>
                        <input
                            className={styles.searchInput}
                            type="text" 
                            placeholder="search term (regex supported)"
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                pdfgrep();
                            }}
                        } />
                        <button className={styles.searchButton} type="button" disabled={!searchEnabled} onClick={pdfgrep}>search</button>
                    </div>
                </form>
            </header>


            {/* results */}
            <div className={styles.results}>
                {/* monospace */}
                <pre className={styles.code}>
                {results.map((result, index) => {
                    // parse result to get filename and slide number
                    // result format: "filename.pdf:1: some text"
                    const [filename, slide, ...text] = result.split(":");

                    return(
                        <div key={index} className={styles.result} onClick={() => {
                            if (filename === currentFileName) {
                                navigationRef.current?.jumpToPage(page-1);
                            }
                            setPage(parseInt(slide));
                            setCurrentFileName(filename);
                            setCurrentPdf(fileNameToData[filename]);
                        }}>
                            {result}
                        </div>
                    )}
                )}
                </pre>
            </div>

            {expanded && currentPdf !== null ?
                <div className={[styles.controlButton, styles.minimizeButton].join(" ")} onClick={() => setExpanded(false)}><ChevronsLeft size="36"/></div>
            : ""}
            </main>

            {expanded && currentPdf !== null ?
                <PDFViewer initialPage={page - 1} pdfData={currentPdf} ref={navigationRef} /> 
            : ""}
        </div>

        {/* <footer className={styles.footer} style={{display: expanded ? "none" : "flex"}}>
        <a href='mailto:robert@devpy.me'>robert@devpy.me</a>
        </footer> */}

        <style jsx global>{`
            html,
            body {
                height: 100%;
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
        `}</style>
    </>
    )
}

export default search

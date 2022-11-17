'use client';

import * as React from 'react'
import { useState, useRef, useEffect, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { ChevronsDown, ChevronsLeft, ChevronsUp, Repeat } from 'react-feather'

import { PDFViewer, NavigationHandle } from './PDFViewer'

// sty;es 
import styles from '../styles/Home.module.css'
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/page-navigation/lib/styles/index.css';

type FileWithPageData = {
    fileName: string;
    fileData: Uint8Array;
    currentPage: number;
};

export default function Search() {
    // set worker
    const workerRef = useRef<Worker | null>(null);
    const navigationRef = useRef<NavigationHandle>(null);

    // search enabled state
    const [expanded, setExpanded] = useState(false);
    
    // header state
    const [headerHidden, setHeaderHidden] = useState(false);
    
    // search state
    const [search, setSearch] = useState("");
    const [searchEnabled, setSearchEnabled] = useState(false);
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<string[]>([]);
    
    // pdf viewer state
    const [showPdf, setShowPdf] = useState(false);
    const [fileCount, setFileCount] = useState(0);
    const [fileNameToData, setFileNameToData] = useState<{[key: string]: Uint8Array}>({});

    const [currentPdf, setCurrentPdf] = useState<FileWithPageData>({
        fileName: "", 
        fileData: new Uint8Array(), 
        currentPage: 0
    });

    // const [currentFileName, setCurrentFileName] = useState("");
    // const [currentPdf, setCurrentPdf] = useState<Uint8Array | null>(null);
    // const [page, setPage] = useState(0);

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

    // when navigationHandle is set, jump to page
    // useEffect(() => {
    //     if (navigationRef.current) {
    //         navigationRef.current.jumpToPage(currentPdf.currentPage);
    //     }
    // }, [navigationRef.current]);

    // Set localStorage item when the component mounts and add storage event listener
    useEffect(() => {
        // if screen width is larger than 1400, expand pdf viewer
        if (window.innerWidth > 1400) {
            setShowPdf(true);
            setExpanded(true);
        } 

        // add event listener for screen resize
        window.addEventListener('resize', () => {
            if (window.innerWidth > 1400) {
                setShowPdf(true);
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
                        const stderr = searchResult.stderr.trim().split('\n').filter((l: string) => !l.startsWith("program exited"));
                        if (stderr.length > 0) {
                            setResults(results => [...results, searchResult.stderr]);
                        }
                    }
                } else if (singleFileData) {
                    setCurrentPdf(singleFileData);
                } else if (fileData) {
                    setFileCount(fileData.fileCount);
                    setFileNameToData(fileData.fileNameToData);
                    const fileNames = Object.keys(fileData.fileNameToData);
                    setCurrentPdf({
                        fileName: fileNames[0],
                        fileData: fileData.fileNameToData[fileNames[0]],
                        currentPage: 0
                    });
                } else if (exception) {
                    console.error(exception);
                } else if (print) {
                    // add line to results
                    setResults(results => [...results, print]);
                    // setResults(results => {
                    //     if (results.length === 0) {
                    //         // first result, open pdf
                    //         const [fileName, line, ...rest] = print.split(':');
                    //         if (fileName !== undefined && line !== undefined) {
                    //             if (fileName === currentPdf.fileName) {
                    //                 console.log("same file, set page");
                    //                 setCurrentPdf(currentPdf => {
                    //                     return {
                    //                         ...currentPdf,
                    //                         currentPage: parseInt(line)-1
                    //                     }
                    //                 });
                    //             } else {
                    //                 workerRef.current?.postMessage({
                    //                     getFileData: {
                    //                         fileName: fileName,
                    //                         currentPage: parseInt(line)-1
                    //                     }
                    //                 });
                    //             }
                    //         }
                    //     }
                    //     return [...results, print];
                    // });
                } else {
                    console.error("Unknown message", searchResult, fileData, exception, print);
                }
            };
            workerRef.current.postMessage({ pdfgrep_wasm: "/dist/pdfgrep.wasm", pdfgrep_js: "/dist/pdfgrep.js" });
        }
    }, []);

    // disable the search if loading
    useEffect(() => {
        if (!loading && search !== "") {
            setSearchEnabled(true);
        } else {
            setSearchEnabled(false);
        }
    }, [loading, search]);

    function Dropzone() {
        const onDrop = useCallback((acceptedFiles: File[]) => {
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
        <div className={expanded ? styles.containerExpanded : styles.container}>
            <main className={expanded ? styles.mainExpanded : styles.main}>
            <header className={expanded ? styles.headerExpanded : [styles.header, styles.sticky].join(" ")}>
                <div className={headerHidden || (showPdf && !expanded) ? styles.headerContentHidden : styles.headerContent}>
                    <h1 className={styles.title}>
                    pdfgrep
                    </h1>
                    <p className={styles.description}> 
                    {fileCount === 0 ? <><a href='https://pdfgrep.org'>pdfgrep</a> compiled to webassembly. upload files to search.</> : <> uploaded {fileCount} {fileCount === 1 ? "file" : "files"}{loading ? <>. searching...</> : ""}</>}
                    </p>

                    <Dropzone />
                </div>

                {/* search form */}
                <form className={styles.search + " " + (expanded ? styles.expanded : "")}>
                    <div className={[styles.controlButton, styles.collapseHeaderButton].join(" ")} onClick={toggleHeader}>
                        {headerHidden ? <ChevronsDown size="36"/> : <ChevronsUp size="36"/>}
                    </div>
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
                    const [filename, page, ...rest] = result.split(":");

                    return(
                        <div key={index} className={styles.result} onClick={async () => {
                            if (!showPdf) {
                                setShowPdf(true);
                            }
                            if (filename === currentPdf.fileName) {
                                navigationRef.current?.jumpToPage(parseInt(page)-1);
                                setCurrentPdf(currentPdf => {
                                    return {
                                        ...currentPdf,
                                        currentPage: parseInt(page)-1
                                    }
                                });
                            } else {
                                setCurrentPdf({
                                    fileName: filename,
                                    fileData: fileNameToData[filename],
                                    currentPage: parseInt(page)-1
                                });
                            }
                        }}>
                            {result}
                        </div>
                    )}
                )}
                </pre>
            </div>

            <div className={[styles.controlButton, styles.minimizeButton].join(" ")} onClick={() => {
                if(expanded) { 
                    setExpanded(false); 
                    if (currentPdf.fileName === "") {
                        setShowPdf(false);
                    }
                } else {
                    setShowPdf(!showPdf);
                }
            }}>
                {expanded ? <ChevronsLeft size="36"/> : <Repeat size="36"/>}
            </div>
            </main>
            <PDFViewer initialPage={currentPdf.currentPage} ref={navigationRef} pdfData={currentPdf.fileData} showPdf={(expanded && showPdf) || (!expanded && !headerHidden && showPdf)} expanded={expanded} />
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

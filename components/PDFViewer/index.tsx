import { useState, useEffect, useRef, useImperativeHandle } from 'react';
import * as React from 'react';
import styles from '../../styles/Home.module.css'
import { ChevronsLeft } from 'react-feather';

// Import the main component
import { Worker, Viewer } from '@react-pdf-viewer/core';
import { pageNavigationPlugin } from '@react-pdf-viewer/page-navigation';

export type NavigationHandle = {
    jumpToPage: (page: number) => void;
};

function PDFViewer(props, navigationRef) {
    const jumpToPagePluginInstance = pageNavigationPlugin();
    const { jumpToPage } = jumpToPagePluginInstance;

    useImperativeHandle(navigationRef, () => ({
        jumpToPage: (page: number) => jumpToPage(page),
    }));

    return (
        <div className={[styles.pdfViewer, styles.sidePanel].join(" ")}>
            <Worker workerUrl="/pdf.worker.min.js">
                <Viewer initialPage={props.initialPage} fileUrl={props.pdfData} plugins={[jumpToPagePluginInstance]}/>
            </Worker>
        </div>
    )
}

export default React.forwardRef(PDFViewer);
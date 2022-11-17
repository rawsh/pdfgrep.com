import { useImperativeHandle } from 'react';
import * as React from 'react';
import styles from '../../styles/Home.module.css'

// Import the main component
import { Worker, Viewer } from '@react-pdf-viewer/core';
import { pageNavigationPlugin } from '@react-pdf-viewer/page-navigation';

export type NavigationHandle = {
    jumpToPage: (page: number) => void;
};

type PDFViewerProps = {
    showPdf: boolean;
    expanded: boolean;
    initialPage: number;
    pdfData: Uint8Array;
};

export const PDFViewer = React.forwardRef<NavigationHandle, PDFViewerProps>((props, ref) => {
    const jumpToPagePluginInstance = pageNavigationPlugin();
    const { jumpToPage } = jumpToPagePluginInstance;

    useImperativeHandle(ref, () => ({
        jumpToPage: (page: number) => jumpToPage(page),
    }));

    const containerStyle = [styles.pdfViewer, styles.sidePanel].join(" ") + (props.showPdf ? "" : " " + styles.pdfHidden) + (props.expanded ? " " + styles.pdfViewerExpanded : "");
    return (
        <div className={containerStyle}>
            <Worker workerUrl="/pdf.worker.min.js">
                {props.pdfData.length > 0 ? (
                    <Viewer initialPage={props.initialPage} fileUrl={props.pdfData} plugins={[jumpToPagePluginInstance]}/>
                ): ""}
            </Worker>
        </div>
    )
});
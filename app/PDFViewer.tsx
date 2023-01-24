"use client"

import { useImperativeHandle } from 'react';
import * as React from 'react';

// Import the main component
import { Worker, Viewer } from '@react-pdf-viewer/core';
import { pageNavigationPlugin } from '@react-pdf-viewer/page-navigation';
import { toolbarPlugin } from '@react-pdf-viewer/toolbar';

// Import the styles
import '@react-pdf-viewer/toolbar/lib/styles/index.css';
import '@react-pdf-viewer/page-navigation/lib/styles/index.css';
import '@react-pdf-viewer/core/lib/styles/index.css';
import styles from '../styles/PDFViewer.module.css';

// Types
import type { ToolbarSlot, TransformToolbarSlot } from '@react-pdf-viewer/toolbar';

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
    const toolbarPluginInstance = toolbarPlugin();
    const jumpToPagePluginInstance = pageNavigationPlugin();
    const { jumpToPage } = jumpToPagePluginInstance;
    const { renderDefaultToolbar, Toolbar } = toolbarPluginInstance;
    const transform: TransformToolbarSlot = (slot: ToolbarSlot) => ({
        ...slot,
        // These slots will be empty
        ShowSearchPopover: () => <></>,
        Open: () => <></>,
        SwitchTheme: () => <></>,
    });

    useImperativeHandle(ref, () => ({
        jumpToPage: (page: number) => jumpToPage(page),
    }));


    const containerStyle = [styles.pdfViewer, styles.sidePanel].join(" ") + (props.showPdf ? "" : " " + styles.pdfHidden) + (props.expanded ? " " + styles.pdfViewerExpanded : "");
    return (
        <div className={containerStyle}>
            <Worker workerUrl="/dist/pdf.worker.js">
                {props.pdfData.length > 0 ? (
                    <div className={styles.pdfViewerInner}>
                        <div className={styles.toolbarWrapper}><Toolbar>{renderDefaultToolbar(transform)}</Toolbar></div>
                        <Viewer initialPage={props.initialPage} fileUrl={props.pdfData} plugins={[jumpToPagePluginInstance, toolbarPluginInstance]}/>
                    </div>
                ): ""}
            </Worker>
        </div>
    )
});
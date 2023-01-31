'use client';

import * as React from 'react'
import styles from '../styles/ResTable.module.css'

type ResTableData = {
    filename: string,
    page: number,
    text: string
}

type ResTableProps = {
    currentRow: number,
    data: ResTableData[],
    onRowClick: (filename: string, page: number, index: number) => void
}

export default function ResTable(props: ResTableProps) {
    const data = props.data

    return (
        <div className={styles.tableWrapper}>
            <div className={`${styles.results}`}>
                {data.map((row, i) => {
                    let className = styles.result
                    if (props.currentRow === i) {
                        className += ` ${styles.selected}`
                    }
                    return (
                        <div className={className} key={i} onClick={() => props.onRowClick(row.filename, row.page, i)}>
                            <div className={`${styles.filename} `}>{row.filename}</div>
                            <div className={`${styles.page} `}>{row.page}</div>
                            <div className={`${styles.text} `}>{row.text}</div>
                        </div>                    
                    )
                })}
            </div>
        </div>
    )
}

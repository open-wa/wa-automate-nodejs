export interface Button {
    id: string,
    text: string
}

export interface Row {
    title: string,
    description: string,
    rowId: string
}

export interface Section {
    title: string,
    rows: Row[]
}

export interface Button {
    id: string,
    text: string
}
export interface AdvancedButton {
    id ?: string
    text: string
    url ?: string
    number ?: string
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

export interface LocationButtonBody {
    lat:number,
    lng:number,
    caption:string
}
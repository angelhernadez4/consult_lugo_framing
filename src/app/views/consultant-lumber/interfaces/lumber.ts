export interface Lumber {
    description: string;
    length: number;
    quantity: number;
    used: number;
    annotations?: string;
    price: number;
}

export interface Item {
    type: 'title' | 'item';
    item?: number;
    title?: string;
    materialRef?: any;
    quantity?: number;
    description?: string;
    length?: number;
    price?: number;
    used?: string;
    annotations?: string;
}
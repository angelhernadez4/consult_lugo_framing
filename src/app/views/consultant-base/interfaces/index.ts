// export interface Material {
//     material: string;
//     length?: number;
//     price: number;
//     size?: string;
//     price_box: number;
// }

import { Material } from "@views/materials/interfaces";

export interface Item {
    type: 'item' | 'title';
    item?: number;
    item_order?: number;
    quantity?: number;
    material_id?: string;
    description?: string;
    materialRef?: Material;
    length?: number;
    price?: number;
    used?: string;
    annotations?: string;
    title?: string;
    size?: string;
}

export interface ItemHardware extends Item {
    unit?: Unit
}

export interface ItemSiding extends Item {
    unit?: Unit
}

export interface Unit {
    name: string;
    label: string;
}
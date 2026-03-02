import { Timestamps } from "@core/interfaces";

export interface Material extends MaterialRecord, Timestamps {
    categories: CategoryIds[]
}

export interface CategoryIds {
    material_id: number;
    category_id: number;
    category: Category
}

export interface Category {
    id: number;
    name: string;
}

export interface MaterialRecord extends MaterialCore {
    id: string;
}

export interface MaterialCore {
    name: string;
    unit_type: string;
    unit_price: number;
    unit_price_box: number;
    qty_per_box: number;
    unit_length: number;
    unit_area_sf: number;
    image_url: string;
    due_date: string;
    unit_width: number;
    full_name: string;
    category_ids: number[]
}

export interface UploadEvent {
    originalEvent: Event;
    files: File[]
}

export interface CloudinaryResponse {
    secure_url: string;
    format: string;
}
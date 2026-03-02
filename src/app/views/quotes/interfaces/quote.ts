import { Timestamps } from "@core/interfaces";
import { Item } from "@views/consultant-base/interfaces";

export interface Quote extends QuoteRecord, Timestamps {
}

export interface QuoteRecord extends QuoteCore {
    id: string;
}

export interface QuoteCore {
    project: string;
    estimator: string;
    total_price: string;
    quote_type: string;
    created_by: string;
    items: Item[]
}
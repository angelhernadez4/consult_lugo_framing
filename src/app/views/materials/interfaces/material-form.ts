export enum MaterialForm {
    NAME = 'name',
    UNIT_TYPE = 'unit_type',
    UNIT_PRICE = 'unit_price',
    UNIT_PRICE_BOX = 'unit_price_box',
    QTY_PER_BOX = 'qty_per_box',
    UNIT_LENGTH = 'unit_length',
    UNIT_AREA_SF = 'unit_area_sf',
    UNIT_WIDTH = 'unit_width',
    CATEGORY_IDS = 'category_ids',
    DUE_DATE = 'due_date',
    FULL_NAME = 'full_name'
}

export const MATERIAL_FORM_CONTROLS_NAMES: Record<keyof typeof MaterialForm, MaterialForm> = {
    NAME: MaterialForm.NAME,
    UNIT_TYPE: MaterialForm.UNIT_TYPE,
    UNIT_PRICE: MaterialForm.UNIT_PRICE,
    UNIT_PRICE_BOX: MaterialForm.UNIT_PRICE_BOX,
    QTY_PER_BOX: MaterialForm.QTY_PER_BOX,
    UNIT_LENGTH: MaterialForm.UNIT_LENGTH,
    UNIT_AREA_SF: MaterialForm.UNIT_AREA_SF,
    DUE_DATE: MaterialForm.DUE_DATE,
    UNIT_WIDTH: MaterialForm.UNIT_WIDTH,
    CATEGORY_IDS: MaterialForm.CATEGORY_IDS,
    FULL_NAME: MaterialForm.FULL_NAME
}
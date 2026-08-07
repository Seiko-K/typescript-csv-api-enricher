// ==========================================
// Enriched Supplier Data Model
// APIから取得した国情報を追加した仕入先データ
// ==========================================

import type { Supplier } from "./supplier";

/**
 * Country APIによって補完されたSupplierデータです。
 *
 * Excelでいうと、Supplier Masterへ
 * XLOOKUPなどで国マスター情報を追加した状態に相当します。
 */
export interface EnrichedSupplier extends Supplier {
    // APIから取得した英語の国名
    countryName: string;

    // World Bankの地域区分
    region: string;

    // World Bankの所得区分
    incomeLevel: string;

    // 首都名
    capitalCity: string;

    // 首都の経度
    longitude: number | null;

    // 首都の緯度
    latitude: number | null;

    // API補完処理の結果
    enrichmentStatus:
        | "ENRICHED"
        | "SKIPPED_INVALID_COUNTRY_CODE"
        | "API_ERROR";
}
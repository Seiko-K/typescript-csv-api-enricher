// ==========================================
// Country Data Models
// Country APIから取得する国情報の型定義
// ==========================================

/**
 * Supplierデータへ追加する国情報です。
 *
 * Excelでいうと、国コードをキーにして
 * マスターテーブルから取得する追加列に相当します。
 */
export interface CountryInformation {
    // ISO 3166-1 alpha-2形式の国コード
    countryCode: string;

    // 英語の国名
    countryName: string;

    // World Bank地域区分
    region: string;

    // World Bank所得区分
    incomeLevel: string;

    // 首都名
    capitalCity: string;

    // 経度。APIに値がない場合はnull
    longitude: number | null;

    // 緯度。APIに値がない場合はnull
    latitude: number | null;
}
// ==========================================
// Supplier Data Model
// 仕入先マスターデータの型定義
// ==========================================

/**
 * CSVから読み込む仕入先データの1レコードを表します。
 *
 * Excelでいうと、tblSupplier の1行に相当します。
 */
export interface Supplier {
    // 仕入先を一意に識別するID
    supplierId: string;

    // 仕入先名
    supplierName: string;

    // ISO 3166-1 alpha-2形式の国コード
    // CSVでは空欄が含まれる可能性があるため、文字列として受け取ります。
    countryCode: string;

    // 連絡先メールアドレス
    // 読込時点では未検証の文字列として扱います。
    email: string;
}
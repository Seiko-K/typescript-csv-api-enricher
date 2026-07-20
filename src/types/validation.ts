// ==========================================
// Validation Result Models
// 検証結果を共通形式で扱うための型定義
// ==========================================

/**
 * 検証エラーの種類を表します。
 *
 * 新しい検証ルールを追加するときは、
 * この型へルール名を追加します。
 */
export type ValidationRule =
    | "REQUIRED_VALUE"
    | "DUPLICATE_SUPPLIER_ID"
    | "INVALID_EMAIL_FORMAT";

/**
 * 1件の検証エラーを表します。
 *
 * Excelでいうと、
 * エラーレポートの1行に相当します。
 */
export interface ValidationIssue {
    // 問題が見つかったCSV上の行番号
    rowNumber: number;

    // 問題のある仕入先ID
    supplierId: string;

    // 問題のある列名
    field: string;

    // 違反した検証ルール
    rule: ValidationRule;

    // 利用者向けのエラーメッセージ
    message: string;
}

/**
 * Supplierデータ全体の検証結果を表します。
 */
export interface SupplierValidationResult {
    // 入力された総レコード数
    totalRecords: number;

    // 問題がなかったレコード数
    validRecords: number;

    // 1件以上の問題があったレコード数
    invalidRecords: number;

    // 検出されたすべての問題
    issues: ValidationIssue[];
}
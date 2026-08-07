// ==========================================
// Supplier Validator
// 仕入先データの品質を検証する
// ==========================================

import type { Supplier } from "../types/supplier";
import type {
    SupplierValidationResult,
    ValidationIssue
} from "../types/validation";

/**
 * 値が空文字かどうかを確認します。
 *
 * 前後の空白だけが入力されている場合も、
 * 空の値として扱います。
 */
function isEmpty(value: string): boolean {
    return value.trim().length === 0;
}

/**
 * メールアドレスが基本的な形式を満たしているか確認します。
 *
 * この関数はメールアドレスの存在確認までは行いません。
 * CSV入力値の基本的な形式だけを確認します。
 */
function isValidEmail(value: string): boolean {
    const normalizedEmail = value.trim();

    const emailPattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    return emailPattern.test(normalizedEmail);
}

/**
 * 国コードがISO 3166-1 alpha-2の基本形式を
 * 満たしているか確認します。
 *
 * 確認内容：
 * - 半角英字2文字
 * - 大文字・小文字はどちらでも受け付ける
 *
 * 実在する国コードかどうかは、
 * 次工程のCountry APIで確認します。
 */
function isValidCountryCodeFormat(
    value: string
): boolean {
    const normalizedCountryCode =
        value.trim();

    const countryCodePattern = /^[A-Za-z]{2}$/;

    return countryCodePattern.test(
        normalizedCountryCode
    );
}

/**
 * Supplierデータを検証します。
 *
 * 現在の検証内容：
 * - 必須項目チェック
 * - Supplier ID重複チェック
 * - メールアドレス形式チェック
 * - 国コード形式チェック
 *
 * @param suppliers CSVから読み込んだ仕入先データ
 * @returns 集計結果と検出された問題
 */
export function validateSuppliers(
    suppliers: Supplier[]
): SupplierValidationResult {
    const issues: ValidationIssue[] = [];

    // Supplier IDごとの出現回数を記録します。
    // Excelでいうと、COUNTIFで重複件数を調べるイメージです。
    const supplierIdCounts =
        new Map<string, number>();

    for (const supplier of suppliers) {
        const normalizedSupplierId =
            supplier.supplierId.trim();

        // 空のSupplier IDは重複検証の対象外とします。
        // 空欄は必須項目チェックで検出します。
        if (normalizedSupplierId.length === 0) {
            continue;
        }

        const currentCount =
            supplierIdCounts.get(
                normalizedSupplierId
            ) ?? 0;

        supplierIdCounts.set(
            normalizedSupplierId,
            currentCount + 1
        );
    }

    // ヘッダー行を1行目とするため、
    // 最初のデータ行はCSV上の2行目になります。
    suppliers.forEach((supplier, index) => {
        const rowNumber = index + 2;

        // ======================================
        // Required Value Validation
        // 必須項目チェック
        // ======================================

        if (isEmpty(supplier.supplierId)) {
            issues.push({
                rowNumber,
                supplierId: supplier.supplierId,
                field: "supplierId",
                rule: "REQUIRED_VALUE",
                message:
                    "Supplier ID is required."
            });
        }

        if (isEmpty(supplier.supplierName)) {
            issues.push({
                rowNumber,
                supplierId: supplier.supplierId,
                field: "supplierName",
                rule: "REQUIRED_VALUE",
                message:
                    "Supplier name is required."
            });
        }

        if (isEmpty(supplier.countryCode)) {
            issues.push({
                rowNumber,
                supplierId: supplier.supplierId,
                field: "countryCode",
                rule: "REQUIRED_VALUE",
                message:
                    "Country code is required."
            });
        }

        if (isEmpty(supplier.email)) {
            issues.push({
                rowNumber,
                supplierId: supplier.supplierId,
                field: "email",
                rule: "REQUIRED_VALUE",
                message:
                    "Email address is required."
            });
        }

        // ======================================
        // Duplicate Supplier ID Validation
        // Supplier ID重複チェック
        // ======================================

        const normalizedSupplierId =
            supplier.supplierId.trim();

        const supplierIdCount =
            supplierIdCounts.get(
                normalizedSupplierId
            ) ?? 0;

        if (
            normalizedSupplierId.length > 0 &&
            supplierIdCount > 1
        ) {
            issues.push({
                rowNumber,
                supplierId:
                    supplier.supplierId,
                field: "supplierId",
                rule:
                    "DUPLICATE_SUPPLIER_ID",
                message:
                    `Duplicate supplier ID: ` +
                    `${normalizedSupplierId}`
            });
        }

        // ======================================
        // Email Format Validation
        // メールアドレス形式チェック
        // ======================================

        // 空欄は必須項目チェックで検出済みなので、
        // 値がある場合だけ形式を確認します。
        if (
            !isEmpty(supplier.email) &&
            !isValidEmail(supplier.email)
        ) {
            issues.push({
                rowNumber,
                supplierId:
                    supplier.supplierId,
                field: "email",
                rule:
                    "INVALID_EMAIL_FORMAT",
                message:
                    `Invalid email format: ` +
                    `${supplier.email.trim()}`
            });
        }

        // ======================================
        // Country Code Format Validation
        // 国コード形式チェック
        // ======================================

        // 空欄は必須項目チェックで検出済みなので、
        // 値がある場合だけ形式を確認します。
        if (
            !isEmpty(supplier.countryCode) &&
            !isValidCountryCodeFormat(
                supplier.countryCode
            )
        ) {
            issues.push({
                rowNumber,
                supplierId:
                    supplier.supplierId,
                field: "countryCode",
                rule:
                    "INVALID_COUNTRY_CODE_FORMAT",
                message:
                    `Invalid country code format: ` +
                    `${supplier.countryCode.trim()}. ` +
                    "Use a two-letter country code."
            });
        }
    });

    // 複数の問題が同じ行に存在しても、
    // 無効レコード数としては1行だけ数えます。
    const invalidRowNumbers = new Set(
        issues.map(
            (issue) => issue.rowNumber
        )
    );

    return {
        totalRecords: suppliers.length,

        validRecords:
            suppliers.length -
            invalidRowNumbers.size,

        invalidRecords:
            invalidRowNumbers.size,

        issues
    };
}
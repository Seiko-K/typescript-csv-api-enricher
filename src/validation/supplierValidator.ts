// ==========================================
// Supplier Validator
// 仕入先データの必須項目と重複を検証する
// ==========================================

import type { Supplier } from "../types/supplier";
import type {
    SupplierValidationResult,
    ValidationIssue
} from "../types/validation";

/**
 * 値が空文字かどうかを確認します。
 */
function isEmpty(value: string): boolean {
    return value.trim().length === 0;
}

/**
 * Supplierデータを検証します。
 *
 * 現在の検証内容：
 * - 必須項目チェック
 * - Supplier ID重複チェック
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
    const supplierIdCounts = new Map<string, number>();

    for (const supplier of suppliers) {
        const normalizedSupplierId = supplier.supplierId.trim();

        if (normalizedSupplierId.length === 0) {
            continue;
        }

        const currentCount =
            supplierIdCounts.get(normalizedSupplierId) ?? 0;

        supplierIdCounts.set(
            normalizedSupplierId,
            currentCount + 1
        );
    }

    // ヘッダー行を1行目とするため、
    // 最初のデータ行はCSV上の2行目になります。
    suppliers.forEach((supplier, index) => {
        const rowNumber = index + 2;

        if (isEmpty(supplier.supplierId)) {
            issues.push({
                rowNumber,
                supplierId: supplier.supplierId,
                field: "supplierId",
                rule: "REQUIRED_VALUE",
                message: "Supplier ID is required."
            });
        }

        if (isEmpty(supplier.supplierName)) {
            issues.push({
                rowNumber,
                supplierId: supplier.supplierId,
                field: "supplierName",
                rule: "REQUIRED_VALUE",
                message: "Supplier name is required."
            });
        }

        if (isEmpty(supplier.countryCode)) {
            issues.push({
                rowNumber,
                supplierId: supplier.supplierId,
                field: "countryCode",
                rule: "REQUIRED_VALUE",
                message: "Country code is required."
            });
        }

        if (isEmpty(supplier.email)) {
            issues.push({
                rowNumber,
                supplierId: supplier.supplierId,
                field: "email",
                rule: "REQUIRED_VALUE",
                message: "Email address is required."
            });
        }

        const normalizedSupplierId = supplier.supplierId.trim();
        const supplierIdCount =
            supplierIdCounts.get(normalizedSupplierId) ?? 0;

        if (
            normalizedSupplierId.length > 0 &&
            supplierIdCount > 1
        ) {
            issues.push({
                rowNumber,
                supplierId: supplier.supplierId,
                field: "supplierId",
                rule: "DUPLICATE_SUPPLIER_ID",
                message: `Duplicate supplier ID: ${normalizedSupplierId}`
            });
        }
    });

    // 複数エラーが同じ行に存在しても、
    // 無効レコード数としては1行だけ数えます。
    const invalidRowNumbers = new Set(
        issues.map((issue) => issue.rowNumber)
    );

    return {
        totalRecords: suppliers.length,
        validRecords:
            suppliers.length - invalidRowNumbers.size,
        invalidRecords: invalidRowNumbers.size,
        issues
    };
}
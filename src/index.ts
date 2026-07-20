// ==========================================
// Main Entry Point
// アプリケーション開始位置
// ==========================================

import { readSuppliersFromCsv } from "./csv/csvReader";
import { validateSuppliers } from "./validation/supplierValidator";

/**
 * アプリケーションのメイン処理
 */
function main(): void {
    // Windows・macOS共通で動作するCSV Readerを使用します。
    const suppliers = readSuppliersFromCsv(
        "samples/supplier_master.csv"
    );

    // 読み込んだSupplierデータを検証します。
    const validationResult = validateSuppliers(suppliers);

    process.stdout.write(
        "Supplier Validation Summary\n"
    );

    process.stdout.write(
        "---------------------------\n"
    );

    process.stdout.write(
        `Total records: ${validationResult.totalRecords}\n`
    );

    process.stdout.write(
        `Valid records: ${validationResult.validRecords}\n`
    );

    process.stdout.write(
        `Invalid records: ${validationResult.invalidRecords}\n`
    );

    process.stdout.write(
        `Issues detected: ${validationResult.issues.length}\n`
    );

    // 問題がない場合は、ここで処理を終了します。
    if (validationResult.issues.length === 0) {
        process.stdout.write(
            "\nNo validation issues were detected.\n"
        );

        return;
    }

    process.stdout.write("\nValidation Issues\n");
    process.stdout.write("-----------------\n");

    // 将来はCSV形式のError Reportへ出力します。
    for (const issue of validationResult.issues) {
        process.stdout.write(
            [
                `Row ${issue.rowNumber}`,
                issue.rule,
                issue.field,
                issue.message
            ].join(" | ") + "\n"
        );
    }
}

main();
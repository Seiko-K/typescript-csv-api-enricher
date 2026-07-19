// ==========================================
// Main Entry Point
// アプリケーション開始位置
// ==========================================

import { readSuppliersFromCsv } from "./csv/csvReader";

/**
 * アプリケーションのメイン処理
 */
function main(): void {
    // プロジェクトルートを基準にサンプルCSVを読み込みます。
    // OS固有の絶対パスを利用者に入力させません。
    const suppliers = readSuppliersFromCsv(
        "samples/supplier_master.csv"
    );

    // 読み込んだ件数を表示します。
    // 将来的にはloggerへ置き換える予定です。
    process.stdout.write(
        `Suppliers loaded: ${suppliers.length}\n`
    );

    // 動作確認として仕入先名を表示します。
    for (const supplier of suppliers) {
        process.stdout.write(
            `- ${supplier.supplierId}: ${supplier.supplierName}\n`
        );
    }
}

main();
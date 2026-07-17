// ==========================================
// Main Entry Point
// アプリケーション開始位置
// ==========================================

// Supplier型を読み込む
import type { Supplier } from "./types/supplier";

// Supplier型に沿ったデータを作成
const supplier: Supplier = {

    // 仕入先ID
    supplierId: "SUP001",

    // 会社名
    supplierName: "OpenAI",

    // 国コード
    countryCode: "US",

    // メール
    email: "contact@example.com"
};

// 画面へ出力
// （将来はloggerへ置き換える予定）
process.stdout.write(
    `Supplier loaded: ${supplier.supplierName}\n`
);
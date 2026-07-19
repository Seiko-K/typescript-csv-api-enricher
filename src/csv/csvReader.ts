// ==========================================
// CSV Reader
// CSVファイルを読み込み、Supplier型へ変換する
// ==========================================

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parse } from "csv-parse/sync";

import type { Supplier } from "../types/supplier";

/**
 * CSV内の1行を表す内部用の型です。
 *
 * CSVを読み込んだ直後は、すべて文字列として扱います。
 * Excelでいうと、ワークシートから取得した加工前の1行に相当します。
 */
interface SupplierCsvRecord {
    supplierId: string;
    supplierName: string;
    countryCode: string;
    email: string;
}

/**
 * Supplier CSVを読み込み、Supplier配列として返します。
 *
 * @param relativeFilePath プロジェクトルートからの相対パス
 * @returns CSVから読み込んだSupplierデータ
 */
export function readSuppliersFromCsv(
    relativeFilePath: string
): Supplier[] {
    // process.cwd() は、プログラムを実行したフォルダを返します。
    // resolve() により、WindowsとmacOSのパス区切りの違いを吸収します。
    const absoluteFilePath = resolve(
        process.cwd(),
        relativeFilePath
    );

    // CSVファイルをUTF-8文字列として読み込みます。
    const csvContent = readFileSync(
        absoluteFilePath,
        "utf8"
    );

    // CSVのヘッダー名をキーとして、各行をオブジェクトへ変換します。
    const records = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true
    }) as SupplierCsvRecord[];

    // CSVの内部形式から、業務で使用するSupplier型へ変換します。
    return records.map((record) => ({
        supplierId: record.supplierId,
        supplierName: record.supplierName,
        countryCode: record.countryCode,
        email: record.email
    }));
}
// ==========================================
// Web Interface Controller
// Web画面・Validation Engine・CSV出力を接続する
// ==========================================

import { parse } from "csv-parse/browser/esm/sync";

import type { Supplier } from "../types/supplier";
import type { ValidationIssue } from "../types/validation";

import { validateSuppliers } from
    "../validation/supplierValidator";

/**
 * CSVパーサーが返す1行分のデータです。
 */
type CsvRecord = Record<string, string>;

/**
 * 最後に実行した検証結果を保持します。
 *
 * Exportボタンが押されたときに、
 * 画面に表示したものと同じ結果をCSVへ出力します。
 */
let latestValidationIssues: ValidationIssue[] = [];

/**
 * 最後に選択されたCSVファイル名を保持します。
 */
let latestSourceFileName = "";

/**
 * HTML要素を安全に取得します。
 */
function getElement<T extends Element>(
    selector: string
): T {
    const element = document.querySelector<T>(selector);

    if (!element) {
        throw new Error(
            `Required element was not found: ${selector}`
        );
    }

    return element;
}

// ==========================================
// HTML Elements
// ==========================================

const csvFileInput =
    getElement<HTMLInputElement>("#csv-file-input");

const selectedFileName =
    getElement<HTMLElement>("#selected-file-name");

const validateButton =
    getElement<HTMLButtonElement>("#validate-button");

const exportReportButton =
    getElement<HTMLButtonElement>(
        "#export-report-button"
    );

const applicationStatus =
    getElement<HTMLElement>("#application-status");

const totalRecordsElement =
    getElement<HTMLElement>("#total-records");

const validRecordsElement =
    getElement<HTMLElement>("#valid-records");

const invalidRecordsElement =
    getElement<HTMLElement>("#invalid-records");

const issuesDetectedElement =
    getElement<HTMLElement>("#issues-detected");

const issuesContainer =
    getElement<HTMLElement>("#issues-container");

/**
 * 選択されたファイルがCSVか確認します。
 */
function isCsvFile(file: File): boolean {
    const normalizedFileName =
        file.name.toLowerCase();

    return (
        normalizedFileName.endsWith(".csv") ||
        file.type === "text/csv"
    );
}

/**
 * CSVレコードから候補列名を探して値を返します。
 */
function getCsvValue(
    record: CsvRecord,
    candidateHeaders: string[]
): string {
    for (const header of candidateHeaders) {
        const value = record[header];

        if (value !== undefined) {
            return value;
        }
    }

    return "";
}

/**
 * CSVの1行をSupplier型へ変換します。
 */
function mapCsvRecordToSupplier(
    record: CsvRecord
): Supplier {
    return {
        supplierId: getCsvValue(
            record,
            [
                "supplier_id",
                "supplierId",
                "Supplier ID"
            ]
        ),

        supplierName: getCsvValue(
            record,
            [
                "supplier_name",
                "supplierName",
                "Supplier Name"
            ]
        ),

        countryCode: getCsvValue(
            record,
            [
                "country_code",
                "countryCode",
                "Country Code"
            ]
        ),

        email: getCsvValue(
            record,
            [
                "email",
                "Email",
                "Email Address"
            ]
        )
    };
}

/**
 * CSVテキストをSupplier配列へ変換します。
 */
function parseSupplierCsv(
    csvText: string
): Supplier[] {
    const records = parse(csvText, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        bom: true
    }) as CsvRecord[];

    return records.map(mapCsvRecordToSupplier);
}

/**
 * Summary表示を初期化します。
 */
function resetValidationSummary(): void {
    totalRecordsElement.textContent = "–";
    validRecordsElement.textContent = "–";
    invalidRecordsElement.textContent = "–";
    issuesDetectedElement.textContent = "–";
}

/**
 * Validation Issues表示を初期化します。
 */
function resetValidationIssues(): void {
    latestValidationIssues = [];
    latestSourceFileName = "";

    exportReportButton.disabled = true;

    issuesContainer.className = "empty-state";
    issuesContainer.replaceChildren();

    const title = document.createElement("p");
    title.className = "empty-state-title";
    title.textContent =
        "No validation has been executed.";

    const description = document.createElement("p");
    description.className =
        "empty-state-description";
    description.textContent =
        "Validation issues will appear here after " +
        "processing a supplier CSV file.";

    issuesContainer.append(title, description);
}

/**
 * 1件のValidation Issueをカードへ変換します。
 */
function createIssueCard(
    issue: ValidationIssue
): HTMLElement {
    const card = document.createElement("article");
    card.className = "issue-card";

    const heading = document.createElement("div");
    heading.className = "issue-heading";

    const rowLabel = document.createElement("strong");
    rowLabel.className = "issue-row";
    rowLabel.textContent = `Row ${issue.rowNumber}`;

    const ruleLabel = document.createElement("span");
    ruleLabel.className = "issue-rule";
    ruleLabel.textContent = issue.rule;

    heading.append(rowLabel, ruleLabel);

    const message = document.createElement("p");
    message.className = "issue-message";
    message.textContent = issue.message;

    const details = document.createElement("p");
    details.className = "issue-details";

    const supplierDisplay =
        issue.supplierId.trim().length > 0
            ? issue.supplierId
            : "Not provided";

    details.textContent =
        `Field: ${issue.field} · ` +
        `Supplier ID: ${supplierDisplay}`;

    card.append(heading, message, details);

    return card;
}

/**
 * 検証エラーを画面へ表示します。
 */
function renderValidationIssues(
    issues: ValidationIssue[]
): void {
    issuesContainer.replaceChildren();

    if (issues.length === 0) {
        issuesContainer.className =
            "empty-state success-state";

        const title = document.createElement("p");
        title.className = "empty-state-title";
        title.textContent =
            "No validation issues were detected.";

        const description =
            document.createElement("p");

        description.className =
            "empty-state-description";

        description.textContent =
            "All supplier records passed the current rules.";

        issuesContainer.append(title, description);

        return;
    }

    issuesContainer.className = "issue-list";

    for (const issue of issues) {
        issuesContainer.append(
            createIssueCard(issue)
        );
    }
}

/**
 * CSVセルとして安全な文字列へ変換します。
 *
 * カンマ・改行・ダブルクォートを含む値は、
 * ダブルクォートで囲みます。
 */
function escapeCsvValue(value: string): string {
    const escapedValue =
        value.replaceAll("\"", "\"\"");

    const requiresQuotes =
        escapedValue.includes(",") ||
        escapedValue.includes("\n") ||
        escapedValue.includes("\r") ||
        escapedValue.includes("\"");

    return requiresQuotes
        ? `"${escapedValue}"`
        : escapedValue;
}

/**
 * Validation Issue一覧からCSVテキストを生成します。
 *
 * 改行コードはWindows・macOSのExcelで扱いやすい
 * CRLF形式を使用します。
 */
function createValidationReportCsv(
    issues: ValidationIssue[]
): string {
    const header = [
        "Row",
        "Rule",
        "Field",
        "Supplier ID",
        "Message"
    ];

    const rows = issues.map((issue) => [
        String(issue.rowNumber),
        issue.rule,
        issue.field,
        issue.supplierId,
        issue.message
    ]);

    return [header, ...rows]
        .map((row) =>
            row
                .map(escapeCsvValue)
                .join(",")
        )
        .join("\r\n");
}

/**
 * 現在日付をYYYY-MM-DD形式で返します。
 */
function getCurrentDateText(): string {
    const currentDate = new Date();

    const year = currentDate.getFullYear();

    const month = String(
        currentDate.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
        currentDate.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

/**
 * 元CSVの拡張子を除いたファイル名を返します。
 */
function getBaseFileName(fileName: string): string {
    return fileName.replace(/\.csv$/i, "");
}

/**
 * Validation ReportをCSVファイルとして保存します。
 *
 * ブラウザ標準のダウンロード機能を利用するため、
 * Windows・macOSで同じ処理を使用できます。
 */
function exportValidationReport(): void {
    if (latestValidationIssues.length === 0) {
        return;
    }

    const csvContent = createValidationReportCsv(
        latestValidationIssues
    );

    // UTF-8 BOMを追加し、Excelでの文字化けを抑えます。
    const utf8Bom = "\uFEFF";

    const reportBlob = new Blob(
        [utf8Bom, csvContent],
        {
            type: "text/csv;charset=utf-8"
        }
    );

    const downloadUrl =
        URL.createObjectURL(reportBlob);

    const downloadLink =
        document.createElement("a");

    const sourceBaseName =
        getBaseFileName(latestSourceFileName);

    const reportFileName =
        `${sourceBaseName}_validation_report_` +
        `${getCurrentDateText()}.csv`;

    downloadLink.href = downloadUrl;
    downloadLink.download = reportFileName;

    document.body.append(downloadLink);
    downloadLink.click();
    downloadLink.remove();

    URL.revokeObjectURL(downloadUrl);

    applicationStatus.textContent =
        `${reportFileName} was exported successfully.`;
}

/**
 * ファイル選択時の処理です。
 */
function handleFileSelection(): void {
    const selectedFile =
        csvFileInput.files?.[0];

    resetValidationSummary();
    resetValidationIssues();

    if (!selectedFile) {
        selectedFileName.textContent =
            "No file selected";

        validateButton.disabled = true;

        applicationStatus.textContent =
            "Select a CSV file to begin.";

        return;
    }

    selectedFileName.textContent =
        selectedFile.name;

    if (!isCsvFile(selectedFile)) {
        validateButton.disabled = true;

        applicationStatus.textContent =
            "Please select a file with the .csv extension.";

        return;
    }

    validateButton.disabled = false;

    applicationStatus.textContent =
        "The CSV file is ready for validation.";
}

/**
 * CSV読込と検証を実行します。
 */
async function handleValidationRequest(): Promise<void> {
    const selectedFile =
        csvFileInput.files?.[0];

    if (!selectedFile) {
        return;
    }

    validateButton.disabled = true;
    exportReportButton.disabled = true;

    applicationStatus.textContent =
        "Validating supplier data...";

    try {
        const csvText = await selectedFile.text();

        const suppliers =
            parseSupplierCsv(csvText);

        const validationResult =
            validateSuppliers(suppliers);

        totalRecordsElement.textContent =
            String(validationResult.totalRecords);

        validRecordsElement.textContent =
            String(validationResult.validRecords);

        invalidRecordsElement.textContent =
            String(validationResult.invalidRecords);

        issuesDetectedElement.textContent =
            String(validationResult.issues.length);

        renderValidationIssues(
            validationResult.issues
        );

        latestValidationIssues = [
            ...validationResult.issues
        ];

        latestSourceFileName =
            selectedFile.name;

        // エラーがある場合だけレポート出力を有効にします。
        exportReportButton.disabled =
            validationResult.issues.length === 0;

        applicationStatus.textContent =
            `${selectedFile.name} was validated successfully.`;
    } catch (error: unknown) {
        resetValidationSummary();
        resetValidationIssues();

        issuesContainer.className = "empty-state";
        issuesContainer.replaceChildren();

        const title = document.createElement("p");
        title.className = "empty-state-title";
        title.textContent =
            "The CSV file could not be validated.";

        const description =
            document.createElement("p");

        description.className =
            "empty-state-description";

        description.textContent =
            error instanceof Error
                ? error.message
                : "An unexpected error occurred.";

        issuesContainer.append(title, description);

        applicationStatus.textContent =
            "Please confirm the CSV format and try again.";
    } finally {
        validateButton.disabled = false;
    }
}

// ==========================================
// Event Connections
// ==========================================

csvFileInput.addEventListener(
    "change",
    handleFileSelection
);

validateButton.addEventListener(
    "click",
    () => {
        void handleValidationRequest();
    }
);

exportReportButton.addEventListener(
    "click",
    exportValidationReport
);
// ==========================================
// Web Interface Controller
// Web画面と既存のValidation Engineを接続する
// ==========================================

import { parse } from "csv-parse/browser/esm/sync";

import type { Supplier } from "../types/supplier";
import type { ValidationIssue } from "../types/validation";

import { validateSuppliers } from
    "../validation/supplierValidator";

/**
 * CSVパーサーが返す1行分のデータです。
 *
 * CSVの列名は文字列として取得されるため、
 * キーと値をどちらもstringとして扱います。
 */
type CsvRecord = Record<string, string>;

/**
 * 指定したセレクターのHTML要素を取得します。
 *
 * 要素が見つからない場合は早い段階でエラーにし、
 * HTMLとTypeScriptの不一致を発見しやすくします。
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
// 画面上の各要素を取得する
// ==========================================

const csvFileInput =
    getElement<HTMLInputElement>("#csv-file-input");

const selectedFileName =
    getElement<HTMLElement>("#selected-file-name");

const validateButton =
    getElement<HTMLButtonElement>("#validate-button");

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
 * 選択されたファイルがCSVかどうかを確認します。
 *
 * OSやブラウザによってMIME Typeが空になる場合があるため、
 * ファイル名の拡張子も併せて確認します。
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
 * CSVレコードから、候補となる列名を順番に探します。
 *
 * 現在のサンプルCSVだけでなく、
 * snake_case、camelCase、表示名形式にも対応します。
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
 * CSVの1行をSupplierモデルへ変換します。
 *
 * Excelでいうと、読み込んだ列を
 * システム内部の標準列へ対応付ける処理です。
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
 * Summary表示を初期状態へ戻します。
 */
function resetValidationSummary(): void {
    totalRecordsElement.textContent = "–";
    validRecordsElement.textContent = "–";
    invalidRecordsElement.textContent = "–";
    issuesDetectedElement.textContent = "–";
}

/**
 * Validation Issues表示を初期状態へ戻します。
 */
function resetValidationIssues(): void {
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
 * 1件のValidation Issueを画面表示用のカードへ変換します。
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
 * 検証エラーの一覧を画面へ表示します。
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
 * ファイルが選択されたときの画面状態を更新します。
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
 * Validateボタンが押されたときに、
 * CSVの読み込みとSupplier検証を実行します。
 */
async function handleValidationRequest(): Promise<void> {
    const selectedFile =
        csvFileInput.files?.[0];

    if (!selectedFile) {
        return;
    }

    validateButton.disabled = true;

    applicationStatus.textContent =
        "Validating supplier data...";

    try {
        // ブラウザ標準機能で選択されたCSVを読み込みます。
        const csvText = await selectedFile.text();

        // CSVをSupplierモデルへ変換します。
        const suppliers =
            parseSupplierCsv(csvText);

        // CLIでも使用している既存のValidation Engineを実行します。
        const validationResult =
            validateSuppliers(suppliers);

        // Summaryカードを更新します。
        totalRecordsElement.textContent =
            String(validationResult.totalRecords);

        validRecordsElement.textContent =
            String(validationResult.validRecords);

        invalidRecordsElement.textContent =
            String(validationResult.invalidRecords);

        issuesDetectedElement.textContent =
            String(validationResult.issues.length);

        // 個別エラーを画面へ表示します。
        renderValidationIssues(
            validationResult.issues
        );

        applicationStatus.textContent =
            `${selectedFile.name} was validated successfully.`;
    } catch (error: unknown) {
        resetValidationSummary();

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

// ファイル選択とボタン操作を各処理へ接続します。
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
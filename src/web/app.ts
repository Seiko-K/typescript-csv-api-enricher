// ==========================================
// Web Interface Controller
// Validation・Country API・CSV出力を接続する
// ==========================================

import { parse } from "csv-parse/browser/esm/sync";

import type { CountryInformation } from
    "../types/country";

import type { EnrichedSupplier } from
    "../types/enrichedSupplier";

import type { Supplier } from
    "../types/supplier";

import type { ValidationIssue } from
    "../types/validation";

import { validateSuppliers } from
    "../validation/supplierValidator";

type CsvRecord = Record<string, string>;

let latestSuppliers: Supplier[] = [];
let latestValidationIssues: ValidationIssue[] = [];
let latestEnrichedSuppliers: EnrichedSupplier[] = [];
let latestSourceFileName = "";

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

const enrichButton =
    getElement<HTMLButtonElement>("#enrich-button");

const exportEnrichedButton =
    getElement<HTMLButtonElement>(
        "#export-enriched-button"
    );

const applicationStatus =
    getElement<HTMLElement>("#application-status");

const enrichmentStatus =
    getElement<HTMLElement>("#enrichment-status");

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

function isCsvFile(file: File): boolean {
    const normalizedFileName =
        file.name.toLowerCase();

    return (
        normalizedFileName.endsWith(".csv") ||
        file.type === "text/csv"
    );
}

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

function mapCsvRecordToSupplier(
    record: CsvRecord
): Supplier {
    return {
        supplierId: getCsvValue(
            record,
            ["supplier_id", "supplierId", "Supplier ID"]
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
            ["email", "Email", "Email Address"]
        )
    };
}

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

function resetValidationSummary(): void {
    totalRecordsElement.textContent = "–";
    validRecordsElement.textContent = "–";
    invalidRecordsElement.textContent = "–";
    issuesDetectedElement.textContent = "–";
}

function resetValidationIssues(): void {
    latestValidationIssues = [];

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

function resetEnrichment(): void {
    latestEnrichedSuppliers = [];

    enrichButton.disabled = true;
    exportEnrichedButton.disabled = true;

    enrichmentStatus.textContent =
        "Validate a supplier CSV before enrichment.";
}

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

function createCsvText(
    rows: string[][]
): string {
    return rows
        .map((row) =>
            row
                .map(escapeCsvValue)
                .join(",")
        )
        .join("\r\n");
}

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

function getBaseFileName(fileName: string): string {
    return fileName.replace(/\.csv$/i, "");
}

function downloadCsv(
    csvContent: string,
    fileName: string
): void {
    const utf8Bom = "\uFEFF";

    const csvBlob = new Blob(
        [utf8Bom, csvContent],
        {
            type: "text/csv;charset=utf-8"
        }
    );

    const downloadUrl =
        URL.createObjectURL(csvBlob);

    const downloadLink =
        document.createElement("a");

    downloadLink.href = downloadUrl;
    downloadLink.download = fileName;

    document.body.append(downloadLink);
    downloadLink.click();
    downloadLink.remove();

    URL.revokeObjectURL(downloadUrl);
}

function exportValidationReport(): void {
    if (latestValidationIssues.length === 0) {
        return;
    }

    const rows = [
        [
            "Row",
            "Rule",
            "Field",
            "Supplier ID",
            "Message"
        ],

        ...latestValidationIssues.map(
            (issue) => [
                String(issue.rowNumber),
                issue.rule,
                issue.field,
                issue.supplierId,
                issue.message
            ]
        )
    ];

    const reportFileName =
        `${getBaseFileName(latestSourceFileName)}` +
        `_validation_report_` +
        `${getCurrentDateText()}.csv`;

    downloadCsv(
        createCsvText(rows),
        reportFileName
    );

    applicationStatus.textContent =
        `${reportFileName} was exported successfully.`;
}

/**
 * 自分たちのNode.jsサーバーから国情報を取得します。
 */
async function fetchCountryInformation(
    countryCode: string
): Promise<CountryInformation> {
    const normalizedCountryCode =
        countryCode.trim().toUpperCase();

    const response = await fetch(
        `/api/countries/` +
        encodeURIComponent(normalizedCountryCode)
    );

    if (!response.ok) {
        throw new Error(
            `Country information could not be retrieved: ` +
            normalizedCountryCode
        );
    }

    return await response.json() as CountryInformation;
}

/**
 * 1件のSupplierへ国情報を追加します。
 */
async function enrichSupplier(
    supplier: Supplier
): Promise<EnrichedSupplier> {
    const normalizedCountryCode =
        supplier.countryCode.trim().toUpperCase();

    if (!/^[A-Z]{2}$/.test(normalizedCountryCode)) {
        return {
            ...supplier,
            countryName: "",
            region: "",
            incomeLevel: "",
            capitalCity: "",
            longitude: null,
            latitude: null,
            enrichmentStatus:
                "SKIPPED_INVALID_COUNTRY_CODE"
        };
    }

    try {
        const countryInformation =
            await fetchCountryInformation(
                normalizedCountryCode
            );

        return {
            ...supplier,
            countryCode:
                countryInformation.countryCode,
            countryName:
                countryInformation.countryName,
            region:
                countryInformation.region,
            incomeLevel:
                countryInformation.incomeLevel,
            capitalCity:
                countryInformation.capitalCity,
            longitude:
                countryInformation.longitude,
            latitude:
                countryInformation.latitude,
            enrichmentStatus: "ENRICHED"
        };
    } catch {
        return {
            ...supplier,
            countryName: "",
            region: "",
            incomeLevel: "",
            capitalCity: "",
            longitude: null,
            latitude: null,
            enrichmentStatus: "API_ERROR"
        };
    }
}

/**
 * Supplier全件へ国情報を追加します。
 */
async function enrichSupplierData(): Promise<void> {
    if (latestSuppliers.length === 0) {
        return;
    }

    enrichButton.disabled = true;
    exportEnrichedButton.disabled = true;

    enrichmentStatus.textContent =
        "Retrieving country information...";

    try {
        latestEnrichedSuppliers =
            await Promise.all(
                latestSuppliers.map(enrichSupplier)
            );

        const enrichedCount =
            latestEnrichedSuppliers.filter(
                (supplier) =>
                    supplier.enrichmentStatus ===
                    "ENRICHED"
            ).length;

        const skippedCount =
            latestEnrichedSuppliers.length -
            enrichedCount;

        exportEnrichedButton.disabled = false;

        enrichmentStatus.textContent =
            `${enrichedCount} supplier records were enriched. ` +
            `${skippedCount} records were skipped or failed.`;
    } catch (error: unknown) {
        latestEnrichedSuppliers = [];

        enrichmentStatus.textContent =
            error instanceof Error
                ? error.message
                : "Country data enrichment failed.";
    } finally {
        enrichButton.disabled = false;
    }
}

function exportEnrichedCsv(): void {
    if (latestEnrichedSuppliers.length === 0) {
        return;
    }

    const rows = [
        [
            "supplierId",
            "supplierName",
            "countryCode",
            "email",
            "countryName",
            "region",
            "incomeLevel",
            "capitalCity",
            "longitude",
            "latitude",
            "enrichmentStatus"
        ],

        ...latestEnrichedSuppliers.map(
            (supplier) => [
                supplier.supplierId,
                supplier.supplierName,
                supplier.countryCode,
                supplier.email,
                supplier.countryName,
                supplier.region,
                supplier.incomeLevel,
                supplier.capitalCity,
                supplier.longitude === null
                    ? ""
                    : String(supplier.longitude),
                supplier.latitude === null
                    ? ""
                    : String(supplier.latitude),
                supplier.enrichmentStatus
            ]
        )
    ];

    const enrichedFileName =
        `${getBaseFileName(latestSourceFileName)}` +
        `_enriched_` +
        `${getCurrentDateText()}.csv`;

    downloadCsv(
        createCsvText(rows),
        enrichedFileName
    );

    enrichmentStatus.textContent =
        `${enrichedFileName} was exported successfully.`;
}

function handleFileSelection(): void {
    const selectedFile =
        csvFileInput.files?.[0];

    latestSuppliers = [];
    latestSourceFileName = "";

    resetValidationSummary();
    resetValidationIssues();
    resetEnrichment();

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
        const csvText = await selectedFile.text();

        const suppliers =
            parseSupplierCsv(csvText);

        const validationResult =
            validateSuppliers(suppliers);

        latestSuppliers = suppliers;
        latestSourceFileName = selectedFile.name;

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

        exportReportButton.disabled =
            validationResult.issues.length === 0;

        enrichButton.disabled =
            suppliers.length === 0;

        enrichmentStatus.textContent =
            "Supplier data is ready for country enrichment.";

        applicationStatus.textContent =
            `${selectedFile.name} was validated successfully.`;
    } catch (error: unknown) {
        latestSuppliers = [];

        resetValidationSummary();
        resetValidationIssues();
        resetEnrichment();

        applicationStatus.textContent =
            error instanceof Error
                ? error.message
                : "The CSV file could not be validated.";
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

enrichButton.addEventListener(
    "click",
    () => {
        void enrichSupplierData();
    }
);

exportEnrichedButton.addEventListener(
    "click",
    exportEnrichedCsv
);
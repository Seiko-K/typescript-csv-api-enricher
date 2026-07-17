![Version](https://img.shields.io/badge/version-v0.1-blue)
![Status](https://img.shields.io/badge/status-active-success)
![License](https://img.shields.io/badge/license-MIT-green)
![TypeScript](https://img.shields.io/badge/TypeScript-7.0-blue)
![Node.js](https://img.shields.io/badge/Node.js-24.18-green)
![Feature](https://img.shields.io/badge/feature-CSV_API_Enrichment-orange)

# TypeScript CSV API Enricher

Business-oriented TypeScript toolkit for CSV validation, API integration, and data enrichment.

Built for operations teams that need to process business master data safely, detect data-quality issues, enrich records through external APIs, and generate reusable output files and reports.

---

## Architecture

<p align="center">
  <img src="images/architecture.svg" width="900" alt="TypeScript CSV API Enricher Architecture">
</p>

---

## Features

### Current

✓ TypeScript and Node.js project foundation

✓ Supplier data model

✓ Structured source-code architecture

✓ Sample supplier master CSV

✓ TypeScript strict mode

✓ NodeNext module configuration

✓ Git and GitHub development workflow

### Planned

- CSV import
- CSV export
- Required-value validation
- Duplicate supplier detection
- Country-code validation
- Email validation
- External country API integration
- JSON response parsing
- Data enrichment
- Error report generation
- Processing summary
- Elapsed-time logging

---

## Use Cases

### Supplier Master Validation

- Detect missing supplier information
- Identify duplicate supplier IDs
- Validate country codes
- Validate email formats
- Prepare supplier data for system migration

### Procurement Operations

- Enrich supplier data with country information
- Standardize procurement master records
- Generate reusable validation reports
- Reduce manual spreadsheet checking

### Data Migration

- Validate CSV files before import
- Identify incomplete or malformed records
- Separate valid and invalid data
- Generate clear error reports for correction

### Back-office Automation

- Replace repetitive spreadsheet checks
- Create repeatable data-processing workflows
- Produce standardized CSV and JSON outputs
- Maintain processing history and summaries

---

## Workflow

```text
Supplier CSV
      │
      ▼
CSV Import
      │
      ▼
Supplier Data Model
      │
      ▼
Validation Engine
      │
      ├── Required Value Validation
      ├── Duplicate Detection
      ├── Country Code Validation
      └── Email Validation
      │
      ▼
External API
      │
      ▼
Data Enrichment
      │
      ▼
CSV / JSON Export
      │
      ▼
Error and Summary Reports
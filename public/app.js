// ==========================================
// Web Interface Controller
// Web画面の操作を管理する
// ==========================================

const csvFileInput =
    document.querySelector("#csv-file-input");

const selectedFileName =
    document.querySelector("#selected-file-name");

const validateButton =
    document.querySelector("#validate-button");

const applicationStatus =
    document.querySelector("#application-status");

/**
 * 選択されたファイルがCSVかどうかを確認します。
 *
 * ブラウザやOSによってMIME Typeが空になる場合があるため、
 * ファイル拡張子も併せて確認します。
 */
function isCsvFile(file) {
    const fileName = file.name.toLowerCase();

    return (
        fileName.endsWith(".csv") ||
        file.type === "text/csv"
    );
}

/**
 * ファイルが選択されたときの画面状態を更新します。
 */
function handleFileSelection() {
    const selectedFile = csvFileInput.files[0];

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
 * Validateボタンが押されたときの処理です。
 *
 * 現時点ではWeb UIの動作確認までを行います。
 * 次の開発で既存のValidation Engineと接続します。
 */
function handleValidationRequest() {
    const selectedFile = csvFileInput.files[0];

    if (!selectedFile) {
        return;
    }

    applicationStatus.textContent =
        `${selectedFile.name} was received successfully. ` +
        "The validation engine will be connected next.";
}

// ファイル選択とボタン操作を、それぞれの処理へ接続します。
csvFileInput.addEventListener(
    "change",
    handleFileSelection
);

validateButton.addEventListener(
    "click",
    handleValidationRequest
);
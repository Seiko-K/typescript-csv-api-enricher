// ==========================================
// Supplier Data Model
// 業務で扱う仕入先データの型定義
// ==========================================

// export
// 他のファイルから利用できるように公開する
export interface Supplier {

    // 一意の仕入先ID
    supplierId: string;

    // 仕入先名
    supplierName: string;

    // 国コード（ISO 3166-1 Alpha-2）
    countryCode: string;

    // メールアドレス
    email: string;
}
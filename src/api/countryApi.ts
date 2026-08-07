// ==========================================
// Country API Client
// World Bank APIから国情報を取得する
// ==========================================

import type {
    CountryInformation
} from "../types/country";

/**
 * World Bank API内の分類情報です。
 */
interface WorldBankClassification {
    id: string;
    iso2code: string;
    value: string;
}

/**
 * World Bank APIが返す国データです。
 *
 * 外部APIの形式はこのファイル内だけで扱い、
 * アプリ内部へ直接広げないようにします。
 */
interface WorldBankCountryRecord {
    id: string;
    iso2Code: string;
    name: string;

    region: WorldBankClassification;
    incomeLevel: WorldBankClassification;

    capitalCity: string;
    longitude: string;
    latitude: string;
}

/**
 * World Bank APIのレスポンス形式です。
 *
 * 1番目の配列要素はページ情報、
 * 2番目の配列要素は国データ一覧です。
 */
type WorldBankCountryResponse = [
    unknown,
    WorldBankCountryRecord[]
];

/**
 * APIの文字列座標をnumberまたはnullへ変換します。
 */
function parseCoordinate(
    value: string
): number | null {
    if (value.trim().length === 0) {
        return null;
    }

    const parsedValue = Number(value);

    return Number.isFinite(parsedValue)
        ? parsedValue
        : null;
}

/**
 * ISO 2文字国コードから国情報を取得します。
 *
 * @param countryCode ISO 3166-1 alpha-2国コード
 * @returns アプリ内で使用する標準化済み国情報
 */
export async function fetchCountryInformation(
    countryCode: string
): Promise<CountryInformation> {
    const normalizedCountryCode =
        countryCode.trim().toUpperCase();

    if (!/^[A-Z]{2}$/.test(normalizedCountryCode)) {
        throw new Error(
            `Invalid country code: ${countryCode}`
        );
    }

    const requestUrl =
        "https://api.worldbank.org/v2/country/" +
        `${encodeURIComponent(normalizedCountryCode)}` +
        "?format=json";

    const response = await fetch(requestUrl, {
        headers: {
            Accept: "application/json"
        }
    });

    if (!response.ok) {
        throw new Error(
            `Country API request failed with status ` +
            `${response.status}.`
        );
    }

    const responseData =
        await response.json() as WorldBankCountryResponse;

    const countryRecord = responseData[1]?.[0];

    if (!countryRecord) {
        throw new Error(
            `Country information was not found: ` +
            normalizedCountryCode
        );
    }

    return {
        countryCode: countryRecord.iso2Code,
        countryName: countryRecord.name,
        region: countryRecord.region.value,
        incomeLevel:
            countryRecord.incomeLevel.value,
        capitalCity: countryRecord.capitalCity,
        longitude:
            parseCoordinate(countryRecord.longitude),
        latitude:
            parseCoordinate(countryRecord.latitude)
    };
}
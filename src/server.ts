// ==========================================
// Application Server
// Web UIとCountry APIを提供するNode.jsサーバー
// ==========================================

import express from "express";
import { resolve } from "node:path";

import {
    fetchCountryInformation
} from "./api/countryApi";

/**
 * サーバー設定
 */
const application = express();
const port = 3000;

/**
 * publicフォルダーをWeb UIとして公開します。
 *
 * resolve()を使うことで、
 * WindowsとmacOSのパス差異を内部で吸収します。
 */
const publicDirectoryPath = resolve(
    process.cwd(),
    "public"
);

application.use(
    express.static(publicDirectoryPath)
);

/**
 * ISO 2文字国コードから国情報を返します。
 *
 * 例：
 * GET /api/countries/US
 */
application.get(
    "/api/countries/:countryCode",
    async (request, response) => {
        try {
            const countryInformation =
                await fetchCountryInformation(
                    request.params.countryCode
                );

            response.json(countryInformation);
        } catch (error: unknown) {
            const message =
                error instanceof Error
                    ? error.message
                    : "An unexpected error occurred.";

            response.status(400).json({
                error: message
            });
        }
    }
);

/**
 * Node.jsサーバーを起動します。
 */
application.listen(port, () => {
    process.stdout.write(
        "Business Data Processing Toolkit started.\n"
    );

    process.stdout.write(
        `Open http://localhost:${port}\n`
    );
});
export { loadKangxiConfig, type KangxiConfig } from "./shared/config.js";
export { createKangxiDatabase, type KangxiDatabase } from "./shared/database.js";
export { parseCharacterPage, parseIndexPage, parseScanPage } from "./characters/parser.js";
export { ValidationService } from "./validation/validation.service.js";
export { UnihanService, type UnihanImportOptions, type UnihanImportSummary } from "./reference/unihan.service.js";

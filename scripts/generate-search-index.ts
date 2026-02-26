import { fileURLToPath } from 'url';
import path from "path";
import fs from "fs";

import { PROFILE_SEARCH_INDEX } from "@/scripts/pages/profile.search";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

fs.writeFileSync(
    path.join(__dirname, "../public/search-index/profile.json"),
    JSON.stringify(PROFILE_SEARCH_INDEX, null, 2)
);
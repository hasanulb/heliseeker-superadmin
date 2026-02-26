import { IIndexInput, ISearchIndexItem, PROFILE_SEARCH_KEYS, SelectorTypeEnum } from "./types";

export function highlightCharacters(text: string, query: string) {
    if (!query) return text;
    const regex = new RegExp(`(${query})`, "gi");
    const parts = text.split(regex);
    return parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
            <mark key={i} className="search-highlight blink-once">{part}</mark>
        ) : (
            <span key={i}>{part}</span>
        )
    );
}

// Helper to generate unique id
function makeId(page: string, key: string) {
    // Remove leading slash, replace / with -, replace dots with dashes
    const pageName = page.replace(/^\//, "").replace(/\//g, "-");
    const keyName = key.replace(/\./g, "-");
    return `${pageName}-${keyName}`;
}

/**
 * Create a search index for a page
 * @param {Array<{key: string, value: string, selectorType?: 'id' | 'label'}>} indexStrings
 * @param {string} page
 */
export function createProfileSearchIndex(indexStrings: IIndexInput[], page: string) {
    return indexStrings.map(({ key, value, selectorType = SelectorTypeEnum.label }) => {
        const id = makeId(page, key);
        let selector;
        if (selectorType === SelectorTypeEnum.id) {
            selector = `#${id}`;
        } else {
            selector = `label[for='${id}']`;
        }
        return { key, value, selector, page, id };
    });
}

export function getId(key: PROFILE_SEARCH_KEYS, SEARCH_INDEX: ISearchIndexItem[]) {
    const item = SEARCH_INDEX.find(i => i.key === key);
    return item ? item.id : undefined;
}

// Highlight and scroll to the element with the id of the highlightKey
export function highlightAndScroll(highlightKey: PROFILE_SEARCH_KEYS, SEARCH_INDEX: ISearchIndexItem[]) {
    if (highlightKey) {
        const id = getId(highlightKey, SEARCH_INDEX);
        if (id) {
            const el = document.getElementById(id);
            if (el) {
                el.scrollIntoView({ behavior: "smooth", block: "center" });
            }
        }
    }
    // Stop highlighting after 2 seconds
    setTimeout(() => {
        const url = new URL(window.location.href);
        url.searchParams.delete("highlight");
        url.searchParams.delete("q");
        window.history.replaceState({}, "", url.toString());
    }, 3000);
}

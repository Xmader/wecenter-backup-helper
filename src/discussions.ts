
import { JSDOM } from "jsdom"
import { Item, Options, fetchReq, saveJson, formatContents, formatInt } from "./utils"
import { parseUid } from "./postlike"

const ITEM_CLASS = "aw-item"
const ITEMS_PER_PAGE = 100

const CONTENT_CLASS = "markitup-box"

export type ParentType = "question" | "answer"

export interface QuestionDiscussion extends Item<"question_discussion", "question"> { }
export interface AnswerDiscussion extends Item<"answer_discussion", "answer"> { }
export type Discussion = QuestionDiscussion | AnswerDiscussion


const buildReqUrl = (siteUrl: string, parentType: ParentType, parentId: number, page: number = 1) => {
    return `${siteUrl}/question/info/${parentType}_discussions/parent_id-${parentId}__page-${page}`
}

const parseItem = (item: HTMLElement) => {
    const contentDiv = item.getElementsByClassName(CONTENT_CLASS)[0] as HTMLElement

    // https://github.com/pincong/pincong-wecenter/blob/master/views/default/question/question_discussions_template.tpl.htm#L33
    const m = item.children[0].children
    const dateEl = m[m.length - 1] as HTMLSpanElement

    return {
        id: formatInt(item.dataset.itemId),
        uid: parseUid(item),
        date: dateEl.textContent!,
        contents: formatContents(contentDiv),
    }
}

// 3 overload function signatures
export function fetchDiscussionsIt (parentType: "question", parentId: number, options: Options): AsyncGenerator<QuestionDiscussion>
export function fetchDiscussionsIt (parentType: "answer", parentId: number, options: Options): AsyncGenerator<AnswerDiscussion>
export function fetchDiscussionsIt (parentType: ParentType, parentId: number, options: Options): AsyncGenerator<Discussion>
// the actual function
export async function* fetchDiscussionsIt (parentType: ParentType, parentId: number, options: Options) {
    for (let page = 1; ; page++) {
        const url = buildReqUrl(options.siteUrl, parentType, parentId, page)
        const r = await fetchReq(url, options)
        const html = await r.text()

        // the response data is a html fragment in the shape of 
        // `<div class="aw-item">...</div> <div class="aw-item">...</div> ...`
        const fragment = JSDOM.fragment(html)

        for (const item of fragment.children) {
            // check its type
            if (!item.classList.contains(ITEM_CLASS)) { continue }

            const entry: Discussion = {
                type: `${parentType}_discussion` as any,
                ...parseItem(item as HTMLDivElement),
                parentType: parentType as any,
                parentId,
            }
            yield entry
        }

        const size = fragment.children.length
        if (options.checkPagination) {
            const maxPerPage = options.itemsPerPage || ITEMS_PER_PAGE
            if (size < maxPerPage) {
                // the number of items is less than the maximum number of items per page, so no need to fetch the next page
                return
            }
        } else if (size == 0) {
            return
        }
    }
}

export const saveDiscussionsIt = async function* (parentType: ParentType, parentId: number, options: Options) {
    for await (const d of fetchDiscussionsIt(parentType, parentId, options)) {
        yield saveJson(`${parentId}/${d.id}`, d, options)
    }
}

export const saveDiscussions = async (parentType: ParentType, parentId: number, options: Options) => {
    const it = saveDiscussionsIt(parentType, parentId, options)
    // eslint-disable-next-line
    for await (const _ of it) { }
}


import { JSDOM } from "jsdom"
import { Item, PostType, ReplyTypeMap, Options, fetchReq, saveItemJson, formatInt } from "./utils"
import { PostLike, parsePostLike, parseUid } from "./postlike"
import { fetchDiscussionsIt } from "./discussions"

const TAG_SELECTOR = ".aw-topic-bar .topic-tag"
const AUTHOR_SELECTOR = ".aw-side-bar .aw-user-name"
const MAIN_EL_SELECTOR = ".aw-question-detail"
const TITLE_SELECTOR = ".mod-head > h1"

const REPLIES_SELECTOR = ".aw-feed-list > .aw-item"
const ITEMS_PER_PAGE = 100

type TopicId = number

export interface Post<T extends PostType> extends Item<T>, PostLike {
    title: string;
    topics: TopicId[]; // tags
}

export interface Reply<PT extends PostType> extends Item<typeof ReplyTypeMap[PT], PT>, PostLike { }

const buildReqUrl = (siteUrl: string, postType: PostType, postId: number, page: number = 1) => {
    return `${siteUrl}/${postType}/id-${postId}__page-${page}`
}

const parsePost = <T extends PostType> (postType: T, postId: number, doc: ParentNode): Post<T> => {
    const mainEl = doc.querySelector(MAIN_EL_SELECTOR)!

    const tagEls = [...doc.querySelectorAll(TAG_SELECTOR)]
    const topics = tagEls.map(el => {
        const topicId = (el as HTMLElement).dataset.id
        if (topicId) {
            return formatInt(topicId)
        }
    }).filter(Boolean) as number[]

    const userEl = doc.querySelector(AUTHOR_SELECTOR) as HTMLElement
    const uid = formatInt(userEl.dataset.id)

    const titleEl = mainEl.querySelector(TITLE_SELECTOR)!
    const title = titleEl.textContent!.trim()

    return {
        type: postType,
        id: postId,
        title,
        uid,
        topics,
        ...parsePostLike(mainEl)
    }
}

const parseReply = <PT extends PostType> (postType: PT, postId: number, itemEl: HTMLElement): Reply<PT> => {
    return {
        type: ReplyTypeMap[postType],
        id: formatInt(itemEl.dataset.itemId),
        parentType: postType,
        parentId: postId,
        uid: parseUid(itemEl),
        ...parsePostLike(itemEl)
    }
}


export async function* fetchPostIt<T extends PostType> (postType: T, postId: number, options: Options) {
    for (let page = 1; ; page++) {
        const url = buildReqUrl(options.siteUrl, postType, postId, page)
        const r = await fetchReq(url, options)
        const html = await r.text()

        const doc = JSDOM.fragment(html)
        if (page == 1) {  // only emit `parsePost` on the first page (1-based index)
            yield parsePost(postType, postId, doc)
        }

        const items = doc.querySelectorAll(REPLIES_SELECTOR)
        for (const item of items) {
            yield parseReply(postType, postId, item as HTMLDivElement)
        }

        if (options.checkPagination) {
            const maxPerPage = options.itemsPerPage || ITEMS_PER_PAGE
            if (items.length < maxPerPage) {
                return
            }
        } else if (items.length == 0) {
            return
        }
    }
}

export async function* fetchPostWithDiscussionsIt (postType: PostType, postId: number, options: Options) {
    for await (const d of fetchPostIt(postType, postId, options)) {
        yield d

        // fetch discussions
        if (
            (d.type === "question" || d.type === "answer") &&
            d.discussionCount > 0
        ) {
            yield* fetchDiscussionsIt(d.type, d.id, options)
        }
    }
}

export async function savePostWithDiscussions (postType: PostType, postId: number, options: Options) {
    for await (const d of fetchPostWithDiscussionsIt(postType, postId, options)) {
        await saveItemJson(d, options)
    }
}

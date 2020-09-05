
import { Item, formatContents, formatInt } from "./utils"

const CONTENT_SELECTOR = ".markitup-box"
const DATE_SELECTOR = ".mod-footer > .meta > span"
const AGREE_SELECTOR = ".agree > .count"
const DISCUSSION_SELECTOR = ".aw-add-comment"
const USERNAME_SELECTOR = ".aw-user-name"

/**
 * A generic post-like (question, article, video, or answer) entry 
 */
export interface PostLike extends Pick<Item<any>, "contents" | "date"> {
    agreeCount: number;
    discussionCount: number;
}

export const parsePostLike = (parentEl: Element): PostLike => {
    const contentEl = parentEl.querySelector(CONTENT_SELECTOR) as HTMLDivElement
    const contents = formatContents(contentEl)

    const dateEl = parentEl.querySelector(DATE_SELECTOR)!
    const date = dateEl.textContent!

    const agreeEl = parentEl.querySelector(AGREE_SELECTOR) as HTMLElement
    const agreeCount = formatInt(agreeEl.textContent)

    const discussionEl = parentEl.querySelector(DISCUSSION_SELECTOR) as HTMLElement | null
    const discussionCount = discussionEl
        ? formatInt(discussionEl.dataset.commentCount)
        : 0

    return {
        contents,
        date,
        agreeCount,
        discussionCount
    }
}

export const parseUid = (parentEl: Element) => {
    const userEl = parentEl.querySelector(USERNAME_SELECTOR) as HTMLElement
    const uid = formatInt(userEl.dataset.id)
    return uid
}

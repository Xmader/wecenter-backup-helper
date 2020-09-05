
import fetch from "node-fetch"
import fs from "fs-extra"
import path from "path"

export type BoolString = "0" | "1"

export interface Options {
    siteUrl: string;
    destDir: string;

    userAgent?: string;

    checkPagination?: boolean;
    itemsPerPage?: number;
}

// https://github.com/pincong/pincong-wecenter/blob/master/models/publish.php#L91-L124
export type PostType =
    | "question"
    | "article"
    | "video"
export type DiscussionParent =
    | "question"
    | "answer"
export const ReplyTypeMap = {
    question: "answer" as const,
    article: "article_comment" as const,
    video: "video_comment" as const,
}
export const DiscussionTypeMap = {
    question: "question_discussion" as const,
    answer: "answer_discussion" as const,
}
export type ReplyType = typeof ReplyTypeMap[PostType]
export type DiscussionType = typeof DiscussionTypeMap[DiscussionParent]
export type ItemType =
    | PostType
    | ReplyType
    | DiscussionType

export interface Item<T extends ItemType, P extends ItemType = never> {
    type: T;
    id: number;

    parentType?: P;
    parentId?: number;

    /** The author's user id */
    uid: number;

    /** ISO 8601 date string, e.g. `2020-01-01` */
    date: string;

    /** HTML */
    contents: string;
}


export const formatInt = (i: string | number | null | undefined) => {
    // @ts-ignore
    return i | 0
}


export const fetchReq = (url: string, options: Options) => {
    return fetch(url, {
        headers: {
            "User-Agent": options.userAgent!,
        }
    })
}


export const saveFile = async (filename: string, data: string | Buffer, options: Options) => {
    const file = path.join(options.destDir, filename)
    await fs.ensureDir(path.dirname(file))
    return fs.writeFile(file, data)
}

export const saveJson = (basename: string, jsonObj: Record<string, any> & { type: string }, options: Options) => {
    return saveFile(`${jsonObj.type}/${basename}.json`, JSON.stringify(jsonObj), options)
}


export const formatContents = (containerEl: HTMLElement) => {
    containerEl.querySelectorAll("a").forEach(a => {
        if (a.title && a.title.startsWith("http")) {
            // replace `url/img/...` or `url/link/...` with its actual link
            a.href = a.title
            a.removeAttribute("title")
        }
    })

    return containerEl.innerHTML.trim()
}


import CloudScraper from "cloudscraper"
import fetch from "node-fetch"
import fs from "fs-extra"
import path from "path"

export type BoolString = "0" | "1"

export interface Options {
    siteUrl: string;
    destDir: string;

    userAgent?: string;
    bypassCloudflare?: boolean;

    /** backup topic/user avatar */
    saveAvatar?: boolean;

    concurrency?: number;
    interval?: number;
    intervalCap?: number;
    timeout?: number;

    checkPagination?: boolean;
    itemsPerPage?: number;

    progress?: (item: BaseItem) => any;
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

export interface BaseItem<T extends string = any, P extends string = any> {
    type: T;
    id: number;

    parentType?: P;
    parentId?: number;
}

export interface Item<T extends ItemType, P extends ItemType = never> extends BaseItem<T, P> {
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

export const formatBoolString = (s: string | undefined): boolean => {
    return !!+s!
}


export const fetchText = async (url: string, options: Options): Promise<string> => {
    if (options.bypassCloudflare) {
        // use https://github.com/codemanki/cloudscraper to bypass Cloudflare challenges
        const data = await CloudScraper({
            method: "GET",
            url,
            simple: false, // do not reject on status codes other than 2xx
        })
        return data
    } else {
        // use normal node-fetch
        const r = await fetch(url, {
            headers: {
                "User-Agent": options.userAgent!,
            }
        })
        return r.text()
    }
}


export const saveFile = async (filename: string, data: string | Buffer, options: Options) => {
    const file = path.join(options.destDir, filename)
    await fs.ensureDir(path.dirname(file))
    return fs.writeFile(file, data)
}

export const saveJson = (basename: string, jsonObj: Record<string, any> & { type: string }, options: Options) => {
    return saveFile(`${jsonObj.type}/${basename}.json`, JSON.stringify(jsonObj), options)
}

export const saveItemJson = (item: BaseItem, options: Options) => {
    options.progress?.(item)
    return saveJson(`${item.parentId || ""}/${item.id}`, item, options)
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


export const saveImg = async (imgUrl: string | undefined, options: Options) => {
    if (options.saveAvatar) {
        if (imgUrl && !imgUrl.includes("static")) { // ignore the default avatar
            imgUrl = imgUrl.replace("_mid", "_max")  // save the maximum resolution

            const { origin, pathname } = new URL(imgUrl)

            const r = await fetch(origin + pathname /** omit the query string */, {
                headers: { "User-Agent": options.userAgent!, }
            })

            const img = await r.arrayBuffer()
            await saveFile(pathname, Buffer.from(img), options)
        }
    }
} 

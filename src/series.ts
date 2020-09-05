
import { Options, PostType } from "./utils"
import { saveTopicInfo, ERR_TOPIC_NOT_FOUND } from "./topic"
import { saveUserInfo, ERR_USER_NOT_FOUND } from "./user"
import { savePostWithDiscussions, ERR_POST_NOT_FOUND } from "./post"

type Type = PostType | "topic" | "user"

function save (type: Type, id: number, options: Options): Promise<void> {
    if (type === "topic") {
        return saveTopicInfo(id, options)
    } else if (type === "user") {
        return saveUserInfo(id, options)
    } else {
        return savePostWithDiscussions(type, id, options)
    }
}

const ERR_NOT_FOUND = [ERR_TOPIC_NOT_FOUND, ERR_USER_NOT_FOUND, ERR_POST_NOT_FOUND]

export async function saveSeriesOf (type: Type, options: Options, startId: number = 1, endId: number = Infinity) {
    const maxConcurrent = options.maxConcurrent || 100
    console.info("maxConcurrent:", maxConcurrent)

    let plist: Array<() => Promise<boolean>> = []

    for (let id = startId; id <= endId; id++) {
        plist.push(async () => {
            try {
                await save(type, id, options)
                return true
            } catch (err) {
                // silently ignore `* not found`
                if (!ERR_NOT_FOUND.includes(err)) {
                    console.error(`\n🚨\n${type} id: ${id}\nerror:`, err)
                }
                return false
            }
        })

        if (plist.length >= maxConcurrent || id >= endId) {
            const results = await Promise.all(plist.map(f => f()))
            plist = []

            // stop after all requests in the batch failed
            if (results.every(r => r === false)) {
                return
            }
        }
    }
}

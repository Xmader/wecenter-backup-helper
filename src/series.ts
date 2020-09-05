
import { Options, PostType } from "./utils"
import { saveTopicInfo } from "./topic"
import { saveUserInfo } from "./user"
import { savePostWithDiscussions } from "./post"

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

export async function saveSeriesOf (type: Type, options: Options, startId: number = 1, endId: number = Infinity, maxConcurrent: number = 100) {
    let plist: Array<() => Promise<boolean>> = []

    for (let id = startId; id <= endId; id++) {
        plist.push(async () => {
            try {
                await save(type, id, options)
                return true
            } catch (err) {
                console.error(`\n🚨\n${type} id: ${id}\nerror:`, err)
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


import PQueue from "p-queue"
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
    const concurrency = options.concurrency || 100
    const timeout = options.timeout
    const interval = options.interval || 0
    const intervalCap = options.intervalCap || Infinity
    console.info(type, "concurrency:", concurrency, "timeout", timeout, "interval:", interval, "intervalCap:", intervalCap)

    const queue = new PQueue({ concurrency, timeout, interval, intervalCap })

    let results: boolean[] = []
    function updateResult (r: boolean) {
        results.push(r)
        // keep the last `concurrency` elements
        results = results.slice(-concurrency)
    }

    for (let id = startId; id <= endId; id++) {
        queue.add(async () => {
            try {
                await save(type, id, options)
                updateResult(true)
            } catch (err) {
                // silently ignore `* not found`
                if (!ERR_NOT_FOUND.includes(err)) {
                    console.error(`\n🚨\n${type} id: ${id}\nerror:`, err)
                }
                updateResult(false)
            }
        })

        await queue.onEmpty()

        // stop if all requests in the batch failed
        if (results.length == concurrency && results.every(r => r === false)) {
            break
        }
    }

    console.info(type, "finished")

    await Promise.race([
        queue.onIdle(),
        new Promise((resolve) => setTimeout(resolve, 60 * 1000)), // 60s timeout
    ])
}


import { BoolString, Options, fetchReq, saveJson } from "./utils"

export const ERR_TOPIC_NOT_FOUND = new Error("topic not found")

const buildReqUrl = (siteUrl: string, topicId: number) => {
    return `${siteUrl}/topic/ajax/topic_info/topic_id-${topicId}`
}

export interface TopicInfo {
    type: "topic";

    topic_id: string; // number
    topic_title: string;
    url: string;

    is_parent?: BoolString;
    parent_id?: string | "0";
    merged_id?: string | "0";

    topic_description?: string;
    topic_pic?: string;
    seo_title?: string;

    add_time: string; // number
    focus_count: string; // number

    discuss_count: string; // number
    discuss_count_last_week: string; // number
    discuss_count_last_month: string; // number
    discuss_count_update: string; // time stamp

    topic_lock?: BoolString;
    user_related?: BoolString;
    url_token?: string | null;
}

interface TopicInfoErr {
    type: "topic";
    topic_id: undefined;
    focus_count: null;
}


/**
 * Fetch topic info
 */
export const fetchTopicInfo = async (topicId: number, options: Options) => {
    const url = buildReqUrl(options.siteUrl, topicId)
    const r = await fetchReq(url, options)
    const data: TopicInfo | TopicInfoErr = await r.json()
    if (!data.topic_id) {
        throw ERR_TOPIC_NOT_FOUND
    }
    return data
}

/**
 * Fetch and Save topic info
 */
export const saveTopicInfo = async (topicId: number, options: Options) => {
    const data = await fetchTopicInfo(topicId, options)
    await saveJson(topicId.toString(), data, options)
}

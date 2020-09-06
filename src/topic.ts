
import { BoolString, Options, BaseItem, fetchText, saveItemJson, formatInt, formatBoolString } from "./utils"

export const ERR_TOPIC_NOT_FOUND = new Error("topic not found")

const buildReqUrl = (siteUrl: string, topicId: number) => {
    return `${siteUrl}/topic/ajax/topic_info/topic_id-${topicId}`
}

export interface RawTopicInfo {
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

    /**
     * 话题是否锁定
     * https://github.com/pincong/pincong-wecenter/blob/master/install/db/tables.sql#L510
     */
    topic_lock?: BoolString;

    /** 是否被用户关联 */
    user_related?: BoolString;

    url_token?: string | null;
}

interface RawTopicInfoErr {
    type: "topic";
    topic_id: undefined;
    focus_count: null;
}
export interface TopicInfo extends BaseItem<"topic"> {
    title: string;
    seoTitle?: string;
    description?: string;
    pic?: string;

    mergedId?: number | null;

    addTime: number;
    focusCount: number;

    discussCount: {
        total: number;
        lastWeek: number;
        lastMonth: number;
        update: number; // time stamp
    };

    /** 话题是否锁定 */
    lock?: boolean;

    /** 是否被用户关联 */
    userRelated?: boolean;
}


const formatTopicInfo = (raw: RawTopicInfo): TopicInfo => {
    return {
        type: "topic",
        id: +raw.topic_id,
        title: raw.topic_title,
        seoTitle: raw.seo_title,
        description: raw.topic_description,
        pic: raw.topic_pic,
        mergedId: formatInt(raw.merged_id) || null,
        addTime: +raw.add_time,
        focusCount: +raw.focus_count,
        discussCount: {
            total: +raw.discuss_count,
            lastMonth: +raw.discuss_count_last_month,
            lastWeek: +raw.discuss_count_last_week,
            update: +raw.discuss_count_update,
        },
        lock: formatBoolString(raw.topic_lock),
        userRelated: formatBoolString(raw.user_related),
    }
}


/**
 * Fetch topic info
 */
export const fetchTopicInfo = async (topicId: number, options: Options) => {
    const url = buildReqUrl(options.siteUrl, topicId)
    const jsonStr = await fetchText(url, options)
    const data: RawTopicInfo | RawTopicInfoErr = JSON.parse(jsonStr)
    if (!data.topic_id) {
        throw ERR_TOPIC_NOT_FOUND
    }
    return formatTopicInfo(data)
}

/**
 * Fetch and Save topic info
 */
export const saveTopicInfo = async (topicId: number, options: Options) => {
    const data = await fetchTopicInfo(topicId, options)
    await saveItemJson(data, options)
}

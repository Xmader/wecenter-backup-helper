
import { Options, BaseItem, fetchText, saveItemJson, saveImg } from "./utils"

export const ERR_USER_NOT_FOUND = new Error("user not found")

const buildReqUrl = (siteUrl: string, uid: number) => {
    return `${siteUrl}/people/ajax/user_info/uid-${uid}`
}

export interface RawUserInfo {
    type: "people";

    uid: string; // number
    user_name: string;
    url: string;

    reputation: number;
    agree_count: string; // number
    fans_count: string; // number

    avatar_file?: string;
    signature?: string;

    verified?: boolean | null;
    /** 禁用私信 */
    pm_disabled?: boolean;

    // for authenticated user
    focus?: boolean;
    is_me?: boolean;
}

interface RawUserInfoErr {
    uid: null;
}

export interface UserInfo extends BaseItem<"people"> {
    username: string;

    reputation: number;
    agreeCount: number;
    fansCount: number;

    avatar?: string;
    signature?: string;

    verified?: boolean | null;
    pmDisabled?: boolean;
}

const formatUserInfo = (raw: RawUserInfo): UserInfo => {
    return {
        type: "people",
        id: +raw.uid,
        username: raw.user_name,
        reputation: +raw.reputation,
        agreeCount: +raw.agree_count,
        fansCount: +raw.fans_count,
        avatar: raw.avatar_file,
        signature: raw.signature,
        verified: raw.verified,
        pmDisabled: raw.pm_disabled,
    }
}


/**
 * Fetch user info
 */
export const fetchUserInfo = async (uid: number, options: Options) => {
    const url = buildReqUrl(options.siteUrl, uid)
    const jsonStr = await fetchText(url, options)
    const data: RawUserInfo | RawUserInfoErr = JSON.parse(jsonStr)
    if (!data.uid) {
        throw ERR_USER_NOT_FOUND
    }
    return formatUserInfo(data)
}

/**
 * Fetch and Save user info
 */
export const saveUserInfo = async (uid: number, options: Options) => {
    const info = await fetchUserInfo(uid, options)
    await saveItemJson(info, options)
    await saveImg(info.avatar, options)
}



import { Options, fetchReq, saveJson } from "./utils"

export const ERR_USER_NOT_FOUND = new Error("user not found")

const buildReqUrl = (siteUrl: string, uid: number) => {
    return `${siteUrl}/people/ajax/user_info/uid-${uid}`
}

export interface UserInfo {
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
    pm_disabled?: boolean;

    // for authenticated user
    focus?: boolean;
    is_me?: boolean;
}

interface UserInfoErr {
    uid: null;
}


/**
 * Fetch user info
 */
export const fetchUserInfo = async (uid: number, options: Options) => {
    const url = buildReqUrl(options.siteUrl, uid)
    const r = await fetchReq(url, options)
    const data: UserInfo | UserInfoErr = await r.json()
    if (!data.uid) {
        throw ERR_USER_NOT_FOUND
    }
    return data
}

/**
 * Fetch and Save user info
 */
export const saveUserInfo = async (uid: number, options: Options) => {
    const data = await fetchUserInfo(uid, options)
    await saveJson(uid.toString(), data, options)
}


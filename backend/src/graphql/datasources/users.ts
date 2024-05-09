import DataLoader from 'dataloader';
import { getAuth, Auth, UserRecord } from "firebase-admin/auth"

export interface User {
    uid: string
    displayName: string
    email: string
    admin: boolean
    volunteer: boolean
}

export function convertUserRecordToUser(userRec: UserRecord): User {
    return {
        uid: userRec.uid,
        displayName: userRec.displayName,
        email: userRec.email,
        admin: userRec.customClaims instanceof Object && "admin" in userRec.customClaims && userRec.customClaims["admin"] === true,
        volunteer: userRec.customClaims instanceof Object && "volunteer" in userRec.customClaims && userRec.customClaims["volunteer"] === true
    }
}

export default class Users {
    private fbAuth: Auth;

    constructor() {
        this.fbAuth = getAuth();
    }

    private batchUsers = new DataLoader<string, UserRecord>(async (uids: readonly string[]) => {
        const rawResults = await this.fbAuth.getUsers(uids.map(uid => ({ uid })))
        const mapping = rawResults.users.reduce((prev, curr) => ({ ...prev, [curr.uid]: curr }), {})

        return uids.map(uid => uid in mapping ? mapping[uid] : new Error(`No result for ${uid}`))
    });

    async getUser(uid: string) {
        return convertUserRecordToUser(await this.batchUsers.load(uid));
    }

    async getUsers() {
        const listAllUsers = async (nextPageToken?: string): Promise<UserRecord[]> => {
            const userBatchRes = await this.fbAuth.listUsers(1000, nextPageToken);
            if (userBatchRes.pageToken) {
                return userBatchRes.users.concat(await listAllUsers(userBatchRes.pageToken));
            }

            return userBatchRes.users;
        };

        return (await listAllUsers()).map(convertUserRecordToUser);
    }

    async updateClaimsForUser(uid: string, newClaims: object) {
        const user = await this.fbAuth.getUser(uid);
        // Overlap new claims on top of old
        const updatedClaims = { ...user.customClaims, ...newClaims };
        
        await this.fbAuth.setCustomUserClaims(uid, updatedClaims);
    }
}
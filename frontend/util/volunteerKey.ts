import { sha256 } from "./hashUsingSHA256";
import { generate } from "random-words";

export const volunteerKeyLocalStorageKey = "volunteerKey";

export async function generateVolunteerKey() {
    const key = (generate({ minLength: 2, maxLength: 6, exactly: 4 }) as string[]).join(" ");
    localStorage.setItem(volunteerKeyLocalStorageKey, await sha256(key));
    alert(`Your key is "${key}". Please remember this key as it will not be shown again.`);
}

export function getVolunteerKeyHash() {
    return localStorage.getItem(volunteerKeyLocalStorageKey);
}

export async function checkIfVolunteerKeyMatches(givenKey: string) {
    const hashedRealKey = getVolunteerKeyHash();
    const hashedGivenKey = await sha256(givenKey);

    return hashedGivenKey === hashedRealKey;
}

export function clearVolunteerKey() {
    localStorage.removeItem(volunteerKeyLocalStorageKey);
}

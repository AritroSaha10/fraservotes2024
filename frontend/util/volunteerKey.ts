import { generate } from "random-words";
import { sha256 } from "./hashUsingSHA256";

export const volunteerKeyLocalStorageKey = "volunteerKey";

export async function generateVolunteerKey() {
    const key = (generate(4) as string[]).join(" ");
    localStorage.setItem(volunteerKeyLocalStorageKey, await sha256(key));
    alert(`Your key is "${key}". Please remember this key as it will not be shown again.`);
    console.log(key)
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
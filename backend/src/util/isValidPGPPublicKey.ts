import { readKey } from "openpgp"

export async function isValidPGPPublicKey(rawPublicKey: string): Promise<boolean> {
    try {
        const publicKey = await readKey({ armoredKey: rawPublicKey });
        return publicKey !== null; // If the public key is read successfully, it's valid
    } catch (error) {
        console.error('Invalid PGP key:', error);
        return false; // Any error in reading the key means it's invalid or corrupted
    }
}
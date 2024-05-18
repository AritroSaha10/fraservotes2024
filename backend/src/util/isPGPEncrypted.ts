import openpgp from "openpgp";

export async function isPGPEncrypted(text: string) {
    try {
        // Try to read the PGP message from the provided text
        const message = await openpgp.readMessage({
            armoredMessage: text, // parse armored message
        });

        // If no exception is thrown, and a message is returned, it's likely a PGP message
        return message !== null;
    } catch (error) {
        // If an error occurs, it's likely not a PGP encrypted message
        return false;
    }
}

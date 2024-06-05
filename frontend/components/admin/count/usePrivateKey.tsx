// usePrivateKey.js
import { useState } from "react";
import { PrivateKey, readPrivateKey, decryptKey, readMessage, encrypt, createMessage, decrypt, readKey, Key } from "openpgp";
import Swal from "sweetalert2";
import PrivateKeyDetails from "@/types/admin/count/privateKeyDetails";

export const usePrivateKey = () => {
    const [publicKey, setPublicKey] = useState<Key | null>(null);
    const [encryptedPrivateKey, setEncryptedPrivateKey] = useState<PrivateKey | null>(null);
    const [decryptedPrivateKey, setDecryptedPrivateKey] = useState<PrivateKey | null>(null);
    const [privateKeyDetails, setPrivateKeyDetails] = useState<PrivateKeyDetails | null>(null);
    const [privateKeyValid, setPrivateKeyValid] = useState(false);
    const [passphrase, setPassphrase] = useState<string>("");

    const handlePrivateKeyUpload = async (file: File | undefined) => {
        setPrivateKeyValid(false);

        if (!file) {
            setEncryptedPrivateKey(null);
            setPrivateKeyDetails(null);
            return;
        }

        try {
            const privateKeyRaw = await file.text();
            const privateKey = await readPrivateKey({ armoredKey: privateKeyRaw });
            setEncryptedPrivateKey(privateKey);
            setPrivateKeyDetails({
                keyID: privateKey.getKeyID().toHex(),
                creationDate: privateKey.getCreationTime().toLocaleString("en-US", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                }),
                userIDs: privateKey.getUserIDs(),
                fileName: file.name,
            });
        } catch (e) {
            Swal.fire({
                title: "Error",
                text: "Failed to update private key. Please ensure it is a valid OpenPGP private key.",
                icon: "error",
            });
            setEncryptedPrivateKey(null);
            setPrivateKeyDetails(null);
        }
    };

    const handleOnPrivKeyVerify = async () => {
        if (!encryptedPrivateKey) {
            Swal.fire({
                title: "Error",
                text: "A private key was not uploaded, please do so before verifying.",
                icon: "error",
            });
            return false;
        }

        try {
            const decryptedPrivateKeyTmp = await decryptKey({
                privateKey: encryptedPrivateKey,
                passphrase,
            });

            setDecryptedPrivateKey(decryptedPrivateKeyTmp);

            const testMessage = "i love the university of waterloo";
            const testEncryptedMessage = await readMessage({
                armoredMessage: await encrypt({
                    message: await createMessage({ text: testMessage }),
                    encryptionKeys: publicKey!,
                }),
            });

            const { data: testDecryptedMessage } = await decrypt({
                message: testEncryptedMessage,
                decryptionKeys: decryptedPrivateKeyTmp,
            });

            const privateKeyValidTmp = testDecryptedMessage === testMessage;
            if (!privateKeyValidTmp) {
                Swal.fire({
                    title: "Error",
                    text: "The private key is not compatible with the public key. Please upload a new private key and try again.",
                });
            }

            setPrivateKeyValid(privateKeyValidTmp);
            return privateKeyValidTmp;
        } catch (e) {
            Swal.fire({
                title: "Error",
                text: "Something went wrong while decrypting your private key. This usually means the passphrase does not match the private key. Please change it and try again.",
                icon: "error",
            });
            console.error(e);
            return false;
        }
    };

    return {
        publicKey,
        setPublicKey,
        encryptedPrivateKey,
        decryptedPrivateKey,
        privateKeyDetails,
        privateKeyValid,
        setPrivateKeyValid,
        passphrase,
        setPassphrase,
        handlePrivateKeyUpload,
        handleOnPrivKeyVerify,
    };
};

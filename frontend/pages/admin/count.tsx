import { ChangeEvent, memo, useEffect, useState } from "react";

import { useRouter } from "next/router";

import { gql, useApolloClient, useQuery } from "@apollo/client";
import { ArrowUpTrayIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import { Button, Card, CardBody, Input, Tooltip, Typography } from "@material-tailwind/react";
import { Key, PrivateKey, readPrivateKey, decryptKey, readMessage, encrypt, createMessage, decrypt, readKey } from "openpgp";
import Swal from "sweetalert2";

import isListOfGivenType from "@/util/isListOfGivenType";

import Layout from "@/components/Layout";
import LoadingSpinner from "@/components/LoadingSpinner";
import Config from "@/types/config";
import SelectedChoice from "@/types/selectedBallotChoice";
import EncryptedBallot from "@/types/encryptedBallot";
import DecryptedBallot from "@/types/decryptedBallot";
import PrivateKeyDetails from "@/types/admin/count/privateKeyDetails";

const MAIN_DATA_QUERY = gql`
    query MainData {
        config {
            isOpen
            publicKey
        }
        encryptedBallotCount
    }
`;

const ENCRYPTED_BALLOTS_QUERY = gql`
    query EncryptedBallots {
        encryptedBallots {
            _id
            encryptedBallot
            timestampUTC
        }
    }
`;

const SUBMIT_DECRYPTED_BALLOTS_MUTATION = gql`
    mutation SaveDecryptedBallots($decryptedBallots: [DecryptedBallotInput]!) {
        saveDecryptedBallots(newDecryptedBallots: $decryptedBallots)
    }
`;

interface MainData {
    config: Config;
    encryptedBallotCount: number;
}

enum BallotCountStatus {
    IDLE,
    DECRYPTING,
    SAVING,
}

function BallotCountPageComponent() {
    const { loading, error, data } = useQuery<MainData>(MAIN_DATA_QUERY, { pollInterval: 5000 });
    const client = useApolloClient();
    const router = useRouter();

    const [publicKey, setPublicKey] = useState<Key | null>();
    const [encryptedPrivateKey, setEncryptedPrivateKey] = useState<PrivateKey | null>();
    const [decryptedPrivateKey, setDecryptedPrivateKey] = useState<PrivateKey | null>();
    const [privateKeyDetails, setPrivateKeyDetails] = useState<PrivateKeyDetails | null>(null);
    const [privateKeyValid, setPrivateKeyValid] = useState(false);

    const [passphrase, setPassphrase] = useState<string>("");
    const [ballotCountStatus, setBallotCountStatus] = useState<BallotCountStatus>(BallotCountStatus.IDLE);
    const [busy, setBusy] = useState(false);

    const renderPrivateKeyDetails = () => {
        if (!privateKeyDetails) {
            return (
                <Typography
                    variant="h5"
                    color="red"
                    className="mb-4"
                >
                    No private key is currently uploaded.
                </Typography>
            );
        }

        return (
            <div className="mb-4">
                <Typography
                    variant="h5"
                    color="green"
                    className="mb-4"
                >
                    Private Key is uploaded.
                </Typography>
                <Typography
                    variant="h6"
                    color="blue-gray"
                >
                    Key ID: {privateKeyDetails.keyID}
                </Typography>
                <Typography
                    variant="h6"
                    color="blue-gray"
                >
                    Creation Date: {privateKeyDetails.creationDate}
                </Typography>
                {privateKeyDetails.userIDs.map((userID, index) => (
                    <Typography
                        key={index}
                        variant="h6"
                        color="blue-gray"
                    >
                        User ID: {userID}
                    </Typography>
                ))}
            </div>
        );
    };

    const handlePrivateKeyUpload = (e: ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();

        setPrivateKeyValid(false);
        const file = e.target.files?.[0];

        if (!file) {
            setEncryptedPrivateKey(null);
            setPrivateKeyDetails(null);
            return;
        }

        setBusy(true);

        const reader = new FileReader();
        reader.onload = async (loadEvent) => {
            const privateKeyRaw = loadEvent.target?.result as string;
            try {
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
            } finally {
                setBusy(false);
            }
        };
        reader.readAsText(file);
    };

    const handleOnPrivKeyVerify = async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        e.preventDefault();

        if (encryptedPrivateKey === null || encryptedPrivateKey === undefined) {
            Swal.fire({
                title: "Error",
                text: "A private key was not uploaded, please do so before verifying.",
                icon: "error",
            });
            return;
        }

        setBusy(true);

        // First, try decrypting the key
        let decryptedPrivateKeyTmp: PrivateKey | null = null;
        try {
            decryptedPrivateKeyTmp = await decryptKey({
                privateKey: encryptedPrivateKey,
                passphrase,
            });

            setDecryptedPrivateKey(decryptedPrivateKeyTmp);
        } catch (e) {
            Swal.fire({
                title: "Error",
                text: "Something went wrong while decrypting your private key. This usually means the passphrase does not match the private key. Please change it and try again.",
                icon: "error",
            });
            console.error(e);

            setBusy(false);
            return;
        }

        try {
            // Try encrypting string with public key to confirm if public & private key match
            const testMessage = "i love the university of waterloo";
            const testEncryptedMessage = await readMessage({
                armoredMessage: await encrypt({
                    message: await createMessage({ text: testMessage }),
                    encryptionKeys: publicKey!,
                }),
            });

            // Try decrypting back
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
        } catch (e) {
            const decryptionFailed = String(e).includes("Session key decryption failed");
            if (decryptionFailed) {
                Swal.fire({
                    title: "Error",
                    text: "The private key could not decrypt the string. Try checking your passphrase and try again.",
                    icon: "error",
                });
            } else {
                Swal.fire({
                    title: "Error",
                    text: "Something went wrong when verifying if the private key is valid. Please try again.",
                    icon: "error",
                });
                console.error("Something went wrong when verifying public and private key:", e);
            }
        } finally {
            setBusy(false);
        }
    };

    const startBallotCount = async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        e.preventDefault();
        setBusy(true);

        if (!privateKeyValid) {
            Swal.fire({
                title: "Error",
                text: "The private key has not been verified yet. Please do so and try again.",
                icon: "error",
            });
            setBusy(false);
            return;
        }

        const { isConfirmed } = await Swal.fire({
            title: "Confirm Ballot Count",
            text: "Are you sure you want to start counting ballots? You must keep this tab focused until the process is complete.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, start!",
            cancelButtonText: "No, cancel",
        });
        if (isConfirmed) {
            try {
                setBallotCountStatus(BallotCountStatus.DECRYPTING);

                // Fetch all the ballots
                const res = await client.query({
                    query: ENCRYPTED_BALLOTS_QUERY,
                    fetchPolicy: "no-cache",
                });
                if (res.error) {
                    throw res.error;
                }

                // Decrypt all the ballots
                const encryptedBallots = res.data.encryptedBallots! as EncryptedBallot[];
                const decryptedBallots = await Promise.all(
                    encryptedBallots.map(async (encryptedBallot) => {
                        const ballotPGPMsg = await readMessage({
                            armoredMessage: encryptedBallot.encryptedBallot,
                        });

                        // Try decrypting back
                        const { data: decryptedChoicesRaw } = await decrypt({
                            message: ballotPGPMsg,
                            decryptionKeys: decryptedPrivateKey!,
                        });

                        let decryptedChoices: SelectedChoice[] | null = null;
                        try {
                            decryptedChoices = JSON.parse(decryptedChoicesRaw.toString());
                            if (!Array.isArray(decryptedChoices)) throw "Decrypted choices is corrupt, not an array";

                            // Check if all of the individual choice objects are valid
                            const allChoicesValid = decryptedChoices.every((choice) => {
                                const positionInData = "position" in choice && typeof choice.position === "string";
                                const candidatesInData =
                                    "candidates" in choice && isListOfGivenType(choice.candidates, "string");

                                return positionInData && candidatesInData;
                            });

                            if (!allChoicesValid)
                                throw "Decrypted choices is corrupt / does not have sufficient fields";
                        } catch (e) {
                            console.error({
                                message: "Error while decrypting selected choices",
                                error: e,
                                rawChoices: decryptedChoicesRaw,
                                choices: decryptedChoices,
                                encryptedBallotId: encryptedBallot._id,
                            });

                            return null;
                        }

                        const decryptedBallot: DecryptedBallot = {
                            encryptedBallotId: encryptedBallot._id,
                            selectedChoices: decryptedChoices,
                        };

                        return decryptedBallot;
                    }),
                );

                // Take action if any ballots are corrupt
                const corruptBallots = decryptedBallots.filter((ballot) => ballot === null).length;
                if (corruptBallots > 0) {
                    const { isConfirmed } = await Swal.fire({
                        title: "Corrupt ballots found",
                        text: `${corruptBallots} / ${decryptedBallots.length} were found to be corrupt / could not be decrypted. Would you like to continue with calculating the results?`,
                        icon: "warning",
                        showCancelButton: true,
                        confirmButtonText: "Yes, continue!",
                        cancelButtonText: "No, stop",
                    });

                    if (!isConfirmed) {
                        setBusy(false);
                        setBallotCountStatus(BallotCountStatus.IDLE);
                        return;
                    }
                }

                const normalDecryptedBallots = decryptedBallots.filter(
                    (ballot) => ballot !== null,
                ) as DecryptedBallot[];
                console.log(normalDecryptedBallots);

                // Send all of the ballots to the backend for counting
                setBallotCountStatus(BallotCountStatus.SAVING);
                const submitDecryptedBallotsMutation = await client.mutate({
                    mutation: SUBMIT_DECRYPTED_BALLOTS_MUTATION,
                    variables: {
                        decryptedBallots: normalDecryptedBallots,
                    },
                });

                if (
                    submitDecryptedBallotsMutation.errors?.length !== undefined &&
                    submitDecryptedBallotsMutation.errors?.length > 0
                ) {
                    submitDecryptedBallotsMutation.errors.forEach(console.error);
                    throw "Could not submit decrypted ballots to backend";
                }

                const resultId = submitDecryptedBallotsMutation.data.saveDecryptedBallots;

                // Let user know that it is done
                await Swal.fire({
                    title: "Counting Completed!",
                    text: "The ballots have been counted! You will be redirected to the results page.",
                    icon: "success",
                });

                router.push(`/admin/results/${resultId}`);
            } catch (e) {
                Swal.fire({
                    title: "Error",
                    text: "Something went wrong while counting ballots. You may safely try again.",
                    icon: "error",
                });
                console.error(e);
            }
        }

        setBusy(false);
        setBallotCountStatus(BallotCountStatus.IDLE);
    };

    useEffect(() => {
        if (data?.config.publicKey) {
            (async () => {
                try {
                    const publicKeyObject = await readKey({ armoredKey: data.config.publicKey });
                    setPublicKey(publicKeyObject);
                } catch (err) {
                    Swal.fire({
                        title: "Error",
                        text: "Something went wrong while loading some data. Please try refreshing the website.",
                        icon: "error",
                    });
                }
            })();
        } else if (data !== undefined) {
            Swal.fire({
                title: "Error",
                text: "A public key has not been configured yet. Please do so before attempting to decrypt ballots.",
                icon: "error",
            });
        }
    }, [data]);

    if (error) {
        Swal.fire({
            title: "Something went wrong",
            text: "Something went wrong while loading data. Please try again.",
            icon: "error",
        });
        console.error("Error while fetching main data:", error);
        return (
            <Typography
                variant="h1"
                color="red"
            >
                Something went wrong :(
            </Typography>
        );
    }

    // TODO: Improve later to be nicer
    if (loading) {
        return <Typography variant="h1">Loading...</Typography>;
    }

    const config = data!.config;
    const uploadPrivateKeyButtonsDisabled =
        busy || config.isOpen || data!.encryptedBallotCount === 0 || publicKey === null;

    const FileUploadAreaText = memo(function FileUploadAreaText({ uploadPrivateKeyButtonsDisabled, privateKeyDetails }: { uploadPrivateKeyButtonsDisabled: boolean, privateKeyDetails: PrivateKeyDetails }) {
        if (uploadPrivateKeyButtonsDisabled) {
            return (
                <>
                    <p className="mb-2 text-sm text-gray-500">
                        Upload not allowed, as voting is open or there are no encrypted ballots.
                    </p>
                </>
            );
        } else if (privateKeyDetails !== null) {
            return (
                <>
                    <p className="mb-2 text-sm text-gray-500">Uploaded {privateKeyDetails.fileName}</p>
                </>
            );
        } else {
            return (
                <>
                    <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Click to upload</span> <span className="text-red-500">*</span>
                    </p>
                    <p className="text-xs text-gray-500">.ASC</p>
                </>
            );
        }
    },);

    const countingStatusDisplay = (() => {
        switch (ballotCountStatus) {
            case BallotCountStatus.IDLE:
                return <div className="flex gap-1 items-center">Start Ballot Count</div>;
            case BallotCountStatus.DECRYPTING:
                return (
                    <div className="flex gap-1 items-center">
                        <LoadingSpinner /> Decrypting ballots...
                    </div>
                );
            case BallotCountStatus.SAVING:
                return (
                    <div className="flex gap-1 items-center">
                        <LoadingSpinner /> Counting and saving ballots...
                    </div>
                );
        }
    })();

    return (
        <>
            <Typography variant="h1">Ballot Count</Typography>

            <Card className="w-full lg:w-2/3 shadow-lg">
                <CardBody className="p-6">
                    <Typography
                        variant="h4"
                        color="blue-gray"
                        className="mb-4"
                    >
                        Private Key Management
                    </Typography>

                    {renderPrivateKeyDetails()}

                    <Typography
                        variant="h5"
                        color="blue-gray"
                        className="mb-4"
                    >
                        Upload New Private Key
                    </Typography>

                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-center w-full">
                            <label
                                htmlFor="dropzone-file"
                                className={`flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg ${!uploadPrivateKeyButtonsDisabled ? "bg-gray-50 hover:bg-gray-100 cursor-pointer" : "bg-gray-200"}`}
                            >
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <ArrowUpTrayIcon className="w-8 h-8 mb-4 text-gray-500" />
                                    <FileUploadAreaText />
                                </div>
                                <input
                                    id="dropzone-file"
                                    type="file"
                                    accept=".asc"
                                    className="hidden"
                                    onChange={handlePrivateKeyUpload}
                                    disabled={uploadPrivateKeyButtonsDisabled}
                                />
                            </label>
                        </div>

                        <Input
                            type="password"
                            label="Passphrase"
                            required
                            value={passphrase}
                            onChange={(e) => {
                                setPrivateKeyValid(false);
                                setPassphrase(e.target.value);
                            }}
                        />

                        <div className="flex gap-4 items-center">
                            <Tooltip
                                content="You can't upload a private key while voting is open or there are no encrypted ballots."
                                placement="bottom-start"
                                className={
                                    !(config.isOpen || data!.encryptedBallotCount === 0 || publicKey === null)
                                        ? "hidden"
                                        : ""
                                }
                            >
                                <div>
                                    <Button
                                        variant="outlined"
                                        color="green"
                                        disabled={uploadPrivateKeyButtonsDisabled || privateKeyValid}
                                        onClick={handleOnPrivKeyVerify}
                                    >
                                        Verify
                                    </Button>
                                </div>
                            </Tooltip>

                            {privateKeyValid ? (
                                <div className="flex gap-1 items-center">
                                    <CheckCircleIcon className="text-green-500 w-8 h-8" />
                                    <span className="text-sm">Private key has been verified.</span>
                                </div>
                            ) : (
                                <></>
                            )}
                        </div>
                    </div>
                </CardBody>
            </Card>

            <Card className="w-full lg:w-2/3 shadow-lg">
                <CardBody className="p-6">
                    <Typography
                        variant="h4"
                        color="blue-gray"
                        className="mb-4"
                    >
                        Count Ballots
                    </Typography>

                    <Button
                        variant="outlined"
                        color="green"
                        disabled={busy || !privateKeyValid}
                        onClick={startBallotCount}
                    >
                        {countingStatusDisplay}
                    </Button>
                </CardBody>
            </Card>
        </>
    );
}

export default function BallotCountPage() {
    return (
        <Layout
            name="Ballot Count"
            adminProtected
            className="flex flex-col p-8 items-center gap-8"
        >
            <BallotCountPageComponent />
        </Layout>
    );
}

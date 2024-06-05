import { ChangeEvent, useEffect, useState } from "react";

import { useRouter } from "next/router";

import Config from "@/types/config";
import DecryptedBallot from "@/types/decryptedBallot";
import EncryptedBallot from "@/types/encryptedBallot";
import SelectedChoice from "@/types/selectedBallotChoice";
import { gql, useApolloClient, useQuery } from "@apollo/client";
import { Button, Card, CardBody, Typography } from "@material-tailwind/react";
import { readMessage, decrypt, readKey } from "openpgp";
import Swal from "sweetalert2";

import isListOfGivenType from "@/util/isListOfGivenType";

import Layout from "@/components/Layout";
import LoadingSpinner from "@/components/LoadingSpinner";
import PrivateKeyManagement from "@/components/admin/count/privateKeyManagement";
import { usePrivateKey } from "@/components/admin/count/usePrivateKey";

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

    const {
        publicKey,
        setPublicKey,
        decryptedPrivateKey,
        privateKeyDetails,
        privateKeyValid,
        passphrase,
        setPassphrase,
        handlePrivateKeyUpload,
        handleOnPrivKeyVerify,
    } = usePrivateKey();

    const [ballotCountStatus, setBallotCountStatus] = useState<BallotCountStatus>(BallotCountStatus.IDLE);
    const [busy, setBusy] = useState(false);

    const handlePrivateKeyUploadEvent = async (e: ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        const file = e.target.files?.[0];

        setBusy(true);
        try {
            await handlePrivateKeyUpload(file);
        } catch (e) {
            console.error("Something went wrong when handling the private key upload event:", e);
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
    }, [data, setPublicKey]);

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

            <PrivateKeyManagement
                privateKeyDetails={privateKeyDetails}
                handlePrivateKeyUploadEvent={handlePrivateKeyUploadEvent}
                passphrase={passphrase}
                setPassphrase={setPassphrase}
                privateKeyValid={privateKeyValid}
                handleOnPrivKeyVerify={handleOnPrivKeyVerify}
                uploadPrivateKeyButtonsDisabled={uploadPrivateKeyButtonsDisabled}
            />

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

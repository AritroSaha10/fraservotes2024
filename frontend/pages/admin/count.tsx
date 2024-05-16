import Layout from "@/components/Layout"
import { gql, useApolloClient, useQuery } from "@apollo/client";
import { ArrowUpTrayIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import { Button, Card, CardBody, CardHeader, Input, Tooltip, Typography } from "@material-tailwind/react"
import { ChangeEvent, useEffect, useState } from "react";
import Swal from "sweetalert2";
import * as openpgp from 'openpgp';

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
`

interface Config {
    isOpen: boolean;
    publicKey: string;
}

interface MainData {
    config: Config;
    encryptedBallotCount: number;
}

interface EncryptedBallot {
    
}

function BallotCountPageComponent() {
    const { loading, error, data } = useQuery<MainData>(MAIN_DATA_QUERY, { pollInterval: 5000 });
    const client = useApolloClient();

    const [publicKey, setPublicKey] = useState<openpgp.Key | null>();
    const [encryptedPrivateKey, setEncryptedPrivateKey] = useState<openpgp.PrivateKey | null>();
    const [decryptedPrivateKey, setDecryptedPrivateKey] = useState<openpgp.PrivateKey | null>();
    const [privateKeyDetails, setPrivateKeyDetails] = useState<{
        keyID: string;
        creationDate: string;
        userIDs: string[];
        fileName: string;
    } | null>(null);
    const [privateKeyValid, setPrivateKeyValid] = useState(false);

    const [passphrase, setPassphrase] = useState<string>("");
    const [countingBallots, setCountingBallots] = useState(false);
    const [busy, setBusy] = useState(false);

    const renderPrivateKeyDetails = () => {
        if (!privateKeyDetails) {
            return <Typography variant="h5" color="red" className="mb-4">No private key is currently uploaded.</Typography>;
        }

        return (
            <div className="mb-4">
                <Typography variant="h5" color="green" className="mb-4">Private Key is uploaded.</Typography>
                <Typography variant="h6" color="blue-gray">Key ID: {privateKeyDetails.keyID}</Typography>
                <Typography variant="h6" color="blue-gray">Creation Date: {privateKeyDetails.creationDate}</Typography>
                {privateKeyDetails.userIDs.map((userID, index) => (
                    <Typography key={index} variant="h6" color="blue-gray">User ID: {userID}</Typography>
                ))}
            </div>
        );
    };

    const handlePrivateKeyUpload = (e: ChangeEvent<HTMLInputElement>) => {
        e.preventDefault()
        
        setPrivateKeyValid(false);
        const file = e.target.files?.[0];

        if (!file) {
            setEncryptedPrivateKey(null);
            setPrivateKeyDetails(null);
            return;
        }

        setBusy(true);

        const reader = new FileReader();
        reader.onload = async loadEvent => {
            const privateKeyRaw = loadEvent.target?.result as string;
            try {
                const privateKey = await openpgp.readPrivateKey({ armoredKey: privateKeyRaw });
                setEncryptedPrivateKey(privateKey);
                setPrivateKeyDetails({
                    keyID: privateKey.getKeyID().toHex(),
                    creationDate: privateKey.getCreationTime().toLocaleString('en-US', {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit"
                    }),
                    userIDs: privateKey.getUserIDs(),
                    fileName: file.name,
                })
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
        }
        reader.readAsText(file);
    }

    const handleOnPrivKeyVerify = async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        e.preventDefault();

        if (encryptedPrivateKey === null || encryptedPrivateKey === undefined) {
            Swal.fire({
                title: "Error",
                text: "A private key was not uploaded, please do so before verifying.",
                icon: "error"
            })
            return;
        }

        setBusy(true);

        // First, try decrypting the key
        let decryptedPrivateKeyTmp: openpgp.PrivateKey | null = null; 
        try {
            decryptedPrivateKeyTmp = await openpgp.decryptKey({
                privateKey: encryptedPrivateKey,
                passphrase
            });

            setDecryptedPrivateKey(decryptedPrivateKeyTmp);
        } catch (e) {
            Swal.fire({
                title: "Error",
                text: "Something went wrong while decrypting your private key. This usually means the passphrase does not match the private key. Please change it and try again.",
                icon: "error"
            });
            console.error(e);

            setBusy(false);
            return;
        }

        try {
            // Try encrypting string with public key to confirm if public & private key match
            const testMessage = "i love the university of waterloo"
            const testEncryptedMessage = await openpgp.readMessage({
                armoredMessage: await openpgp.encrypt({
                    message: await openpgp.createMessage({ text: testMessage }),
                    encryptionKeys: publicKey!,
                })
            });

            // Try decrypting back
            const { data: testDecryptedMessage } = await openpgp.decrypt({
                message: testEncryptedMessage,
                decryptionKeys: decryptedPrivateKeyTmp
            });

            const privateKeyValidTmp = testDecryptedMessage === testMessage;
            if (!privateKeyValidTmp) {
                Swal.fire({
                    title: "Error",
                    text: "The private key is not compatible with the public key. Please upload a new private key and try again."
                });
            }

            setPrivateKeyValid(privateKeyValidTmp);
        } catch (e) {
            const decryptionFailed = String(e).includes("Session key decryption failed");
            if (decryptionFailed) {
                Swal.fire({
                    title: "Error",
                    text: "The private key could not decrypt the string. Try checking your passphrase and try again.",
                    icon: "error"
                });
            } else {
                Swal.fire({
                    title: "Error",
                    text: "Something went wrong when verifying if the private key is valid. Please try again.",
                    icon: "error"
                });
                console.error("Something went wrong when verifying public and private key:", e);
            }
        } finally {
            setBusy(false);
        }
    }
    
    const startBallotCount = async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        setBusy(true);

        const { isConfirmed } = await Swal.fire({
            title: 'Confirm Ballot Count',
            text: 'Are you sure you want to start counting ballots? You must keep this tab focused until the process is complete.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, start!',
            cancelButtonText: 'No, cancel',
        })
        if (isConfirmed) {
            try {
                // Fetch all the ballots
                const res = await client.query({
                    query: ENCRYPTED_BALLOTS_QUERY,
                    fetchPolicy: 'no-cache'
                });
                if (res.error) {
                    throw res.error;
                }

                const encryptedBallots = res.data.encryptedBallots;

                
                // ...

                // Let user know that it is done
                Swal.fire({
                    title: "Counting Completed!",
                    text: "The ballots have been counted! You will be redirected to the results page.",
                    icon: "success"
                });
            } catch (e) {
                Swal.fire({
                    title: "Error",
                    text: "Something went wrong while counting ballots. You may safely try again.",
                    icon: "error"
                });
                console.error(e)
            }
        }

        setBusy(false);
    }

    useEffect(() => {
        if (data?.config.publicKey) {
            (async () => {
                try {
                    const publicKeyObject = await openpgp.readKey({ armoredKey: data.config.publicKey });
                    setPublicKey(publicKeyObject);
                } catch (err) {
                    Swal.fire({
                        title: "Error",
                        text: "Something went wrong while loading some data. Please try refreshing the website.",
                        icon: "error"
                    })
                }
            })();
        } else if (data !== undefined) {
            Swal.fire({
                title: "Error",
                text: "A public key has not been configured yet. Please do so before attempting to decrypt ballots.",
                icon: "error"
            })
        }
    }, [data])

    if (error) {
        Swal.fire({
            title: "Something went wrong",
            text: "Something went wrong while loading data. Please try again.",
            icon: "error",
        });
        console.error("Error while fetching main data:", error);
        return (
            <Typography variant="h1" color="red">Something went wrong :(</Typography>
        );
    }

    // TODO: Improve later to be nicer
    if (loading) {
        return (
            <Typography variant="h1">Loading...</Typography>
        );
    }

    const config = data!.config;
    const uploadPrivateKeyButtonsDisabled = busy || config.isOpen || data!.encryptedBallotCount === 0 || publicKey === null;

    const TextInFileUploadArea = () => {
        if (uploadPrivateKeyButtonsDisabled) {
            return (
                <>
                    <p className="mb-2 text-sm text-gray-500">
                        Upload not allowed, as voting is open or there are no encrypted ballots.
                    </p>
                </>
            )
        } else if (privateKeyDetails !== null) {
            return (
                <>
                    <p className="mb-2 text-sm text-gray-500">
                        Uploaded {privateKeyDetails.fileName}
                    </p>
                </>
            )
        } else {
            return (
                <>
                    <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Click to upload</span> or drag and drop <span className="text-red-500">*</span>
                    </p>
                    <p className="text-xs text-gray-500">.ASC</p>
                </>
            )
        }
    };

    return (
        <>
            <Typography variant="h1">Ballot Count</Typography>

            <Card className="w-full lg:w-2/3 shadow-lg">
                <CardBody className="p-6">
                    <Typography variant="h4" color="blue-gray" className="mb-4">
                        Private Key Management
                    </Typography>

                    {renderPrivateKeyDetails()}

                    <Typography variant="h5" color="blue-gray" className="mb-4">
                        Upload New Private Key
                    </Typography>

                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-center w-full">
                            <label htmlFor="dropzone-file" className={`flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg ${!uploadPrivateKeyButtonsDisabled ? "bg-gray-50 hover:bg-gray-100 cursor-pointer" : "bg-gray-200"}`}>
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <ArrowUpTrayIcon className="w-8 h-8 mb-4 text-gray-500" />
                                    <TextInFileUploadArea />
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

                        <Input type="password" label="Passphrase" required value={passphrase} onChange={e => {
                            setPrivateKeyValid(false);
                            setPassphrase(e.target.value)
                        }} />
                        
                        <div className="flex gap-4 items-center">
                            <Tooltip
                                content="You can't upload a private key while voting is open or there are no encrypted ballots."
                                placement="bottom-start"
                                className={!(config.isOpen || data!.encryptedBallotCount === 0 || publicKey === null) ? "hidden" : ""}
                            >
                                <div>
                                    <Button variant="outlined" color="green" disabled={uploadPrivateKeyButtonsDisabled || privateKeyValid} onClick={handleOnPrivKeyVerify}>
                                        Verify
                                    </Button>
                                </div>
                            </Tooltip>

                            {privateKeyValid ? (
                                <div className="flex gap-1 items-center">
                                    <CheckCircleIcon className="text-green-500 w-8 h-8" />
                                    <span className="text-sm">Private key has been verified.</span>
                                </div>
                            ) : <></>}
                        </div>
                    </div>
                </CardBody>
            </Card>

            <Card className="w-full lg:w-2/3 shadow-lg">
                <CardBody className="p-6">
                    <Typography variant="h4" color="blue-gray" className="mb-4">
                        Count Ballots
                    </Typography>
                    
                    <Button variant="outlined" color="green" disabled={busy || !privateKeyValid} onClick={startBallotCount}>
                        {countingBallots ? "Counting Ballots..." : "Start Ballot Count"}
                    </Button>
                </CardBody>
            </Card>
        </>
    )
}

export default function BallotCountPage() {
    return (
        <Layout name="Ballot Count" adminProtected className="flex flex-col p-8 items-center gap-8">
            <BallotCountPageComponent />
        </Layout>
    )
}
import Layout from "@/components/Layout";
import { gql, useQuery, useMutation } from "@apollo/client";
import { useState, useEffect, ChangeEvent } from "react";
import { Button, Typography, Card, CardBody, Input, Tooltip } from "@material-tailwind/react";
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

const UPDATE_CONFIG_MUTATION = gql`
  mutation UpdateConfig($newConfig: ConfigInput!) {
    updateConfig(newConfig: $newConfig) {
      isOpen
      publicKey
    }
  }
`;

const RESET_VOTING_MUTATION = gql`
  mutation ResetVoting {
    deleteBallots {
      void
    }
    resetVotingStatuses {
      void
    }
  }
`;

interface Config {
    isOpen: boolean;
    publicKey: string;
}

interface MainData {
    config: Config;
    encryptedBallotCount: number;
}

interface UpdateConfigVariables {
    newConfig: Partial<Config>;
}

function AdminConfigPageComponent() {
    const { loading, error, data, refetch } = useQuery<MainData>(MAIN_DATA_QUERY, { pollInterval: 5000 });
    const [updateConfig] = useMutation<UpdateConfigVariables>(UPDATE_CONFIG_MUTATION);
    const [resetVoting] = useMutation(RESET_VOTING_MUTATION);
    const [publicKeyDetails, setPublicKeyDetails] = useState<{
        keyID: string;
        creationDate: string;
        userIDs: string[];
    } | null>(null);
    const [busy, setBusy] = useState(false); // True when anything's being done in any of the sections

    useEffect(() => {
        if (data?.config?.publicKey) {
            (async () => {
                try {
                    const publicKeyObject = await openpgp.readKey({ armoredKey: data.config.publicKey });
                    const details = {
                        keyID: publicKeyObject.getKeyIDs()[0].toHex(),
                        creationDate: publicKeyObject.getCreationTime().toUTCString(),
                        userIDs: publicKeyObject.getUserIDs(),
                    };
                    setPublicKeyDetails(details);
                } catch (err) {
                    console.error("Error reading public key:", err);
                }
            })();
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
            <Typography variant="h1" color="red">Something went wrong :(</Typography>
        );
    }

    // TODO: Improve later to be nicer
    if (loading) {
        return (
            <Typography variant="h1">Loading...</Typography>
        );
    }

    const { config, encryptedBallotCount } = data!;

    const handleToggleVoting = async () => {
        setBusy(true);

        try {
            const newConfig = { isOpen: !config.isOpen };
            await updateConfig({ variables: { newConfig } });
            Swal.fire({
                title: "Success",
                text: `Voting is now ${newConfig.isOpen ? "open" : "closed"}.`,
                icon: "success",
            });
            refetch();
        } catch (err) {
            console.error("Error updating config:", err);
            Swal.fire({
                title: "Error",
                text: "Failed to update voting status. Please try again.",
                icon: "error",
            });
        }

        setBusy(false);
    };

    const handlePublicKeyChange = async (event: ChangeEvent<HTMLInputElement>) => {
        setBusy(true);
        
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const publicKey = e.target?.result as string;
                try {
                    const publicKeyObject = await openpgp.readKey({ armoredKey: publicKey });
                    if (publicKeyObject) {
                        if (publicKeyObject.isPrivate()) {
                            Swal.fire({
                                title: "Private Key Uploaded",
                                text: "Please upload a public key instead of a private key. You can usually differentiate them by the suffix on the filename (sec -> private, pub -> public).",
                                icon: 'error'
                            });
                            setBusy(false);
                            return;
                        }

                        Swal.fire({
                            title: 'Confirm Public Key Upload',
                            text: 'Are you sure you want to upload this public key?',
                            icon: 'warning',
                            showCancelButton: true,
                            confirmButtonText: 'Yes, upload it!',
                            cancelButtonText: 'No, cancel',
                        }).then(async (result) => {
                            if (result.isConfirmed) {
                                const newConfig = { publicKey };
                                await updateConfig({ variables: { newConfig } });
                                Swal.fire({
                                    title: "Success",
                                    text: "Public key updated successfully.",
                                    icon: "success",
                                });
                                refetch();
                            }
                        }).finally(() => {
                            setBusy(false);
                        });
                    } else {
                        setBusy(false);
                    }
                } catch (err) {
                    console.error("Invalid public key:", err);
                    Swal.fire({
                        title: "Error",
                        text: "Failed to update public key. Please ensure it is a valid OpenPGP public key.",
                        icon: "error",
                    });
                    setBusy(false);
                } finally {
                    // Clear file ref once loaded, not needed anymore
                    event.target.value = "";
                }
            };
            reader.readAsText(file);
        }
    };

    const handleResetData = async () => {
        const { isConfirmed } = await Swal.fire({
            title: 'Are you sure?',
            text: "This will reset all ballots and voting statuses. This action cannot be undone.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, reset it!',
            cancelButtonText: 'No, keep it',
        });

        if (isConfirmed) {
            try {
                await resetVoting();
                Swal.fire({
                    title: "Success",
                    text: "Voting data reset successfully.",
                    icon: "success",
                });
                refetch();
            } catch (err) {
                console.error("Error resetting data:", err);
                Swal.fire({
                    title: "Error",
                    text: "Failed to reset voting data. Please try again.",
                    icon: "error",
                });
            }
        }
    };

    const renderPublicKeyDetails = () => {
        if (!publicKeyDetails) {
            return <Typography variant="h5" color="red" className="mb-4">No public key is currently uploaded.</Typography>;
        }

        return (
            <div className="mb-4">
                <Typography variant="h5" color="green" className="mb-4">Public Key is uploaded.</Typography>
                <Typography variant="h6" color="blue-gray">Key ID: {publicKeyDetails.keyID}</Typography>
                <Typography variant="h6" color="blue-gray">Creation Date: {publicKeyDetails.creationDate}</Typography>
                {publicKeyDetails.userIDs.map((userID, index) => (
                    <Typography key={index} variant="h6" color="blue-gray">User ID: {userID}</Typography>
                ))}
            </div>
        );
    };

    return (
        <>
            <Typography variant="h1" className="mb-8">Settings</Typography>

            <Card className="w-full lg:w-2/3 mb-8 shadow-lg">
                <CardBody className="p-6">
                    <Typography variant="h4" color="blue-gray" className="mb-4">
                        Voting Status
                    </Typography>
                    <Typography variant="h5" color="blue-gray" className="mb-4">
                        Voting is currently <span className={config.isOpen ? "text-green-500" : "text-red-500"}>{config.isOpen ? "open" : "closed"}</span>.
                    </Typography>
                    <Button
                        color={config.isOpen ? "red" : "green"}
                        onClick={handleToggleVoting}
                        disabled={busy}
                    >
                        {config.isOpen ? "Close Voting" : "Open Voting"}
                    </Button>
                </CardBody>
            </Card>

            <Card className="w-full lg:w-2/3 mb-8 shadow-lg">
                <CardBody className="p-6">
                    <Typography variant="h4" color="blue-gray" className="mb-4">
                        Public Key Management
                    </Typography>
                    {renderPublicKeyDetails()}
                    <Typography variant="h5" color="blue-gray" className="mb-4">
                        Upload New Public Key
                    </Typography>
                    <Tooltip
                        content="You can't upload a new public key while voting is open or there are encrypted ballots."
                        placement="bottom"
                        className={!(config.isOpen || encryptedBallotCount > 0) ? "hidden" : ""}
                    >
                    <div className="mb-4">
                        <Input
                            type="file"
                            accept=".asc"
                            onChange={handlePublicKeyChange}
                            disabled={busy || config.isOpen || encryptedBallotCount > 0}
                        />
                    </div>
                    </Tooltip>
                </CardBody>
            </Card>

            <Card className="w-full lg:w-2/3 mb-8 shadow-lg">
                <CardBody className="p-6">
                    <Typography variant="h4" color="blue-gray" className="mb-4">
                        Reset Data
                    </Typography>
                    <Button
                        color="red"
                        onClick={handleResetData}
                        disabled={busy || config.isOpen}
                    >
                        Reset Data
                    </Button>
                </CardBody>
            </Card>
        </>
    );
}

export default function AdminConfigPage() {
    return (
        <Layout name="Settings" adminProtected className="flex flex-col p-8 items-center">
            <AdminConfigPageComponent />
        </Layout>
    )
}

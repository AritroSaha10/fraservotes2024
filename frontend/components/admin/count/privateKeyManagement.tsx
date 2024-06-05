// PrivateKeyManagement.js
import { ChangeEvent, Dispatch, SetStateAction } from "react";
import { ArrowUpTrayIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import { Button, Card, CardBody, Input, Tooltip, Typography } from "@material-tailwind/react";
import PrivateKeyDetails from "@/types/admin/count/privateKeyDetails";

interface PrivateKeyManagementProps {
    privateKeyDetails: PrivateKeyDetails | null;
    handlePrivateKeyUploadEvent: (e: ChangeEvent<HTMLInputElement>) => Promise<void>;
    passphrase: string;
    setPassphrase: Dispatch<SetStateAction<string>>;
    privateKeyValid: boolean;
    handleOnPrivKeyVerify: () => Promise<boolean>;
    uploadPrivateKeyButtonsDisabled: boolean;
}

const PrivateKeyManagement = ({
    privateKeyDetails,
    handlePrivateKeyUploadEvent,
    passphrase,
    setPassphrase,
    privateKeyValid,
    handleOnPrivKeyVerify,
    uploadPrivateKeyButtonsDisabled
}: PrivateKeyManagementProps) => (
    <Card className="w-full lg:w-2/3 shadow-lg">
        <CardBody className="p-6">
            <Typography variant="h4" color="blue-gray" className="mb-4">
                Private Key Management
            </Typography>

            {privateKeyDetails ? (
                <div className="mb-4">
                    <Typography variant="h5" color="green" className="mb-4">
                        Private Key is uploaded.
                    </Typography>
                    <Typography variant="h6" color="blue-gray">
                        Key ID: {privateKeyDetails.keyID}
                    </Typography>
                    <Typography variant="h6" color="blue-gray">
                        Creation Date: {privateKeyDetails.creationDate}
                    </Typography>
                    {privateKeyDetails.userIDs.map((userID, index) => (
                        <Typography key={index} variant="h6" color="blue-gray">
                            User ID: {userID}
                        </Typography>
                    ))}
                </div>
            ) : (
                <Typography variant="h5" color="red" className="mb-4">
                    No private key is currently uploaded.
                </Typography>
            )}

            <Typography variant="h5" color="blue-gray" className="mb-4">
                Upload New Private Key
            </Typography>

            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-center w-full">
                    <label
                        htmlFor="dropzone-file"
                        className={`flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg ${
                            !uploadPrivateKeyButtonsDisabled ? "bg-gray-50 hover:bg-gray-100 cursor-pointer" : "bg-gray-200"
                        }`}
                    >
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <ArrowUpTrayIcon className="w-8 h-8 mb-4 text-gray-500" />
                            {uploadPrivateKeyButtonsDisabled ? (
                                <p className="mb-2 text-sm text-gray-500">
                                    Upload not allowed, as voting is open or there are no encrypted ballots.
                                </p>
                            ) : privateKeyDetails ? (
                                <p className="mb-2 text-sm text-gray-500">Uploaded {privateKeyDetails.fileName}</p>
                            ) : (
                                <>
                                    <p className="mb-2 text-sm text-gray-500">
                                        <span className="font-semibold">Click to upload</span> <span className="text-red-500">*</span>
                                    </p>
                                    <p className="text-xs text-gray-500">.ASC</p>
                                </>
                            )}
                        </div>
                        <input
                            id="dropzone-file"
                            type="file"
                            accept=".asc"
                            className="hidden"
                            onChange={handlePrivateKeyUploadEvent}
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
                        setPassphrase(e.target.value);
                    }}
                />

                <div className="flex gap-4 items-center">
                    <Tooltip
                        content="You can't upload a private key while voting is open or there are no encrypted ballots."
                        placement="bottom-start"
                        className={!(uploadPrivateKeyButtonsDisabled) ? "hidden" : ""}
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
                    ) : null}
                </div>
            </div>
        </CardBody>
    </Card>
);

export default PrivateKeyManagement;

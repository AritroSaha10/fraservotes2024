import { Dispatch, SetStateAction, useState } from "react";

import Candidate from "@/types/candidate";
import Position from "@/types/position";
import PageStatus from "@/types/volunteer/check-in/pageStatus";
import { OperationVariables, QueryResult, gql, useApolloClient, useQuery } from "@apollo/client";
import { Button, Typography } from "@material-tailwind/react";
import { createMessage, encrypt, readKey } from "openpgp";
import Swal from "sweetalert2";

import PositionCandidateSelection from "@/components/volunteer/check-in/PositionCandidateSelection";

const candidatesQueryOp = gql`
    query Query {
        candidates {
            _id
            biography
            campaignVideo
            fullName
            grade
            picture
            position {
                _id
            }
        }
        positions {
            _id
            name
            spotsAvailable
        }
    }
`;

const submitBallotMutationOp = gql`
    mutation Mutation($studentNumber: Int!, $encryptedBallot: String!) {
        submitBallot(studentNumber: $studentNumber, encryptedBallot: $encryptedBallot) {
            void
        }
    }
`;

interface VotingSectionProps {
    studentNumber: string;
    pageStatus: PageStatus;
    setPageStatus: Dispatch<SetStateAction<PageStatus>>;
    setStudentNumberInput: Dispatch<SetStateAction<string>>;
    configQuery: QueryResult<any, OperationVariables>;
}

export default function VotingSection({
    setPageStatus,
    studentNumber,
    setStudentNumberInput,
    configQuery,
}: VotingSectionProps) {
    const {
        loading: candidateDataLoading,
        error: candidateDataError,
        data: candidateData,
    } = useQuery(candidatesQueryOp);
    const { loading: configLoading, error: configError, data: configData } = configQuery;

    const [selectedCandidates, setSelectedCandidates] = useState<Record<string, Candidate[]>>({});
    const [submittingBallot, setSubmittingBallot] = useState(false);

    const client = useApolloClient();

    const handleSelect = (positionId: string, candidate: Candidate) => {
        setSelectedCandidates((prevState) => {
            const positionSelectedCandidates = prevState[positionId] || [];
            if (positionSelectedCandidates.includes(candidate)) {
                return {
                    ...prevState,
                    [positionId]: positionSelectedCandidates.filter((c) => c !== candidate),
                };
            } else {
                if (positionSelectedCandidates.length >= positions[positionId].spotsAvailable) {
                    return {
                        ...prevState,
                        [positionId]: [...positionSelectedCandidates.slice(1), candidate],
                    };
                } else {
                    return {
                        ...prevState,
                        [positionId]: [...positionSelectedCandidates, candidate],
                    };
                }
            }
        });
    };

    if (candidateDataLoading || configLoading) return <Typography variant="h1">Loading...</Typography>;
    if (candidateDataError || configError) {
        Swal.fire({
            title: "Something went wrong",
            text: "Something went wrong while loading some data. Please try again.",
            icon: "error",
        });
        if (candidateDataError) console.error("Error while loading candidate data:", candidateDataError);
        if (configError) console.error("Error while loading config data:", configError);
        setPageStatus(PageStatus.CHECKIN);
        return (
            <Typography
                variant="h1"
                color="red"
            >
                Something went wrong :&#40;
            </Typography>
        );
    }

    // Group candidates by position, then sort each candidates by name
    const candidates: Candidate[] = candidateData.candidates;
    const positions: Record<string, Position> = Object.fromEntries(
        candidateData.positions.map((pos: Position) => [pos._id, pos]),
    );

    // Create an empty dictionary to hold the grouped candidates
    const groupedCandidates: Record<string, Candidate[]> = candidates.reduce(
        (acc, candidate) => {
            const positionId = candidate.position._id;
            if (!acc[positionId]) {
                acc[positionId] = [];
            }
            acc[positionId].push(candidate);
            return acc;
        },
        {} as Record<string, Candidate[]>,
    );

    const submitBallot: React.MouseEventHandler<HTMLButtonElement> = (e) => {
        e.preventDefault();
        setSubmittingBallot(true);

        (async () => {
            // Make sure each section has the correct number of selections
            const ballotIncomplete = Object.keys(groupedCandidates).some((positionId) => {
                const position = positions[positionId];
                if (
                    !(positionId in selectedCandidates) ||
                    selectedCandidates[positionId].length !== position.spotsAvailable
                ) {
                    Swal.fire({
                        title: "Incomplete ballot",
                        text: `Please select the correct number of candidates (${position.spotsAvailable}) for the following position: ${position.name}.`,
                        icon: "error",
                    });

                    // Exit the loop immediately
                    return true;
                }

                // Seems to be fine, keep going
                return false;
            });

            if (ballotIncomplete) {
                return;
            }

            // Prepare raw data into what will be encrypted and sent to server
            const selectedChoices = Object.keys(selectedCandidates).map((positionId) => ({
                position: positionId,
                candidates: selectedCandidates[positionId].map((candidate) => candidate._id),
            }));

            // Encrypt using PGP
            const publicKey = await readKey({ armoredKey: configData.config.publicKey });
            const encryptedBallot = String(
                await encrypt({
                    message: await createMessage({ text: JSON.stringify(selectedChoices) }),
                    encryptionKeys: publicKey,
                }),
            );

            // Finally, submit to server
            const res = await client.mutate({
                mutation: submitBallotMutationOp,
                variables: {
                    studentNumber: Number(studentNumber),
                    encryptedBallot: encryptedBallot,
                },
                fetchPolicy: "no-cache",
            });

            if (res.errors) {
                Swal.fire({
                    title: "Something went wrong",
                    text: "Something went wrong while submitting your ballot. Please try again.",
                    icon: "error",
                });
                console.error(res.errors);
            } else {
                Swal.fire({
                    title: "Vote submitted",
                    text: "Your vote has been submitted, thank you!",
                    icon: "success",
                });
                setPageStatus(PageStatus.CHECKIN);

                // Reset student number since it's no longer needed / new person will be voting
                setStudentNumberInput("");
            }
        })()
            .catch((e) => {
                Swal.fire({
                    title: "Something went wrong",
                    text: "Something went wrong while submitting your ballot. Please try again.",
                    icon: "error",
                });
                console.error(e);
            })
            .finally(() => {
                setSubmittingBallot(false);
            });
    };

    return (
        <>
            <Typography
                variant="h1"
                className="mb-1"
            >
                Your Ballot
            </Typography>
            <Typography
                variant="paragraph"
                className="mb-4"
            >
                This ballot solely belongs to the student {studentNumber}.
            </Typography>

            <div className="flex flex-col gap-6 mb-6">
                {Object.keys(groupedCandidates).map((positionId) => {
                    const position = positions[positionId];
                    const positionCandidates = groupedCandidates[positionId].sort((a, b) => {
                        if (a.fullName < b.fullName) return -1;
                        if (a.fullName > b.fullName) return 1;
                        return 0;
                    });

                    return (
                        <div
                            className="flex flex-col"
                            key={positionId}
                        >
                            <Typography
                                variant="h2"
                                className="mb-2"
                            >
                                {position.name} (Select {position.spotsAvailable})
                            </Typography>

                            <PositionCandidateSelection
                                candidates={positionCandidates}
                                selectedCandidates={selectedCandidates[positionId] || []}
                                onSelect={(candidate) => handleSelect(positionId, candidate)}
                            />
                        </div>
                    );
                })}
            </div>

            <Button
                variant="filled"
                size="lg"
                color="blue"
                disabled={submittingBallot}
                onClick={submitBallot}
            >
                Submit Ballot
            </Button>
        </>
    );
}

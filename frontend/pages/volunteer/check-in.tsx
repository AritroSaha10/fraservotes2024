import { useFirebaseAuth } from "@/components/FirebaseAuthContext";
import Layout from "@/components/Layout";
import { generateVolunteerKey, getVolunteerKeyHash, volunteerKeyLocalStorageKey } from "@/util/volunteerKey";
import { useRouter } from "next/router";
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { Button, Input, Typography } from "@material-tailwind/react";
import { sha256 } from "@/util/hashUsingSHA256";
import { OperationVariables, QueryResult, gql, useApolloClient, useLazyQuery, useQuery } from "@apollo/client";
import Swal from 'sweetalert2'
import Image from "next/image";
import { createMessage, encrypt, readKey } from 'openpgp';

enum PageStatus {
    CHECKIN,
    VOTING
}

const votingStatusQueryOp = gql`
query Query($filter: VotingStatusFilter!) {
  votingStatus(filter: $filter) {
    voted
  }
}
`;

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

const configQueryOp = gql`
query Query {
  config {
    isOpen
    publicKey
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

interface CheckInSectionProps {
    volunteerKeyInput: string;
    setVolunteerKeyInput: Dispatch<SetStateAction<string>>;
    studentNumberInput: string;
    setStudentNumberInput: Dispatch<SetStateAction<string>>;
    pageStatus: PageStatus;
    setPageStatus: Dispatch<SetStateAction<PageStatus>>;
    configQuery: QueryResult<any, OperationVariables>;
}

interface VotingSectionProps {
    studentNumber: string;
    pageStatus: PageStatus;
    setPageStatus: Dispatch<SetStateAction<PageStatus>>;
    setStudentNumberInput: Dispatch<SetStateAction<string>>;
    configQuery: QueryResult<any, OperationVariables>;
}

interface Candidate {
    _id: string;
    biography: string;
    campaignVideo: string;
    fullName: string;
    grade: number;
    picture: string;
    position: {
        _id: string;
    };
}

interface Position {
    _id: string;
    name: string;
    spotsAvailable: number;
}

function CheckInSection({ volunteerKeyInput, setVolunteerKeyInput, studentNumberInput, setStudentNumberInput, pageStatus, setPageStatus, configQuery }: CheckInSectionProps) {
    const [volunteerKeyHash, setVolunteerKeyHash] = useState<string | null>(null);
    const { loading: configLoading, error: configError, data: configData } = configQuery;

    const client = useApolloClient();

    const [checkInLoading, setCheckInLoading] = useState(false);

    useEffect(() => {
        const hash = getVolunteerKeyHash();

        if (hash === null) {
            alert("You don't have a volunteer key set up. The next alert will show your volunteer key.");
            generateVolunteerKey().then(() => setVolunteerKeyHash(getVolunteerKeyHash()));
        } else {
            setVolunteerKeyHash(hash);
        }
    }, []);

    if (configLoading) return <Typography variant="h1">Loading...</Typography>
    if (configError) {
        Swal.fire({
            title: "Something went wrong",
            text: "Something went wrong while loading some data. Please try again.",
            icon: "error"
        });
        console.error(configError);
        return (
            <Typography variant="h1" color="red">Something went wrong :&#41;</Typography>
        )
    }
    
    if (!configData.config.isOpen) {
        return (
            <>
                <Typography variant="h1" className="mb-4">
                    Voting Check-In
                </Typography>

                <Typography variant="lead" className="lg:w-3/4 text-red-500 text-center">
                    Voting is currently closed. Please come back to this website later when voting is open.
                </Typography>
            </>
        )
    }

    const onSubmit = async (e: any) => {
        e.preventDefault();

        setCheckInLoading(true);

        await (async () => {
            const studentNumber = Number(studentNumberInput);

            if (isNaN(studentNumber)) {
                Swal.fire({
                    title: "Invalid student number",
                    text: "Please enter a valid student number.",
                    icon: "error"
                });
                return;
            }

            // First confirm if the key is correct
            const hashedInput = await sha256(volunteerKeyInput);

            if (volunteerKeyHash !== hashedInput) {
                Swal.fire({
                    title: "Volunteer key incorrect",
                    text: "Your volunteer key is incorrect. Please try again.",
                    icon: "error"
                });
                return;
            }

            // Now check if the student has already voted or not
            try {
                const { data } = await client.query({
                    query: votingStatusQueryOp,
                    variables: { 
                        filter: {
                            studentNumber
                        }
                    },
                    fetchPolicy: 'no-cache'
                })
                if (data.votingStatus === null) {
                    Swal.fire({
                        title: "Student number not found",
                        text: "The student number could not be found to be in the allowed voters list. Please check the student number and try again.",
                        icon: "error"
                    });
                    return;
                } else if (data.votingStatus.voted === true) {
                    Swal.fire({
                        title: "Student already voted",
                        text: "A vote has already been submitted with the given student number.",
                        icon: "error"
                    });
                    return;
                }

                // Clear password before switching so it doesn't show up once the user's done voting
                setVolunteerKeyInput("");
                
                setPageStatus(PageStatus.VOTING);
            } catch (err) {
                console.error(err)
                return;
            }
        })();

        setCheckInLoading(false);
    }
    
    return (
        <>
            <Typography variant="h1" className="mb-4">
                Voting Check-In
            </Typography>

            <div className="flex flex-col mb-2">
                <Typography variant="paragraph" color="blue-gray" className="mb-1">
                    Your Volunteer Key <span className="text-red-500">*</span>
                </Typography>

                <input
                    className={`text-sm rounded-md py-2 px-3 w-64 align-middle text-black outline-none ring-1 ring-gray-900/10 focus:ring-blue-700 duration-200 bg-transparent placeholder:text-blue-gray-600`}
                    name="volunteerKey"
                    id="volunteerKey"
                    placeholder="Volunteer key"
                    type="password"
                    required
                    value={volunteerKeyInput}
                    onChange={e => { setVolunteerKeyInput(e.target.value) }}
                    autoComplete="off"
                />

            </div>

            <div className="flex flex-col mb-4">
                <Typography variant="paragraph" color="blue-gray" className="mb-1">
                    User&apos;s Student Number <span className="text-red-500">*</span>
                </Typography>
            
                <input
                    className={`text-sm rounded-md py-2 px-3 w-64 align-middle text-black outline-none ring-1 ring-gray-900/10 focus:ring-blue-700 duration-200 bg-transparent placeholder:text-blue-gray-600`}
                    name="studentNumber"
                    id="studentNumber"
                    placeholder="Student number"
                    required
                    minLength={6}
                    maxLength={7}
                    onChange={e => { setStudentNumberInput(e.target.value.replace(/\D/g,'').substring(0, 7)) }}
                    value={studentNumberInput}
                    autoComplete="off"
                />

            </div>

            <Button color="blue" onClick={onSubmit} disabled={checkInLoading}>
                Open Ballot
            </Button>
        </>
    )
}

interface CandidateCardProps {
    candidate: Candidate;
    isSelected: boolean;
    onSelect: () => void;
}

const CandidateCard: React.FC<CandidateCardProps> = ({ candidate, isSelected, onSelect }) => {
    return (
        <div
            className={`select-none flex items-center gap-2 px-4 py-2 bg-white shadow-lg rounded-xl ${isSelected && "outline outline-2 outline-green-500"} active:outline-green-700 hover:bg-green-50 active:outline active:outline-2 hover:cursor-pointer transition-all duration-100`}
            onClick={onSelect}
        >
            <Image src={candidate.picture} width={64} height={64} className="rounded-lg object-cover aspect-square" alt="" />
            <div>
                <Typography className="text-md font-semibold">{candidate.fullName}</Typography>
                <Typography className="text-sm mb-[4px]">Grade {candidate.grade}</Typography>
                <Typography className="text-xs font-light text-gray-700 tracking-tight">Click to {isSelected ? "deselect" : "select"} me...</Typography>
            </div>
        </div>
    );
}

interface CandidateSelectionProps {
    candidates: Candidate[];
    selectedCandidates: Candidate[];
    onSelect: (candidate: Candidate) => void;
}

const CandidateSelection: React.FC<CandidateSelectionProps> = ({ candidates, selectedCandidates, onSelect }) => {
    return (
        <div className="flex gap-4 flex-wrap max-w-[75vw]">
            {candidates.map(candidate => (
                <CandidateCard
                    key={candidate._id}
                    candidate={candidate}
                    isSelected={selectedCandidates.includes(candidate)}
                    onSelect={() => onSelect(candidate)}
                />
            ))}
        </div>
    );
}

function VotingSection({ pageStatus, setPageStatus, studentNumber, setStudentNumberInput, configQuery }: VotingSectionProps) {
    const { loading: candidateDataLoading, error: candidateDataError, data: candidateData } = useQuery(candidatesQueryOp);
    const { loading: configLoading, error: configError, data: configData } = configQuery;

    const [selectedCandidates, setSelectedCandidates] = useState<Record<string, Candidate[]>>({});
    const [submittingBallot, setSubmittingBallot] = useState(false);

    const client = useApolloClient();

    const handleSelect = (positionId: string, candidate: Candidate) => {
        setSelectedCandidates(prevState => {
            const positionSelectedCandidates = prevState[positionId] || [];
            if (positionSelectedCandidates.includes(candidate)) {
                return {
                    ...prevState,
                    [positionId]: positionSelectedCandidates.filter(c => c !== candidate)
                };
            } else {
                if (positionSelectedCandidates.length >= positions[positionId].spotsAvailable) {
                    return {
                        ...prevState,
                        [positionId]: [...positionSelectedCandidates.slice(1), candidate]
                    };
                } else {
                    return {
                        ...prevState,
                        [positionId]: [...positionSelectedCandidates, candidate]
                    };
                }
            }
        });
    };

    if (candidateDataLoading || configLoading) return <Typography variant="h1">Loading...</Typography>
    if (candidateDataError || configError) {
        Swal.fire({
            title: "Something went wrong",
            text: "Something went wrong while loading some data. Please try again.",
            icon: "error"
        });
        if (candidateDataError) console.error("Error while loading candidate data:", candidateDataError);
        if (configError) console.error("Error while loading config data:", configError)
        setPageStatus(PageStatus.CHECKIN);
        return (
            <Typography variant="h1" color="red">Something went wrong :&#41;</Typography>
        )
    }

    // Sort candidates by position, then sort each candidates by 
    // console.log(data)

    const candidates: Candidate[] = candidateData.candidates;
    const positions: Record<string, Position> = Object.fromEntries(candidateData.positions.map((pos: Position) => [pos._id, pos]));

    // Create an empty dictionary to hold the grouped candidates
    const groupedCandidates: Record<string, Candidate[]> = candidates.reduce((acc, candidate) => {
        const positionId = candidate.position._id;
        if (!acc[positionId]) {
            acc[positionId] = [];
        }
        acc[positionId].push(candidate);
        return acc;
    }, {} as Record<string, Candidate[]>);

    const submitBallot: React.MouseEventHandler<HTMLButtonElement> = (e) => {
        e.preventDefault();
        setSubmittingBallot(true);

        (async () => {
            console.log(selectedCandidates)

            // Make sure each section has the correct number of selections
            const ballotIncomplete = Object.keys(groupedCandidates).some(positionId => {
                const position = positions[positionId];
                if (!(positionId in selectedCandidates) || selectedCandidates[positionId].length !== position.spotsAvailable) {
                    Swal.fire({
                        title: "Incomplete ballot",
                        text: `Please select the correct number of candidates (${position.spotsAvailable}) for the following position: ${position.name}.`,
                        icon: "error"
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
            const selectedChoices = Object.keys(selectedCandidates).map(positionId => ({
                position: positionId,
                candidates: selectedCandidates[positionId].map(candidate => candidate._id)
            }))

            // Encrypt using PGP
            console.log(configData.config.publicKey)
            const publicKey = await readKey({ armoredKey: configData.config.publicKey });
            const encryptedBallot = String(await encrypt({
                message: await createMessage({ text: JSON.stringify(selectedChoices) }),
                encryptionKeys: publicKey,
            }));
            console.log(encryptedBallot)
            
            // Finally, submit to server
            const res = await client.mutate({
                mutation: submitBallotMutationOp,
                variables: {
                    studentNumber: Number(studentNumber),
                    encryptedBallot: encryptedBallot
                },
                fetchPolicy: 'no-cache'
            })

            if (res.errors) {
                Swal.fire({
                    title: "Something went wrong",
                    text: "Something went wrong while submitting your ballot. Please try again.",
                    icon: "error"
                });
                console.error(res.errors)
            } else {
                Swal.fire({
                    title: "Vote submitted",
                    text: "Your vote has been submitted, thank you!",
                    icon: "success"
                });
                setPageStatus(PageStatus.CHECKIN);

                // Reset student number since it's no longer needed / new person will be voting
                setStudentNumberInput("");
            }
        })().catch(e => {
            Swal.fire({
                title: "Something went wrong",
                text: "Something went wrong while submitting your ballot. Please try again.",
                icon: "error"
            });
            console.error(e);
        }).finally(() => {
            setSubmittingBallot(false);
        })
    }

    return (
        <>
            <Typography variant="h1" className="mb-1">Your Ballot</Typography>
            <Typography variant="paragraph" className="mb-4">This ballot solely belongs to the student {studentNumber}.</Typography>

            <div className="flex flex-col gap-6 mb-6">
                {Object.keys(groupedCandidates).map(positionId => {
                    const position = positions[positionId];
                    const positionCandidates = groupedCandidates[positionId].sort((a, b) => {
                        if (a.fullName < b.fullName) return -1;
                        if (a.fullName > b.fullName) return 1;
                        return 0;
                    });

                    return (
                        <div className="flex flex-col" key={positionId}>
                            <Typography variant="h2" className="mb-2">
                                {position.name} (Select {position.spotsAvailable})
                            </Typography>

                            <CandidateSelection
                                candidates={positionCandidates}
                                selectedCandidates={selectedCandidates[positionId] || []}
                                onSelect={(candidate) => handleSelect(positionId, candidate)}
                            />
                        </div>
                    )
                })}
            </div>

            <Button variant="filled" size="lg" color="blue" disabled={submittingBallot} onClick={submitBallot}>
                Submit Ballot
            </Button>
        </>
    )
}

export default function VolunteerCheckIn() {
    const [volunteerKeyInput, setVolunteerKeyInput] = useState("");
    const [studentNumberInput, setStudentNumberInput] = useState("");

    const [pageStatus, setPageStatus] = useState<PageStatus>(PageStatus.CHECKIN);
    const configQuery = useQuery(configQueryOp);

    return (
        <Layout 
            name="Check-in" 
            userProtected 
            className="flex flex-col items-center justify-center py-8" 
            description="The volunteer check-in page for FraserVotes."
        >
            {pageStatus === PageStatus.VOTING ? (
                <VotingSection pageStatus={pageStatus} setPageStatus={setPageStatus} studentNumber={studentNumberInput} setStudentNumberInput={setStudentNumberInput} configQuery={configQuery} />
            ) : (
<CheckInSection volunteerKeyInput={volunteerKeyInput} setVolunteerKeyInput={setVolunteerKeyInput} studentNumberInput={studentNumberInput} setStudentNumberInput={setStudentNumberInput} pageStatus={pageStatus} setPageStatus={setPageStatus} configQuery={configQuery} />
            )}
        </Layout>
    )
}
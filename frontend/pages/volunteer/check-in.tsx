import { useFirebaseAuth } from "@/components/FirebaseAuthContext";
import Layout from "@/components/Layout";
import { generateVolunteerKey, getVolunteerKeyHash, volunteerKeyLocalStorageKey } from "@/util/volunteerKey";
import { useRouter } from "next/router";
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { Button, Input, Typography } from "@material-tailwind/react";
import { sha256 } from "@/util/hashUsingSHA256";
import { gql, useApolloClient, useLazyQuery, useQuery } from "@apollo/client";
import Swal from 'sweetalert2'
import Image from "next/image";

enum PageStatus {
    CHECKIN,
    VOTING
}

const votingStatusQuery = gql`
query Query($filter: VotingStatusFilter!) {
  votingStatus(filter: $filter) {
    voted
  }
}
`;

const candidatesQuery = gql`
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

interface CheckInSectionProps {
    volunteerKeyInput: string;
    setVolunteerKeyInput: Dispatch<SetStateAction<string>>;
    studentNumberInput: string;
    setStudentNumberInput: Dispatch<SetStateAction<string>>;
    pageStatus: PageStatus;
    setPageStatus: Dispatch<SetStateAction<PageStatus>>;
}

interface VotingSectionProps {
    studentNumber: string;
    pageStatus: PageStatus;
    setPageStatus: Dispatch<SetStateAction<PageStatus>>;
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

function CheckInSection({ volunteerKeyInput, setVolunteerKeyInput, studentNumberInput, setStudentNumberInput, pageStatus, setPageStatus }: CheckInSectionProps) {
    const { user, loaded } = useFirebaseAuth();
    const router = useRouter();
    const [volunteerKeyHash, setVolunteerKeyHash] = useState<string | null>(null);

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
                    query: votingStatusQuery,
                    variables: { 
                        filter: {
                            studentNumber
                        }
                    }
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
                    required
                    value={volunteerKeyInput}
                    onChange={e => { setVolunteerKeyInput(e.target.value) }}
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
                />

            </div>

            <Button color="blue" onClick={onSubmit} disabled={checkInLoading}>
                Check-In
            </Button>
        </>
    )
}

function CandidateCard({ candidate }: { candidate: Candidate }) {
    const [selected, setSelected] = useState(false);

    return (
        <div className={`select-none flex items-center gap-2 px-4 py-2 bg-white shadow-lg rounded-xl ${selected && "outline outline-2 outline-green-500"} active:outline-green-700 hover:bg-green-50 active:outline active:outline-2 hover:cursor-pointer transition-all duration-100`} onClick={() => setSelected(!selected)}>
            <Image src={candidate.picture} width={64} height={64} className="rounded-lg object-cover aspect-square" alt="" />
            <div>
                <Typography className="text-md font-semibold">{candidate.fullName}</Typography>
                <Typography className="text-sm mb-[4px]">Grade {candidate.grade}</Typography>
                <Typography className="text-xs font-light text-gray-700 tracking-tight">Click me to {selected ? "deselect" : "select"} me...</Typography>
            </div>
        </div>
    )
}

function VotingSection({ pageStatus, setPageStatus, studentNumber }: VotingSectionProps) {
    const { loading, error, data } = useQuery(candidatesQuery);

    if (loading) return <Typography variant="h1">Loading...</Typography>
    if (error) {
        Swal.fire({
            title: "Something went wrong",
            text: "Something went wrong while loading candidate info. Please try again.",
            icon: "error"
        });
        console.error(error);
        setPageStatus(PageStatus.CHECKIN);
        return (
            <Typography variant="h1" color="red">Something went wrong :&#41;</Typography>
        )
    }

    // Sort candidates by position, then sort each candidates by 
    // console.log(data)

    const candidates: Candidate[] = data.candidates;
    const positions: Record<string, Position> = Object.fromEntries(data.positions.map((pos: Position) => [pos._id, pos]));

    // Create an empty dictionary to hold the grouped candidates
    const groupedCandidates: Record<string, Candidate[]> = candidates.reduce((acc, candidate) => {
        const positionId = candidate.position._id;
        if (!acc[positionId]) {
            acc[positionId] = [];
        }
        acc[positionId].push(candidate);
        return acc;
    }, {} as Record<string, Candidate[]>);

    console.log(groupedCandidates)

    return (
        <>
        <Typography variant="h1" className="mb-1">Your Ballot</Typography>
        <Typography variant="paragraph" className="mb-4">This ballot solely belongs to the student {studentNumber}.</Typography>

        <div className="flex flex-col gap-6">
            {Object.keys(groupedCandidates).map(positionId => {
                const position = positions[positionId];
                const positionCandidates = groupedCandidates[positionId].sort((a, b) => {
                    if (a.fullName < b.fullName) return -1;
                    if (a.fullName > b.fullName) return 1;
                    return 0;
                });

                return (
                    <div className="flex flex-col">
                        <Typography variant="h2" className="mb-2">
                            {position.name} (Select {position.spotsAvailable})
                        </Typography>

                        <div className="flex gap-4 flex-wrap max-w-[75vw]">
                            {positionCandidates.map(candidate => (
                                <CandidateCard candidate={candidate} />
                            ))}
                        </div>
                    </div>
                )
            })}
        </div>
        </>
    )
}

export default function VolunteerCheckIn() {
    const [volunteerKeyInput, setVolunteerKeyInput] = useState("");
    const [studentNumberInput, setStudentNumberInput] = useState("");

    const [pageStatus, setPageStatus] = useState<PageStatus>(PageStatus.CHECKIN);

    return (
        <Layout name="Check-in" userProtected className="flex flex-col items-center justify-center py-8">
            {pageStatus === PageStatus.VOTING ? (
                <VotingSection pageStatus={pageStatus} setPageStatus={setPageStatus} studentNumber={studentNumberInput} />
            ) : (
<CheckInSection volunteerKeyInput={volunteerKeyInput} setVolunteerKeyInput={setVolunteerKeyInput} studentNumberInput={studentNumberInput} setStudentNumberInput={setStudentNumberInput} pageStatus={pageStatus} setPageStatus={setPageStatus} />
            )}
        </Layout>
    )


}
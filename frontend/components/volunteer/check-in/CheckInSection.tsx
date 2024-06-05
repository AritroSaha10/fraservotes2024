import { Dispatch, SetStateAction, useEffect, useState } from "react";

import PageStatus from "@/types/volunteer/check-in/pageStatus";
import { OperationVariables, QueryResult, gql, useApolloClient } from "@apollo/client";
import { Button, Typography } from "@material-tailwind/react";
import Swal from "sweetalert2";

import { sha256 } from "@/util/hashUsingSHA256";
import { generateVolunteerKey, getVolunteerKeyHash } from "@/util/volunteerKey";

const votingStatusQueryOp = gql`
    query Query($filter: VotingStatusFilter!) {
        votingStatus(filter: $filter) {
            voted
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

export default function CheckInSection({
    volunteerKeyInput,
    setVolunteerKeyInput,
    studentNumberInput,
    setStudentNumberInput,
    setPageStatus,
    configQuery,
}: CheckInSectionProps) {
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

    if (configLoading) return <Typography variant="h1">Loading...</Typography>;
    if (configError) {
        Swal.fire({
            title: "Something went wrong",
            text: "Something went wrong while loading some data. Please try again.",
            icon: "error",
        });
        console.error(configError);
        return (
            <Typography
                variant="h1"
                color="red"
            >
                Something went wrong :&#40;
            </Typography>
        );
    }

    if (!configData.config.isOpen) {
        return (
            <>
                <Typography
                    variant="h1"
                    className="mb-4"
                >
                    Voting Check-In
                </Typography>

                <Typography
                    variant="lead"
                    className="lg:w-3/4 text-red-500 text-center"
                >
                    Voting is currently closed. Please come back to this website later when voting is open.
                </Typography>
            </>
        );
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
                    icon: "error",
                });
                return;
            }

            // First confirm if the key is correct
            const hashedInput = await sha256(volunteerKeyInput);

            if (volunteerKeyHash !== hashedInput) {
                Swal.fire({
                    title: "Volunteer key incorrect",
                    text: "Your volunteer key is incorrect. Please try again.",
                    icon: "error",
                });
                return;
            }

            // Now check if the student has already voted or not
            try {
                const { data } = await client.query({
                    query: votingStatusQueryOp,
                    variables: {
                        filter: {
                            studentNumber,
                        },
                    },
                    fetchPolicy: "no-cache",
                });
                if (data.votingStatus === null) {
                    Swal.fire({
                        title: "Student number not found",
                        text: "The student number could not be found to be in the allowed voters list. Please check the student number and try again.",
                        icon: "error",
                    });
                    return;
                } else if (data.votingStatus.voted === true) {
                    Swal.fire({
                        title: "Student already voted",
                        text: "A vote has already been submitted with the given student number.",
                        icon: "error",
                    });
                    return;
                }

                // Clear password before switching so it doesn't show up once the user's done voting
                setVolunteerKeyInput("");

                setPageStatus(PageStatus.VOTING);
            } catch (err) {
                console.error(err);
                return;
            }
        })();

        setCheckInLoading(false);
    };

    return (
        <>
            <Typography
                variant="h1"
                className="mb-4"
            >
                Voting Check-In
            </Typography>

            <div className="flex flex-col mb-2">
                <Typography
                    variant="paragraph"
                    color="blue-gray"
                    className="mb-1"
                >
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
                    onChange={(e) => {
                        setVolunteerKeyInput(e.target.value);
                    }}
                    autoComplete="off"
                />
            </div>

            <div className="flex flex-col mb-4">
                <Typography
                    variant="paragraph"
                    color="blue-gray"
                    className="mb-1"
                >
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
                    onChange={(e) => {
                        setStudentNumberInput(e.target.value.replace(/\D/g, "").substring(0, 7));
                    }}
                    value={studentNumberInput}
                    autoComplete="off"
                />
            </div>

            <Button
                color="blue"
                onClick={onSubmit}
                disabled={checkInLoading}
            >
                Open Ballot
            </Button>
        </>
    );
}

import { useFirebaseAuth } from "@/components/FirebaseAuthContext";
import Layout from "@/components/Layout";
import { generateVolunteerKey, getVolunteerKeyHash, volunteerKeyLocalStorageKey } from "@/util/volunteerKey";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import { Button, Input, Typography } from "@material-tailwind/react";
import { sha256 } from "@/util/hashUsingSHA256";
import { gql, useApolloClient, useLazyQuery } from "@apollo/client";
import Swal from 'sweetalert2'

const votingStatusQuery = gql`
query Query($filter: VotingStatusFilter!) {
  votingStatus(filter: $filter) {
    voted
  }
}
`;

export default function VolunteerCheckIn() {
    const { user, loaded } = useFirebaseAuth();
    const router = useRouter();
    const [volunteerKeyHash, setVolunteerKeyHash] = useState<string | null>(null);

    const [volunteerKeyInput, setVolunteerKeyInput] = useState("");
    const [studentNumberInput, setStudentNumberInput] = useState("");

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
            } catch (err) {
                console.error(err)
                return;
            }
        })();

        setCheckInLoading(false);
    }
    
    return (
        <Layout name="Check-in" userProtected className="flex flex-col items-center justify-center">
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
        </Layout>
    )
}
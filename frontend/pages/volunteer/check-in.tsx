import { useState } from "react";

import { gql, useQuery } from "@apollo/client";

import Layout from "@/components/Layout";
import PageStatus from "@/types/volunteer/check-in/pageStatus";
import CheckInSection from "@/components/volunteer/check-in/CheckInSection";
import VotingSection from "@/components/volunteer/check-in/VotingSection";

const configQueryOp = gql`
    query Query {
        config {
            isOpen
            publicKey
        }
    }
`;

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
                <VotingSection
                    pageStatus={pageStatus}
                    setPageStatus={setPageStatus}
                    studentNumber={studentNumberInput}
                    setStudentNumberInput={setStudentNumberInput}
                    configQuery={configQuery}
                />
            ) : (
                <CheckInSection
                    volunteerKeyInput={volunteerKeyInput}
                    setVolunteerKeyInput={setVolunteerKeyInput}
                    studentNumberInput={studentNumberInput}
                    setStudentNumberInput={setStudentNumberInput}
                    pageStatus={pageStatus}
                    setPageStatus={setPageStatus}
                    configQuery={configQuery}
                />
            )}
        </Layout>
    );
}

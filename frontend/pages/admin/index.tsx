import { useMemo } from "react";

import { gql, useQuery } from "@apollo/client";
import { CheckIcon } from "@heroicons/react/16/solid";
import { Typography } from "@material-tailwind/react";
import { MaterialReactTable, useMaterialReactTable, type MRT_ColumnDef } from "material-react-table";
import Swal from "sweetalert2";

import Layout from "@/components/Layout";

const mainDataQueryOp = gql`
    query MainData {
        config {
            isOpen
        }
        completedVotingStatusesCount
        votingStatusesCount
    }
`;

const votingStatusesQueryOp = gql`
    query VotingStatusesLazy {
        votingStatuses {
            studentNumber
            voted
        }
    }
`;

interface VotingStatus {
    studentNumber: number;
    voted: boolean;
}

export default function AdminPage() {
    const {
        loading: mainDataLoading,
        error: mainDataError,
        data: mainData,
    } = useQuery(mainDataQueryOp, { pollInterval: 30000 });
    const {
        loading: votingStatusesLoading,
        error: votingStatusesError,
        data: votingStatusesData,
    } = useQuery(votingStatusesQueryOp, { pollInterval: 30000 });

    //should be memoized or stable
    const columns = useMemo<MRT_ColumnDef<VotingStatus>[]>(
        () => [
            {
                accessorKey: "studentNumber",
                header: "Student #",
                size: 50,
            },
            {
                accessorKey: "voted",
                header: "Voted?",
                size: 50,
                Cell: ({ cell }) => (
                    <div className="flex items-center justify-center">
                        <div
                            className={`w-6 h-6 border border-gray-300 rounded-md ${cell.getValue() ? "bg-blue-gray-500" : "bg-white"}`}
                        >
                            {cell.getValue() ? <CheckIcon className="w-4 h-4 text-white mx-auto my-1" /> : <></>}
                        </div>
                    </div>
                ),
            },
        ],
        [],
    );

    const table = useMaterialReactTable({
        columns,
        data: votingStatusesLoading ? [] : (votingStatusesData.votingStatuses as VotingStatus[]),
    });

    if (mainDataError || votingStatusesError) {
        Swal.fire({
            title: "Something went wrong",
            text: "Something went wrong while loading some data. Please try again.",
            icon: "error",
        });
        if (mainDataError) console.error("Error while fetching main data:", mainDataError);
        if (votingStatusesError) console.error("Error while fetching voting statuses data:", votingStatusesError);
        return (
            <Typography
                variant="h1"
                color="red"
            >
                Something went wrong :&#41;
            </Typography>
        );
    }

    const isOpen = mainData?.config.isOpen;
    const currentVotes = mainData?.completedVotingStatusesCount;
    const totalVoters = mainData?.votingStatusesCount;
    const turnOutPercentage = Math.floor((currentVotes / totalVoters) * 1000) / 100;

    return (
        <Layout
            name="Admin page"
            adminProtected
            className="flex flex-col p-8 items-center"
        >
            <Typography
                variant="h1"
                className="mb-4"
            >
                Overview
            </Typography>

            <Typography
                variant="h3"
                color="blue-gray"
                className="mb-2"
            >
                Voting is{" "}
                <span className={isOpen ? "text-green-500" : "text-red-500"}>{isOpen ? "open" : "closed"}</span>.
            </Typography>
            <Typography
                variant="h4"
                color="gray"
                className="mb-6"
            >
                ~{isNaN(turnOutPercentage) ? "..." : turnOutPercentage}% ballots submited (
                {isNaN(currentVotes) ? "..." : currentVotes}/{isNaN(totalVoters) ? "..." : totalVoters})
            </Typography>

            <Typography
                variant="h2"
                className="mb-4"
            >
                Voter List
            </Typography>
            <div className="w-full lg:w-2/3">
                <MaterialReactTable table={table} />
            </div>
        </Layout>
    );
}

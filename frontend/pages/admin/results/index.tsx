import { useRouter } from "next/router";

import { gql, useQuery } from "@apollo/client";
import { Card, CardBody, Typography } from "@material-tailwind/react";
import Swal from "sweetalert2";

import Layout from "@/components/Layout";

const ALL_RESULTS_QUERY = gql`
    query AllResults {
        allResults {
            _id
            timestamp
        }
    }
`;

function ResultCards() {
    const { loading, error, data } = useQuery(ALL_RESULTS_QUERY);
    const router = useRouter();

    if (error) {
        Swal.fire({
            title: "Something went wrong",
            text: "Something went wrong while loading the results. Please try again.",
            icon: "error",
        });
        console.error("Error while fetching main data:", error);
        return (
            <Typography
                variant="h3"
                color="red"
            >
                Something went wrong :(
            </Typography>
        );
    }

    // TODO: Improve later to be nicer
    if (loading) {
        return <Typography variant="h3">Loading...</Typography>;
    }

    return (
        <div className="flex flex-wrap justify-center gap-6">
            {data.allResults.map((result: any) => (
                <Card
                    key={result._id}
                    className="cursor-pointer max-w-xs hover:bg-gray-100 duration-75 transition-colors"
                    onClick={() => router.push(`/admin/results/${result._id}`)}
                >
                    <CardBody className="flex flex-col items-center text-center">
                        <Typography variant="h6">
                            Ballot Count at {new Date(result.timestamp * 1000).toLocaleString()}
                        </Typography>

                        <Typography
                            variant="paragraph"
                            color="gray"
                        >
                            Click me to view results...
                        </Typography>
                    </CardBody>
                </Card>
            ))}
            {data.allResults.length === 0 ? (
                <div className="flex flex-col gap-2 text-center items-center">
                    <Typography
                        variant="h3"
                        color="red"
                    >
                        No results were found :(
                    </Typography>

                    <Typography
                        variant="lead"
                        color="gray"
                    >
                        You can check this page when a ballot count is run.
                    </Typography>
                </div>
            ) : (
                <></>
            )}
        </div>
    );
}

export default function AdminResultsPage() {
    return (
        <Layout
            name="Admin Results"
            adminProtected
            className="flex flex-col p-8 items-center"
        >
            <Typography
                variant="h1"
                className="mb-4"
            >
                Election Results
            </Typography>

            <ResultCards />
        </Layout>
    );
}

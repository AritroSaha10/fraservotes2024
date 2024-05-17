import { gql, useQuery } from "@apollo/client";
import { useRouter } from "next/router";
import { Chart } from "react-google-charts";
import { Typography } from "@material-tailwind/react";
import Layout from "@/components/Layout";

const RESULT_QUERY = gql`
  query Result($id: ID!) {
    result(id: $id) {
      _id
      timestamp
      positions {
        position {
          name
        }
        candidates {
          candidate {
            fullName
          }
          votes
        }
      }
    }
  }
`;

function ResultsComponent() {
    const router = useRouter();
    const { id } = router.query;

    const { loading, error, data } = useQuery(RESULT_QUERY, {
        variables: { id },
        skip: !id, // Skip the query if id is not provided
    });

    if (error) {
        Swal.fire({
            title: "Something went wrong",
            text: "Something went wrong while loading the results. Please try again.",
            icon: "error",
        });
        console.error("Error while fetching main data:", error);
        return (
            <Typography variant="h3" color="red">Something went wrong :(</Typography>
        );
    }

    // TODO: Improve later to be nicer
    if (loading) {
        return (
            <Typography variant="h3">Loading...</Typography>
        );
    }

    if (!data || !data.result) {
        return (
            <>
                <Typography variant="h2" className="mb-4" color="red">404 - Result Not Found</Typography>
                <Typography variant="paragraph">
                    The result you are looking for does not exist. Please check the URL or go back to the results page.
                </Typography>
            </>
        );
    }

    const { result } = data;

    return (
        <>
            <Typography variant="h4" className="mb-4 text-center">
                Calculated at {new Date(result.timestamp * 1000).toLocaleString()}
            </Typography>

            {result.positions.map((positionResult) => (
                <div key={positionResult.position.name} className="w-[90vw] lg:w-[70vw] mb-8">
                    <Typography variant="h2" className="mb-2 text-center lg:text-left">
                        {positionResult.position.name}
                    </Typography>

                    <Chart
                        chartType="PieChart"
                        data={[
                            ["Candidate", "Votes"],
                            ...positionResult.candidates.map((candidateResult) => [
                                candidateResult.candidate.fullName,
                                candidateResult.votes,
                            ]),
                        ]}
                        width="100%"
                        height="300px"
                    />
                </div>
            ))}
        </>
    );
}

export default function ResultsIndividualPage() {
    return (
        <Layout name="Result Details" adminProtected className="flex flex-col p-8 items-center">
            <Typography variant="h1" className="mb-4 text-center">Result Details</Typography>
            <ResultsComponent />
        </Layout>
    )
}
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

export default function ResultPage() {
  const router = useRouter();
  const { id } = router.query;

  const { loading, error, data } = useQuery(RESULT_QUERY, {
    variables: { id },
    skip: !id, // Skip the query if id is not provided
  });

  if (loading) return <Typography>Loading...</Typography>;
  if (error) return <Typography>Error: {error.message}</Typography>;

  if (!data || !data.result) {
    return (
      <Layout name="Result Not Found">
        <Typography variant="h1" className="mb-4">404 - Result Not Found</Typography>
        <Typography variant="paragraph">
          The result you are looking for does not exist. Please check the URL or go back to the results page.
        </Typography>
      </Layout>
    );
  }

  const { result } = data;

  return (
    <Layout name="Result Details" adminProtected className="flex flex-col p-8 items-center">
      <Typography variant="h1" className="mb-4 text-center">Result Details</Typography>
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
    </Layout>
  );
}

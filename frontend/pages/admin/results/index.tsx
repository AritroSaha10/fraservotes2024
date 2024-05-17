import { gql, useQuery } from "@apollo/client";
import { useRouter } from "next/router";
import { Card, CardBody, Typography } from "@material-tailwind/react";
import Layout from "@/components/Layout";

const ALL_RESULTS_QUERY = gql`
  query AllResults {
    allResults {
      _id
      timestamp
    }
  }
`;

export default function AdminResultsPage() {
  const { loading, error, data } = useQuery(ALL_RESULTS_QUERY);
  const router = useRouter();

  if (loading) return <Typography>Loading...</Typography>;
  if (error) return <Typography>Error: {error.message}</Typography>;

  return (
    <Layout name="Admin Results" adminProtected className="flex flex-col p-8 items-center">
      <Typography variant="h1" className="mb-4">Election Results</Typography>
      <div className="flex flex-wrap justify-center gap-6">
        {data.allResults.map((result) => (
          <Card
            key={result._id}
            className="cursor-pointer max-w-xs"
            onClick={() => router.push(`/admin/results/${result._id}`)}
          >
            <CardBody>
              <Typography variant="h6">
                {new Date(result.timestamp * 1000).toLocaleString()}
              </Typography>
            </CardBody>
          </Card>
        ))}
      </div>
    </Layout>
  );
}

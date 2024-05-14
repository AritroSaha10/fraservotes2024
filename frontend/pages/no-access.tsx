import Layout from "@/components/Layout";

export function NoAccessComponent() {
    return (
        <div
            className="flex flex-col h-screen flex-grow justify-center"
            key="page-404"
        >
            <div className="flex flex-col items-center p-8">
                <h1 className="text-8xl text-center mb-2 font-semibold text-red-500">403</h1>
                <h2 className="text-3xl text-center mb-6 text-black">Forbidden</h2>

                <p className="text-xl text-center mb-6 text-gray-700 lg:w-3/4">
                    Sorry, you don&apos;t have access to this website. This is only accessible to volunteers and admins helping with
                    the SAC voting process. If you believe you should have access, please contact Aritro, Thoa, or an SAC teacher supervisor.
                    You have been automatically signed out.
                </p>
            </div>
        </div>
    )
}

export default function NoAccess() {
    return (
        <Layout name="403 Forbidden">
            <NoAccessComponent />
        </Layout>
    );
}
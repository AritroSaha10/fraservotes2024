import { Typography } from "@material-tailwind/react";

export default function Footer({ showLink }: { showLink?: boolean }) {
    return (
        <footer className="flex w-full flex-row flex-wrap items-center justify-center gap-y-2 gap-x-4 border-t border-blue-gray-50 bg-white/20 py-3 px-2 text-center">
            <Typography
                color="blue-gray"
                className="font-normal"
            >
                Made with 💙 by{" "}
                <a
                    href="https://www.aritrosaha.ca"
                    target="_blank"
                    onClick={(e) => {
                        if (!showLink) e.preventDefault();
                    }}
                    rel="noreferrer"
                    className="text-blue-500 hover:underline hover:text-blue-700"
                >
                    Aritro Saha
                </a>
                .
            </Typography>
        </footer>
    );
}

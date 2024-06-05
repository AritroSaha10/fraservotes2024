
import Image from "next/image";

import { Typography } from "@material-tailwind/react";

import Candidate from "@/types/candidate";

interface CandidateCardProps {
    candidate: Candidate;
    isSelected: boolean;
    onSelect: () => void;
}

const CandidateCard: React.FC<CandidateCardProps> = ({ candidate, isSelected, onSelect }) => {
    return (
        <div
            className={`select-none flex items-center gap-2 px-4 py-2 bg-white shadow-lg rounded-xl ${isSelected && "outline outline-2 outline-green-500"} active:outline-green-700 hover:bg-green-50 active:outline active:outline-2 hover:cursor-pointer transition-all duration-100`}
            onClick={onSelect}
        >
            <Image
                src={candidate.picture}
                width={64}
                height={64}
                className="rounded-lg object-cover aspect-square"
                alt=""
            />
            <div>
                <Typography className="text-md font-semibold">{candidate.fullName}</Typography>
                <Typography className="text-sm mb-[4px]">Grade {candidate.grade}</Typography>
                <Typography className="text-xs font-light text-gray-700 tracking-tight">
                    Click to {isSelected ? "deselect" : "select"} me...
                </Typography>
            </div>
        </div>
    );
};

export default CandidateCard;
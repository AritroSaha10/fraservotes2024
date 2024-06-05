import CandidateCard from "./CandidateCard";
import Candidate from "@/types/candidate";

interface PositionCandidateSelectionProps {
    candidates: Candidate[];
    selectedCandidates: Candidate[];
    onSelect: (candidate: Candidate) => void;
}

const PositionCandidateSelection: React.FC<PositionCandidateSelectionProps> = ({
    candidates,
    selectedCandidates,
    onSelect,
}) => {
    return (
        <div className="flex gap-4 flex-wrap max-w-[75vw]">
            {candidates.map((candidate) => (
                <CandidateCard
                    key={candidate._id}
                    candidate={candidate}
                    isSelected={selectedCandidates.includes(candidate)}
                    onSelect={() => onSelect(candidate)}
                />
            ))}
        </div>
    );
};

export default PositionCandidateSelection;

import SelectedChoice from "./selectedBallotChoice";

export default interface DecryptedBallot {
    encryptedBallotId: string;
    selectedChoices: SelectedChoice[];
}

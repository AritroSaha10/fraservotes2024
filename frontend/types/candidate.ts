export default interface Candidate {
    _id: string;
    fullName: string;
    grade: number;
    picture: string;
    position: {
        _id: string;
    };
}

export default interface Candidate {
    _id: string;
    biography: string;
    campaignVideo: string;
    fullName: string;
    grade: number;
    picture: string;
    position: {
        _id: string;
    };
}

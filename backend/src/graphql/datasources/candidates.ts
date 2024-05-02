import { MongoDataSource } from 'apollo-datasource-mongodb'
import { ObjectId } from 'mongodb'
import { GraphQLError } from 'graphql';
import { PositionDocument } from './positions';

interface Candidate {
    _id: ObjectId
    fullName: string
    position: PositionDocument
    biography: string
    grade: number
    picture: string
    campaignVideo: string
}

export default class Candidates extends MongoDataSource<Candidate> {
    async getCandidate(id: ObjectId | string) {
        const data = await this.findOneById(id);
        if (data === null || data === undefined) {
            throw new GraphQLError('No candidate exists with the given ID.', {
                extensions: {
                    code: 'NOT_FOUND',
                },
            });
        }

        return data;
    }

    getCandidates() {
        // @ts-ignore
        return this.model!.find().exec()
    }
}
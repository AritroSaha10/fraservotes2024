import { MongoDataSource } from 'apollo-datasource-mongodb'
import Config, { ConfigDocument } from '../../models/config.js';
import { isValidPGPPublicKey } from '../../util/isValidPGPPublicKey.js';
import { GraphQLError } from 'graphql';

export default class ConfigDataSource extends MongoDataSource<ConfigDocument> {
    async get() {
        let voting = await this.model.findOne();
        if (!voting) {
            voting = await this.model.create({ publicKey: null });
        }
        return voting;
    }

    async updateVotingOpen(open: boolean) {
        // Make sure the document exists
        const data = await this.get();
        if (open === true && (data.publicKey === null || !(await isValidPGPPublicKey(data.publicKey)))) {
            throw new GraphQLError('Private key does not exist or is invalid', {
                extensions: {
                    code: 'BAD_REQUEST',
                    http: { status: 400  }
                },
            });
        }

        return await Config.findByIdAndUpdate(data.id, { isOpen: open }, { new: true });
    }

    async updatePublicKey(publicKey: string) {
        if (publicKey !== null && !(await isValidPGPPublicKey(publicKey))) {
            throw new GraphQLError('Given public key is invalid', {
                extensions: {
                    code: 'BAD_REQUEST',
                    http: { status: 400 }
                },
            });
        }

        // Make sure the document exists
        const data = await this.get();
        return await Config.findByIdAndUpdate(data.id, { publicKey }, { new: true });
    }
}
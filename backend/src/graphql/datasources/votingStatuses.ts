import { MongoDataSource } from "apollo-datasource-mongodb";
import { ObjectId } from "mongodb";
import { VotingStatusDocument } from "../../models/votingStatus";

export default class VotingStatuses extends MongoDataSource<VotingStatusDocument> {
  updateVotingStatus(studentNumber: number, status: boolean) {
    return this.model.findOneAndUpdate(
      { studentNumber: studentNumber },
      { voted: status },
      { new: true }
    ).exec();
  }

  getVotingStatuses() {
    return this.model.find().exec();
  }

  getVotingStatusById(id: ObjectId) {
    return this.model.findById(id).exec();
  }

  getVotingStatusByStudentNumber(studentNumber: number) {
    return this.model.findOne({ studentNumber: studentNumber }).exec();
  }
}

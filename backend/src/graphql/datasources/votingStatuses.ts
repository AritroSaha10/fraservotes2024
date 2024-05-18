import { MongoDataSource } from "apollo-datasource-mongodb";
import { ObjectId } from "mongodb";
import type { VotingStatusDocument } from "src/models/votingStatus";

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

  getVotingStatusesCount() {
    return this.model.countDocuments().exec();
  }

  getCompletedVotingStatusesCount() {
    return this.model.countDocuments({ voted: true }).exec();
  }

  getVotingStatusById(id: ObjectId) {
    return this.model.findById(id).exec();
  }

  getVotingStatusByStudentNumber(studentNumber: number) {
    return this.model.findOne({ studentNumber: studentNumber }).exec();
  }

  clearVotingStatuses() {
    return this.model.updateMany({ voted: true }, { "$set": { voted: false } });
  }
}

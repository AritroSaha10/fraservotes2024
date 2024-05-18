import { MongoDataSource } from "apollo-datasource-mongodb";
import { ObjectId } from "mongodb";
import type { ResultsDocument } from "src/models/results";

export default class ResultsDataSource extends MongoDataSource<ResultsDocument> {
  addResults(results: ResultsDocument) {
    return this.model.create(results);
  }

  getAllResults() {
    return this.model.find().exec();
  }

  getResult(id: ObjectId) {
    return this.model.findById(id).exec();
  }

  deleteAllResults() {
    return this.model.deleteMany({ });;
  }
}

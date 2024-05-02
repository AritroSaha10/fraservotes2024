import { MongoDataSource } from 'apollo-datasource-mongodb'
import { ObjectId } from 'mongodb'

interface PositionDocument {
    _id: ObjectId
    name: string
    spotsAvailable: number
}

export default class Positions extends MongoDataSource<PositionDocument> {
  getPosition(id: ObjectId | string) {
    return this.findOneById(id)
  }
  getPositions() {
    // @ts-ignore
    return this.model!.find().exec()
  }
}
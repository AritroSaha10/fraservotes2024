import fs from "fs";
import csv from "csv-parser";
import { finished } from "stream/promises";
import mongoose from "mongoose";

import "dotenv/config";
import VotingStatus from "../models/votingStatus";

const readCSV = async (filePath: string) => {
  const results = [];
  const readStream = fs.createReadStream(filePath).pipe(csv());

  readStream.on("data", (data) => results.push(data));

  await finished(readStream); // Use finished from stream/promises directly

  return results;
};

const main = async () => {
  mongoose.connect(process.env.MONGODB_CONNECTION_STR);

  const [fileName, studentNumberColHeader] = process.argv.slice(2); // Capture command-line arguments

  if (!fileName || !studentNumberColHeader) {
    console.log(
      "Usage: tsx addAllowedVoters.ts <filename.csv> <student number column header>"
    );
    process.exit(1);
  }

  try {
    const data = await readCSV(fileName);
    if (data.length === 0) {
      throw "No entries in CSV";
    }
    if (!(studentNumberColHeader in data[0])) {
      throw "Student # col header not found in data";
    }

    const newVotingStatuses = await Promise.all(
      data.map(async (row, idx) => {
        if (!(studentNumberColHeader in row)) {
          throw `Student # not found for row #${idx}`;
        }

        const studentNumber = Number(row[studentNumberColHeader]);
        if (Number.isNaN(studentNumber)) {
          throw `Student # in row #${idx} not a real number (${row[studentNumberColHeader]})`;
        }

        // Check if voting status already exists for user
        console.log(
          `Checking if student #${studentNumber} already has a voting status entry...`
        );
        if ((await VotingStatus.exists({ studentNumber })) !== null) {
          console.warn(
            `Student #${studentNumber} already has a voting status, ignoring...`
          );
          return null;
        }

        console.log(
          `Student #${studentNumber} is new, queueing to add later...`
        );

        return {
          studentNumber,
          voted: false,
        };
      })
    );
    const filteredVotingStatuses = newVotingStatuses.filter(
      (val) => val !== null
    );

    if (filteredVotingStatuses.length > 0) {
      await VotingStatus.insertMany(newVotingStatuses);
    }
    console.log(
      `Successfully added ${
        filteredVotingStatuses.length
      } new voting statuses, ignored ${
        newVotingStatuses.length - filteredVotingStatuses.length
      } existing voting statuses.`
    );
    process.exit(0);
  } catch (error) {
    console.error("Error importing allowed voters:", error);
    process.exit(1);
  }
};

main();

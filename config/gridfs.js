const mongoose = require("mongoose");
const { GridFSBucket } = require("mongodb");

let bucket;

mongoose.connection.once("open", () => {
  bucket = new GridFSBucket(mongoose.connection.db, {
    bucketName: "images",
  });
  console.log("✅ GridFS bucket ready");
});

const getBucket = () => bucket;

module.exports = { getBucket };

/* eslint-disable no-restricted-syntax, no-unused-vars */
import fs from 'fs'
import path from 'path'

const AWS = require('aws-sdk')
const mime = require('mime-types')

// TODO: region is hardcoded, because the S3 component also hardcodes it.
const S3 = new AWS.S3({ region: 'us-east-1' })

function* listFiles(filePath) {
  let fileNames
  try {
    fileNames = fs.readdirSync(filePath)
  } catch (readdirError) {
    // presume the error occurred because the path is not a directory
    yield filePath
    return
  }

  for (const file of fileNames) {
    yield* listFiles(path.join(filePath, file))
  }
}

const deploy = async (inputs, options, state, context) => {
  const staticContentPath = path.join(process.cwd(), inputs.files)

  const uploadedFiles = []
  const uploadRequests = []
  for (const file of listFiles(staticContentPath)) {
    uploadRequests.push(S3.putObject({
      Bucket: inputs.name,
      Key: path.relative(staticContentPath, file),
      Body: fs.readFileSync(file),
      ContentType: mime.lookup(file),
      ACL: 'public-read'
    })
      .promise()
      .then(() => uploadedFiles.push(file)))
  }

  await Promise.all(uploadRequests)

  const outputs = { uploadedFiles }
  return outputs
}

module.exports = {
  deploy
}

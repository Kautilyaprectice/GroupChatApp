const User = require("../models/user");
const Message = require("../models/message");
const Sequelize = require('sequelize');
const Group = require("../models/group");
const AWS = require('aws-sdk');

exports.getAllMessages = async (req, res, next) => {
    try {
        const groupId = req.params.groupId;  
        const lastMessageId = req.query.lastMessageId;
        const queryOptions = {
            where: { groupId: groupId }, 
            include: {
                model: User,
                attributes: ['id', 'name']
            },
            order: [['createdAt', 'ASC']]
        };

        if (lastMessageId) {
            queryOptions.where.id = { [Sequelize.Op.gt]: lastMessageId };
        }

        const messages = await Message.findAll(queryOptions);
        res.status(200).json(messages);
    } catch (err) {
        console.error('Error fetching messages:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.createMessage = async (req, res, next) => {
    const { content } = req.body; 
    const userId = req.user.id;
    const groupId = req.params.groupId;

    try {
        const messageContent = await Message.create({ content, userId, groupId });
        const messageWithUser = await Message.findOne({
            where: { id: messageContent.id },
            include: {
                model: User,
                attributes: ['id', 'name']
            }
        });
        res.status(201).json(messageWithUser);
    } catch (err) {
        console.error('Error creating message:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.upload = async (req, res, next) => {
    try {
        const groupId = req.body.groupId;
        const file = req.file; // Ensure this matches the key in FormData
        const userId = req.user.id;

        if (!file || !groupId) {
            return res.status(400).json({ error: 'File and groupId are required' });
        }

        const fileName = Date.now() + '-' + file.originalname; // Unique file name
        const fileData = file.buffer;
        const fileUrl = await uploadToS3(fileData, fileName);

        const messageContent = fileUrl;
        const message = await Message.create({
            content: messageContent,
            userId,
            groupId
        });
        const messageWithUser = await Message.findOne({
            where: { id: message.id },
            include: {
                model: User,
                attributes: ['id', 'name']
            }
        });

        res.status(201).json(messageWithUser);

    } catch (err) {
        console.error('Error uploading file:', err); // Log the error for debugging
        res.status(500).json({ error: `Internal Server Error: ${err.message}` }); // Provide the error message in response
    }
};

function uploadToS3(data, filename) {
    const bucketName = process.env.BUCKET_NAME;
    const iam_user_key = process.env.IAM_USER_KEY;
    const iam_user_secret = process.env.IAM_USER_SECRET;

    let s3bucket = new AWS.S3({
        accessKeyId: iam_user_key,
        secretAccessKey: iam_user_secret
    });

    var params = {
        Bucket: bucketName,
        Key: filename,
        Body: data,
    };

    return new Promise((resolve, reject) => {
        s3bucket.upload(params, (err, s3response) => {
            if (err) {
                console.error('Error uploading to S3:', err);
                reject(err);
            } else {
                console.log('Upload success', s3response);
                resolve(s3response.Location);
            }
        });
    });
};
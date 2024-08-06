const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const sequelize = require('./util/database');
const User = require('./models/user');
const Message = require('./models/message');
const Group = require('./models/group');
const GroupMember = require('./models/groupMember');

const userRoutes = require('./routes/user');
const messageRoutes = require('./routes/message');
const groupRoutes = require('./routes/group');

const app = express();
app.options('*', cors());
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

app.use(cors({
    origin: '*',
    methods: 'GET,POST,PUT,DELETE',
    allowedHeaders: 'Content-Type,Authorization'
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/', userRoutes);
app.use('/', messageRoutes);
app.use('/', groupRoutes);

User.belongsToMany(Group, { through: GroupMember });
Group.belongsToMany(User, { through: GroupMember });

Group.hasMany(Message);
Message.belongsTo(Group);

User.hasMany(Message);
Message.belongsTo(User);

io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    socket.on('joinGroup', ({ groupId }) => {
        socket.join(groupId);
        console.log(`Socket ${socket.id} joined group ${groupId}`);
    });

    socket.on('sendMessage', async ({ groupId, userId, content }) => {
        try {
            const message = await Message.create({ groupId, userId, content });
            const fullMessage = await Message.findByPk(message.id, {
                include: {
                    model: User,
                    attributes: ['id', 'name']
                }
            });
            io.to(groupId).emit('receiveMessage', fullMessage);
        } catch (error) {
            console.error('Error sending message:', error);
        }
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

sequelize.sync()
    .then(() => {
        server.listen(3000, () => {
            console.log('Server running on port 3000');
        });
    })
    .catch((err) => console.error('Database sync error', err));
